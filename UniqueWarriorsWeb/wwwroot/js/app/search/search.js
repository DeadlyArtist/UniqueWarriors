
class SectionSearch {
    constructor(searchContainer, structuredSectionOverviews) {
        structuredSectionOverviews ??= [];
        let overviews = structuredSectionOverviews;
        this.overviews = overviews;
        this.container = searchContainer;

        // Filters
        this.filters = [];
        this.filterChanged = false;
        this.storageKey = "SectionSearchFilters";

        // Search highlight
        this.rangesByNode = new Map(); // Buffers ranges for deferred highlighting
        this.lastSearchTimestamp = null;
        this.waitingToHighlight = false;
        this.searchHighlightDisabled = false;

        this.setup();
        this.loadFiltersFromStorage();
        for (let overview of this.overviews) {
            overview.sections.streamBatch(s => this.update(true));
        }
    }

    addSectionOverviews(overviews) {
        this.updateFilterTypes();

        for (let overview of overviews) {
            this.overviews.push(overview);
            overview.sections.streamBatch(s => this.update(true));
        }
    }

    getPathKey() {
        // Generate a unique key for this path
        return getPath();
    }

    setup() {
        this.searchListElement = fromHTML(`<div class="listContainerHorizontal smallGap">`);
        this.container.appendChild(this.searchListElement);

        this.filterDropdown = fromHTML(`<select tooltip="Filters of same type are combined with OR, filters of different types are combined with AND.">`);
        this.searchListElement.appendChild(this.filterDropdown);
        this.filterDropdown.addEventListener('change', e => {
            this.filterChanged = true;
            this.update()
        });
        this.updateFilterTypes();

        this.searchElement = fromHTML(`<input type="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Search" aria-label="Search" />`);
        this.searchListElement.appendChild(this.searchElement);
        this.searchElement.addEventListener('search', () => this.update());
        this.searchElement.addEventListener('keyup', (e) => {
            if (e.key === "Enter") {
                this.addFilter();
            } else {
                this.update();
            }
        });

        this.plusButton = fromHTML(`<button class="largeElement bordered hoverable listHorizontal" tooltip="Add as filter (or press Enter)" disabled>`);
        let plusIcon = icons.add();
        plusIcon.classList.add('minimalIcon');
        this.plusButton.appendChild(plusIcon);
        this.searchListElement.appendChild(this.plusButton);
        this.plusButton.addEventListener('click', e => this.addFilter());

        this.beforeFilterBreak = hb(1);
        this.container.appendChild(this.beforeFilterBreak);
        this.beforeFilterBreak.classList.add('hide');

        this.filterListElement = fromHTML(`<div class="listHorizontal">`);
        this.container.appendChild(this.filterListElement);
        this.filters = [];

        this.container.appendChild(hb(2));
    }

    updateFilterTypes() {
        this.filterDropdown.innerHTML = "";
        for (let type of this.getFilterTypes()) {
            let option = fromHTML(`<option>`);
            option.value = type;
            option.text = type;
            option.selected = option.value == "Text";
            this.filterDropdown.appendChild(option);
        }
    }

    getFilterTypes() {
        let allChoices = ['Text', 'Category', 'Name'];
        if (this.overviews.some(o => o.sections.getAll().some(structuredSection => [...structuredSection.section.tags].some(tag => tag.includes('Action'))))) {
            allChoices.push('Action Type');
        }
        if (this.overviews.some(o => o.sections.getAll().some(structuredSection => structuredSection.section.headValues.has('Connections')))) {
            allChoices.push('Connections');
        }
        return allChoices;
    }

    loadFiltersFromStorage() {
        const allFilters = JSON.parse(localStorage.getItem(this.storageKey)) || {};
        const pathKey = this.getPathKey();
        const savedData = allFilters[pathKey];

        if (!savedData) return;

        try {
            const { filters, currentSearch } = savedData;

            // Restore filters
            for (let filter of filters) {
                filter.value = filter.rawValue.toLowerCase().trim();
                this.filters.push(filter);
                this.renderFilterElement(filter);
            }

            // Restore the current search term/type
            if (currentSearch) {
                this.filterDropdown.value = currentSearch.type || "Text";
                this.searchElement.value = currentSearch.term || "";
            }

            this.update();
        } catch (e) {
            console.error("Failed to load filters from local storage:", e);
        }
    }

    storeFiltersInLocalStorage() {
        const pathKey = this.getPathKey();
        const allFilters = JSON.parse(localStorage.getItem(this.storageKey)) || {};

        // Update filters for the current path
        let trimmedFilters = clone(this.filters);
        trimmedFilters.forEach(filter => delete filter.value);
        allFilters[pathKey] = {
            filters: trimmedFilters,
            currentSearch: {
                type: this.filterDropdown.value,
                term: this.searchElement.value,
            },
        };

        // Save back to localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(allFilters));
    }

    renderFilterElement(filter) {
        const { type, value, rawValue } = filter;
        let filterElement = fromHTML(`<div class="smallElement bordered listHorizontal">`);
        this.filterListElement.appendChild(filterElement);
        let filterLabel = fromHTML(`<div class="noLineHeight">`);
        filterElement.appendChild(filterLabel);
        filterLabel.textContent = type + ": " + rawValue;
        let deleteFilterButton = fromHTML(`<button class="listHorizontal" tooltip="Remove filter">`);
        filterElement.appendChild(deleteFilterButton);
        deleteFilterButton.addEventListener('click', e => this.removeFilter(filterElement));
        let closeIcon = icons.close();
        closeIcon.classList.add('minimalIcon');
        deleteFilterButton.appendChild(closeIcon);

        this.beforeFilterBreak.classList.remove('hide');
    }

    isDuplicateFilter() {
        let type = this.filterDropdown.value;
        let searchTerm = this.lastSearchTerm;
        return this.filters.some(filter => filter.type === type && filter.value === searchTerm);
    }

    addFilter() {
        let searchTerm = this.lastSearchTerm;
        if (!searchTerm || this.isDuplicateFilter()) return;

        let filterType = this.filterDropdown.value;
        let rawValue = this.searchElement.value;
        let filter = { type: filterType, value: searchTerm, rawValue: rawValue };
        this.filters.push(filter);

        this.renderFilterElement(filter);

        this.filterChanged = true;
        this.searchElement.value = "";
        this.storeFiltersInLocalStorage();
        this.update();
    }

    removeFilter(filterElement) {
        const filterType = filterElement.textContent.split(":")[0].trim();
        const searchTerm = filterElement.textContent.split(":")[1].trim();
        this.filters = this.filters.filter(f => !(f.type === filterType && f.rawValue === searchTerm));
        filterElement.remove();

        if (this.filters.length == 0) this.beforeFilterBreak.classList.add('hide');

        this.filterChanged = true;
        this.storeFiltersInLocalStorage();
        this.update();
    }

    getSearchTerm() {
        return this.searchElement.value.toLowerCase().trim();;
    }

    parseSearchTerm(searchTerm) {
        const isInverse = searchTerm.startsWith('!');
        if (isInverse) searchTerm = searchTerm.slice(1);

        const isExactMatch = searchTerm.startsWith('?');
        if (isExactMatch) searchTerm = searchTerm.slice(1);

        return {
            searchTerm,
            isInverse,
            isExactMatch,
        };
    }

    update(force = false) {
        let searchTerm = this.getSearchTerm();
        if (!force && searchTerm == this.lastSearchTerm && !this.filterChanged) return;
        this.filterChanged = false;
        this.lastSearchTerm = searchTerm;
        this.lastSearchTimestamp = Date.now();
        this.rangesByNode = new Map();
        for (let overview of this.overviews) {
            this.unhighlightSections(overview.sectionListElement);
        }

        if (searchTerm && !this.isDuplicateFilter()) this.plusButton.removeAttribute('disabled');
        else this.plusButton.setAttribute('disabled', '');

        let filters = [...this.filters];
        filters.push({ type: this.filterDropdown.value, value: searchTerm });
        this.storeFiltersInLocalStorage();

        const filtersByType = {};
        for (let filter of filters) {
            if (!filtersByType[filter.type]) {
                filtersByType[filter.type] = [];
            }
            filtersByType[filter.type].push(filter);
        }

        for (let overview of this.overviews) {
            for (let structuredSection of overview.sections) {
                let visible = this.applyAllFilters(structuredSection, filtersByType);
                structuredSection.wrapperElement.classList.toggle('hiddenSearchElement', !visible);
            }
        }

        for (let overview of this.overviews) {
            if (overview.type == SectionHelpers.MasonryType) overview.sectionListElement._masonry?.resize();
        }

        this.tryHighlightSections();
    }

    applyAllFilters(structuredSection, filtersByType) {
        return Object.entries(filtersByType).every(([type, filters]) => {
            // Combine same type filters with OR logic
            return filters.some(filter => this.applyFilter(structuredSection, filter));
        });
    }

    applyFilter(structuredSection, filter) {
        const { type, value } = filter;
        const { searchTerm, isInverse, isExactMatch } = this.parseSearchTerm(value);
        if (!searchTerm) return (!isInverse && !isExactMatch) || (isInverse && isExactMatch);

        // Check if the current section matches the filter based on type
        let targets = this.getFilterTargets(type, structuredSection);
        let match = this.searchTargets(searchTerm, isExactMatch, targets);

        let subSectionMatch = structuredSection.subSections.getAll().some(subSection =>
            this.applyFilter(subSection, filter)
        );

        // If it's a match and not inversed, collect highlight ranges
        if (!isInverse && match) {
            this.collectHighlightRangesForSection(searchTerm, isExactMatch, targets);
        }

        const finalMatch = match || subSectionMatch;
        return isInverse ? !finalMatch : finalMatch;
    }

    getFilterTargets(filterType, structuredSection) {
        if (filterType === "Text") {
            return [
                structuredSection.titleElement,
                ...(structuredSection.attributesElement?.querySelectorAll('.section-attribute') || []),
                structuredSection.contentElement,
                ...(structuredSection.tableElement?.querySelectorAll('.section-table-cell') || []),
            ];
        }
        if (filterType === "Name") {
            return [structuredSection.titleElement];
        }
        if (filterType === "Category") {
            return [...(structuredSection.attributesElement?.querySelectorAll('.section-attribute') || [])]
                .filter(e => e.classList.contains('section-headValue') &&
                    ["Weapon", "Weapon Core", "Path", "Path Core", "Mastery", "Summon"].includes(e._headValue?.name))
                .map(e => e.querySelector('.section-headValue-value'));
        }
        if (filterType === "Action Type") {
            return [...(structuredSection.attributesElement?.querySelectorAll('.section-actionType, .section-actionTypes') || [])];
        }
        if (filterType === "Connections") {
            return [...(structuredSection.attributesElement?.querySelectorAll('.section-attribute') || [])]
                .filter(e => e.classList.contains('section-headValue') && e._headValue?.name === "Connections")
                .map(e => e.querySelector('.section-headValue-value'));
        }
        return [];
    }


    searchTargets(searchTerm, isExactMatch, targets) {
        if (!targets) return false;
        targets = targets.filter(t => t);

        return targets.some(element => {
            if (!element || element.textContent == null) return false;
            const text = element.textContent.toLowerCase();
            return isExactMatch ? text === searchTerm : text.includes(searchTerm);
        });
    }

    collectHighlightRangesForSection(searchTerm, isExactMatch, targets) {
        if (!targets) return;
        targets = targets.filter(t => t); // Ensure valid elements exist

        for (let element of targets) {
            if (!element || element.textContent == null) continue;

            let nodes = getTextNodesFast(element);
            let text = getTextFromTextNodes(nodes);

            // Find all indices where the search term matches
            let indices = [];
            if (isExactMatch) {
                if (element.textContent.toLowerCase() === searchTerm) indices.push(0);
            } else {
                indices = findAllIndicesInString(text.toLowerCase(), searchTerm);
            }

            for (let index of indices) {
                let nodeInfoByIndices = findTextNodesByIndices(nodes, index, index + searchTerm.length - 1);

                for (let [_, nodeInfo] of Object.entries(nodeInfoByIndices)) {
                    const node = nodeInfo.node;
                    const relativeIndex = nodeInfo.relativeIndex;

                    if (!this.rangesByNode.has(node)) {
                        this.rangesByNode.set(node, []);
                    }

                    // Store the relative index along with the search term
                    this.rangesByNode.get(node).push({ relativeIndex, searchTerm });
                }
            }
        }
    }


    unhighlightSections(container) {
        let highlightedElements = [...container.getElementsByClassName("search-highlight")];
        for (let element of highlightedElements) {
            element.outerHTML = element.innerHTML;
        }
    }

    async waitToHighlightSections() {
        // Wait for a buffer delay to avoid excessive highlighting
        if (this.waitingToHighlight) return;
        this.waitingToHighlight = true;

        do {
            if (!this.tryHighlightSections()) {
                await sleep(this.lastWaitTime);
            }
        } while (this.waitingToHighlight);
    }

    tryHighlightSections() {
        if (this.searchHighlightDisabled) {
            this.waitingToHighlight = false;
            return true;
        }

        // Determine if highlighting is safe to proceed
        let rangeCount = 0;
        for (let ranges of this.rangesByNode.values()) {
            rangeCount += ranges.length;
        }
        let tooManyHighlightRanges = rangeCount >= 200;
        this.lastWaitTime = clamp(rangeCount, 200, 5000) / 2;
        let waitIsOver = this.lastSearchTimestamp + this.lastWaitTime <= Date.now();
        if (!tooManyHighlightRanges || waitIsOver) {
            this.waitingToHighlight = false;

            // Highlight sections with a DOM-safe approach
            for (let [node, ranges] of this.rangesByNode.entries()) {
                if (window.getComputedStyle(node.parentElement).display == "none") continue;
                try {
                    this.highlightRangesInNode(node, ranges);
                } catch (error) {
                    console.error("Error highlighting section:", error, node, ranges);
                }
            }
            return true;
        } else if (!this.waitingToHighlight) {
            this.waitToHighlightSections();
        }
        return false;
    }

    highlightRangesInNode(node, ranges) {
        if (!node || node.nodeType !== Node.TEXT_NODE) {
            return;
        }

        // Convert ranges into a stable order
        const sortedRanges = [...ranges].sort((a, b) => a.relativeIndex - b.relativeIndex);

        // Safely split the text content and wrap matches with a <span>
        const text = node.nodeValue;
        const fragments = [];
        let lastIndex = 0;

        for (let { relativeIndex, searchTerm } of sortedRanges) {
            const start = relativeIndex;
            const end = start + searchTerm.length;

            // Ensure no overlap exists
            if (start < lastIndex) continue;

            // Add non-highlight text before the match
            if (start > lastIndex) {
                fragments.push(document.createTextNode(text.slice(lastIndex, start)));
            }

            // Add highlight span for the matched term
            let highlightSpan = document.createElement("span");
            highlightSpan.className = "search-highlight";
            highlightSpan.textContent = text.slice(start, end);
            fragments.push(highlightSpan);

            // Update last index to avoid overlapping
            lastIndex = end;
        }

        // Add any remaining text after the last match
        if (lastIndex < text.length) {
            fragments.push(document.createTextNode(text.slice(lastIndex)));
        }

        // Replace the original node with the processed fragments
        const parent = node.parentNode;
        for (let fragment of fragments) {
            parent.insertBefore(fragment, node);
        }
        parent.removeChild(node);
    }
}