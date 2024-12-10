class SectionHelpers {
    static TextType = "text";
    static MasonryType = "masonry";

    static modify(sections, settings) {
        if (settings == null) return;

        if (settings.classify) {
            sections = this.classify(sections);
        }

        if (settings.heightLevel != null) {
            this.adjustHeightLevel(sections, settings.heightLevel);
        }

        if (settings.title != null) {
            sections = this.addTopLevelSection(sections, settings.title, settings.titleHeight ?? 0);
        }

        if (settings.setupAbilities) {
            sections.forEach(section => this.setupAbility(section));
        }

        return sections;
    }

    static getInitModifySettings() {
        return {
            classify: true,
            heightLevel: 1,
            setupAbilities: true,
        };
    }

    static copyWithoutSubSections(section) {
        let copiedSection = clone(section);
        copiedSection.subSections = [];
        return copiedSection;
    }

    static classify(sections) {
        let newSections = [];
        for (const section of sections) {
            newSections.push(Section.classify(section));
        }

        return newSections;
    }

    static adjustHeightLevel(sections, heightLevel = 1) {
        if (!sections) return sections;

        for (let section of sections) {
            const heightOffset = section.height - heightLevel;
            section.height -= heightOffset;
            if (section.subSections) section.subSections.forEach(s => this.adjustHeightLevel([s], s.height - heightOffset));
        }

        return sections;
    }

    static addTopLevelSection(sections, title, titleHeight = 0) {
        // Adjust heights of all original sections and their subsections
        const queue = [...sections];
        while (queue.length > 0) {
            const current = queue.shift();

            current.height += titleHeight;

            if (current.subSections && current.subSections.length > 0) {
                queue.push(...current.subSections);
            }
        }

        const newTopLevelSection = {
            title: title,
            height: titleHeight,
            subSections: sections // Nest all current sections as subsections
        };

        return [newTopLevelSection];
    }

    static setupAbility(section) {

    }

    static generateStructuredHtmlForSection(section, type) {
        const sectionElement = fromHTML(`<div class="section">`);
        let needsBreak = false;

        let headerElement = null;
        if (section.title) {
            const headerLevel = Math.min(Math.max(1, section.height), 6);
            headerElement = fromHTML(`<h${headerLevel}>`);
            headerElement.textContent = section.title;
            sectionElement.appendChild(headerElement);
        } 

        let attributesElement = null;
        if (section.attributes?.length > 0) {
            needsBreak = true;
            attributesElement = fromHTML(`<div class="section-attributes">`);
            section.attributes.forEach(attributeList => {
                let attributesLine = fromHTML(`<div class="section-attributesLine">`);
                attributesElement.appendChild(attributesLine);
                let parts = [];
                attributeList.forEach(attr => {
                    if (SectionAttributesHelpers.isTag(attr)) {
                        parts.push(`<span class="section-tag">${escapeHTML(attr)}</span>`);
                    } else if (SectionAttributesHelpers.isHeadValue(attr)) {
                        parts.push(`<span class="section-headValue"><span class="name">${escapeHTML(attr.name)}</span>: <span class="value">${escapeHTML(attr.value)}</span></span>`);
                    }
                });
                attributesLine.innerHTML = parts.join(', ');
            });
            sectionElement.appendChild(attributesElement);
        }

        let contentElement = null;
        if (section.content) {
            needsBreak = true;
            contentElement = fromHTML(`<div class="section-content">`);
            contentElement.textContent = section.content;
            sectionElement.appendChild(contentElement);
        }

        let tableElement = null;
        if (section.table) {
            if (needsBreak) sectionElement.appendChild(hb(2));
            needsBreak = true;
            tableElement = SectionTableHelpers.generateHtmlForTable(section);
            sectionElement.appendChild(tableElement);
        }

        const structuredSection = new StructuredSectionHtml(
            section,
            sectionElement,
            sectionElement
        );

        structuredSection.headerElement = headerElement;
        structuredSection.attributesElement = attributesElement;
        structuredSection.contentElement = contentElement;
        structuredSection.tableElement = tableElement;

        if (section.subSections?.length > 0) {
            if (needsBreak) sectionElement.appendChild(hb(section.height > 1 ? 2 : 4));
            section.subSections.forEach(subSection => {
                structuredSection.addSubSection(subSection, type);
            });
        }

        return structuredSection;
    }

    static generateStructuredHtmlForSectionOverview(sections, type) {
        let container = fromHTML(`<div class="section-overview listContainerVertical children-w-100">`);

        let sectionListElement;
        if (type === this.TextType) {
            sectionListElement = fromHTML(`<div class="listContainerVertical mediumGap children-w-100">`);
        } else if (type === this.MasonryType) {
            sectionListElement = fromHTML(`<div class="masonryGrid" gap-x="20" gap-y="20" min-width="400">`);
        }
        sectionListElement.setAttribute('placeholder', "Loading...");
        container.appendChild(sectionListElement);

        const overview = new StructuredSectionOverviewHtml(type, container, sectionListElement);
        sections.forEach(section => overview.addSection(section));

        return overview;
    }

    static wrapSectionForOverview(section, type) {
        const structuredSection = this.generateStructuredHtmlForSection(section, type);
        if (type === this.TextType) {
            structuredSection.wrapperElement = structuredSection.element;
        } else if (type === this.MasonryType) {
            structuredSection.wrapperElement = fromHTML(`<div class="masonryGridItem largeElement raised">`);
            structuredSection.wrapperElement.appendChild(structuredSection.element);
        }
        return structuredSection;
    }
}

class StructuredSectionHtml {
    constructor(section, element, wrapperElement) {
        this.section = section;
        this.element = element;
        this.wrapperElement = wrapperElement;
        this.headerElement = null;
        this.attributesElement = null;
        this.contentElement = null;
        this.tableElement = null;
        this.subSectionContainer = null;
        this.subSections = new Registry();

        element.__section = this;
        wrapperElement.__section = this;
    }

    addSubSection(subSection, type, insertSettings = {}) {
        const structuredSubSection = SectionHelpers.generateStructuredHtmlForSection(subSection, type);

        if (!this.subSectionContainer) {
            this.subSectionContainer = fromHTML(`<div class="section-subSections listVertical halfMediumGap children-w-100">`);
            this.wrapperElement.appendChild(this.subSectionContainer);
        }

        const index = this.subSections.getInsertIndex(insertSettings.insertBefore, insertSettings.insertAfter);
        if (index !== null) {
            HtmlHelpers.insertAt(this.subSectionContainer, index, structuredSubSection.wrapperElement);
        } else {
            this.subSectionContainer.appendChild(structuredSubSection.wrapperElement);
        }

        this.subSections.register(structuredSubSection, { ...insertSettings, id: structuredSubSection.section.title });
    }

    removeSubSection(subSection) {
        const structuredSubSection = this.subSections.get(subSection?.title);
        if (!structuredSubSection) return;
        structuredSubSection.wrapperElement.remove();
        this.subSections.unregister(structuredSubSection);
    }
}




class StructuredSectionOverviewHtml {
    constructor(type, container, sectionListElement) {
        this.type = type;
        this.container = container;
        this.sectionListElement = sectionListElement;
        this.sections = new Registry();

        container.__sectionOverview = this;
        sectionListElement.__sectionOverview = this;
    }

    addSection(section, insertSettings) {
        insertSettings ??= {};
        const structuredSection = SectionHelpers.wrapSectionForOverview(section, this.type);

        let index = this.sections.getInsertIndex(insertSettings.insertBefore, insertSettings.insertAfter);
        if (index !== null) {
            HtmlHelpers.insertAt(this.sectionListElement, index, structuredSection.wrapperElement);
        } else {
            this.sectionListElement.appendChild(structuredSection.wrapperElement);
        }

        this.sections.register(structuredSection, { ...insertSettings, id: structuredSection.section.title });
    }

    removeSection(section) {
        const structuredSection = this.sections.get(section?.title);
        if (!structuredSection) return;
        structuredSection.wrapperElement.remove();
        this.sections.unregister(structuredSection);
    }
}