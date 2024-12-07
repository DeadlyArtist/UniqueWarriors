class SectionHelpers {
    static TextType = "text";
    static MasonryType = "masonry";

    static modify(sections, settings = null) {
        settings ??= {};

        if (settings.heightLevel != null) {
            if (settings.heightLevel === undefined) settings.heightLevel = 0;
            sections = this.adjustHeightLevel(sections, settings.heightLevel);
        }

        if (settings.title != null) {
            sections = this.addTopLevelSection(sections, settings.title, settings.titleHeight ?? 0);
        }

        if (settings.setupAbilities) {
            sections = sections.map(section => this.setupAbility(section));
        }

        return sections;
    }

    static copyWithoutSubsections(section) {
        let copiedSection = clone(section);
        copiedSection.subSections = [];
        return copiedSection;
    }

    static adjustHeightLevel(sections, heightLevel = 0) {
        if (!sections || sections.length === 0) return sections;

        // Calculate height adjustment based on the first section
        const firstSection = sections[0];
        const heightOffset = firstSection.height - heightLevel;

        const queue = [...sections]; // Start with top-level sections

        while (queue.length > 0) {
            const current = queue.shift();

            // Adjust the height of the current section
            current.height = current.height - heightOffset;

            // Add all of its subsections to the queue for iterative processing
            if (current.subSections && current.subSections.length > 0) {
                queue.push(...current.subSections);
            }
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

        let headerElement = null;
        if (section.Title) {
            const headerLevel = Math.min(Math.max(1, section.Height), 6);
            headerElement = fromHTML(`<h${headerLevel}>`);
            headerElement.textContent = section.Title;
            sectionElement.appendChild(headerElement);
        }

        let attributesElement = null;
        if (section.Attributes) {
            attributesElement = fromHTML(`<div class="section-attributes">`);
            section.Attributes.forEach(attributeList => {
                let attributesLine = fromHTML(`<div class="section-attributesLine">`);
                attributesElement.appendChild(attributesLine);
                let parts = [];
                attributeList.forEach(attr => {
                    if (SectionAttributesHelpers.isTag(attr)) {
                        parts.push(`<span class="section-tag">${escapeHTML(SectionAttributesHelpers.tryGetTag(attr))}</span>`);
                    } else if (SectionAttributesHelpers.isHeadValue(attr)) {
                        const { Name, Value } = SectionAttributesHelpers.tryGetHeadValue(attr);
                        parts.push(`<span class="section-headValue"><span class="name">${escapeHTML(Name)}</span>: <span class="value">${escapeHTML(Value)}</span></span>`);
                    }
                });
                attributesLine.innerHTML = parts.join(', ');
            });
            sectionElement.appendChild(attributesElement);
        }

        let contentElement = null;
        if (section.Content) {
            contentElement = fromHTML(`<div class="section-content">`);
            contentElement.textContent = section.Content;
            sectionElement.appendChild(contentElement);
        }

        const structuredSection = new StructuredSectionHtml(
            section,
            sectionElement,
            sectionElement
        );

        structuredSection.headerElement = headerElement;
        structuredSection.attributesElement = attributesElement;
        structuredSection.contentElement = contentElement;

        if (section.SubSections) {
            section.SubSections.forEach(subSection => {
                structuredSection.addSubSection(subSection, type);
            });
        }

        return structuredSection;
    }

    static generateStructuredHtmlForSectionOverview(sections, type) {
        const overview = new StructuredSectionOverviewHtml(type);

        if (type === this.TextType) {
            overview.container = fromHTML(`<div class="listContainerVertical children-w-100">`);
            sections.forEach(section => overview.addSection(section, type));
        } else if (type === this.MasonryType) {
            overview.container = fromHTML(`<div class="masonryGrid" gap-x="20" gap-y="20" min-width="400">`);
            sections.forEach(section => overview.addSection(section, type));
        }

        return overview;
    }

    static wrapSectionForOverview(section, type) {
        const structuredSection = this.generateStructuredHtmlForSection(section, type);
        if (type === this.TextType) {
            structuredSection.wrapperElement = fromHTML(`<div class="listVertical smallGap children-w-100">`);
            structuredSection.wrapperElement.appendChild(structuredSection.element);
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
        this.subSectionContainer = null;
        this.subSections = [];
        this.titleDictionary = {};
    }

    addSubSection(subSection, type) {
        const structuredSubSection = SectionHelpers.generateStructuredHtmlForSection(subSection, type);
        this.subSections.push(structuredSubSection);

        if (structuredSubSection.section.Title) {
            this.titleDictionary[structuredSubSection.section.Title] = structuredSubSection;
        }

        if (!this.subSectionContainer) {
            this.subSectionContainer = fromHTML(`<div class="section-subSections">`);
            this.wrapperElement.appendChild(this.subSectionContainer);
        }

        this.subSectionContainer.appendChild(structuredSubSection.wrapperElement);
    }
}



class StructuredSectionOverviewHtml {
    constructor(type) {
        this.type = type;
        this.container = null;
        this.sections = [];
        this.titleDictionary = {};
    }

    addSection(section, type) {
        const structuredSection = SectionHelpers.wrapSectionForOverview(section, type);
        this.sections.push(structuredSection);
        if (structuredSection.section.Title) {
            this.titleDictionary[structuredSection.section.Title] = structuredSection;
        }
        this.container.appendChild(structuredSection.wrapperElement);
    }
}

