
class SectionSearch {
    constructor(structuredSectionOverview) {
        let overview = structuredSectionOverview;
        this.overview = overview;
        this.container = overview.container;
        this.searchElement = overview.searchElement;
        this.listElement = overview.sectionListElement;
        this.structuredSections = overview.sections;

        // Search highlight
        this.rangesByNode = new Map(); // Buffers ranges for deferred highlighting
        this.lastSearchTimestamp = null;
        this.waitingToHighlight = false;
        this.searchHighlightDisabled = false;

        this.setup();
    }

    setup() {
        this.filterListElement = fromHTML(`<div class="listHorizontal">`);
        this.filterElements = [];


        this.searchElement.addEventListener('search', () => this.update());
        this.searchElement.addEventListener('keyup', () => this.update());
    }

    update() {
        let searchTerm = this.searchElement.value.toLowerCase().trim();

        this.lastSearchTerm = searchTerm;
        this.lastSearchTimestamp = Date.now();
        this.rangesByNode = new Map();
        this.unhighlightSections(this.container);

        for (let structuredSection of this.structuredSections) {
            let found = this.searchSection(structuredSection, searchTerm);
            if (found) structuredSection.wrapperElement.classList.remove('hiddenSearchElement');
            else structuredSection.wrapperElement.classList.add('hiddenSearchElement');
        }

        if (this.overview.type == SectionHelpers.MasonryType) this.overview.sectionListElement._masonry.resize();
        if (!searchTerm) return;

        this.tryHighlightSections();
    }

    searchSection(structuredSection, searchTerm) {
        if (!searchTerm) return true;
        let targets = [];
        targets.push(structuredSection.titleElement);
        structuredSection.attributesElement?.querySelectorAll('.section-attribute').forEach(e => targets.push(e));
        targets.push(structuredSection.contentElement);
        structuredSection.tableElement?.querySelectorAll('.section-table-cell').forEach(e => targets.push(e));
        targets = targets.filter(t => t);

        let match = targets.some((element) => {
            if (!element || element.textContent == null) return false;

            let nodes = getTextNodesFast(element);
            let text = getTextFromTextNodes(nodes);

            // Look for the search term in the text content
            let indices = findAllIndicesInString(text.toLowerCase(), searchTerm);
            if (indices.length > 0) {
                for (let index of indices) {
                    let nodeInfoByIndices = findTextNodesByIndices(nodes, index, index + searchTerm.length - 1);
                    for (let [_, nodeInfo] of Object.entries(nodeInfoByIndices)) {
                        const node = nodeInfo.node;
                        const relativeIndex = nodeInfo.relativeIndex;

                        if (!this.rangesByNode.has(node)) {
                            this.rangesByNode.set(node, new Set());
                        }

                        this.rangesByNode.get(node).add(relativeIndex);
                    }
                }
                return true;
            }
            return false;
        });

        // match comes after to make sure all indices are collected first
        if (structuredSection.subSections.getAll().some(sub => this.searchSection(sub, searchTerm))) return true;
        if (match) return true;
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
                await sleepUntil(this.lastSearchTimestamp + 1000);
            }
        } while (this.waitingToHighlight);
    }

    tryHighlightSections() {
        if (this.searchHighlightDisabled) {
            this.waitingToHighlight = false;
            return true;
        }

        // Determine whether to highlight based on buffer size
        let rangeCount = 0;
        for (let ranges of this.rangesByNode.values()) {
            rangeCount += ranges.size;
        }
        let tooManyHighlightRanges = rangeCount > 500;
        let waitIsOver = this.lastSearchTimestamp + 1000 <= Date.now();
        if (!tooManyHighlightRanges || waitIsOver) {
            this.waitingToHighlight = false;

            // Highlight the sections
            for (let [node, ranges] of this.rangesByNode.entries()) {
                let newHtml = node.nodeValue;

                // Reverse iterate through ranges to avoid interfering indices
                let sortedRanges = [...ranges].sort((a, b) => a - b);
                for (let i = sortedRanges.length - 1; i >= 0; i--) {
                    const start = sortedRanges[i];
                    const end = start + this.lastSearchTerm.length - 1;
                    const before = newHtml.slice(0, start);
                    const match = newHtml.slice(start, end + 1);
                    const after = newHtml.slice(end + 1);
                    newHtml = `${before}<span class="search-highlight">${match}</span>${after}`;
                }

                let tempElement = document.createElement("span");
                node.parentElement.insertBefore(tempElement, node);
                node.parentElement.removeChild(node);
                tempElement.outerHTML = newHtml;
            }
            return true;
        } else if (!this.waitingToHighlight) {
            this.waitToHighlightSections();
        }
        return false;
    }
}