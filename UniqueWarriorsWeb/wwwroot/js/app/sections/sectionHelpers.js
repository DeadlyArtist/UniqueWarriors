class SectionHelpers {
    static TextType = "text";
    static MasonryType = "masonry";

    /**
     * Either section or array of sections works as param.
     * Warning: Always returns an array.
     */
    static modify(sections, settings) {
        if (settings == null) return;
        let wasArray = true;
        if (!isArray(sections)) {
            sections = [sections];
            wasArray = true;
        }

        if (settings.classify) {
            sections = this.classify(sections);
        } else if (settings.clone) {
            if (settings.noChildren) sections = sections.map(section => section.cloneWithoutSubSections());
            else sections = sections.map(section => section.clone());
        }

        if (settings.anchor) sections.forEach(s => s.anchor = settings.anchor);

        if (settings.name && !settings.mutation) sections.forEach(s => s.title = settings.name);

        if (settings.addChild) settings.addChildren = [settings.addChild];
        if (settings.removeChild) settings.removeChildren = [settings.removeChild];

        if (settings.replaceChildren) {
            settings.noChildren = true;
            settings.addChildren = settings.replaceChildren;
        }
        if (settings.noChildren) sections.forEach(s => s.clearSubSections());
        if (settings.addChildren) sections.forEach(s => {
            if (sections.length > 1) settings.addChildren = clone(settings.addChildren);
            this.adjustHeightLevel(settings.addChildren, s.height + 1);
            settings.addChildren.forEach(c => s.addSubSection(c));
        });
        if (settings.removeChildren) sections.forEach(s => settings.removeChildren.forEach(c => s.removeSubSection(c)));
        if (settings.remove) sections.forEach(s => s.removeSubSection(settings.remove));

        if (settings.parent) {
            sections = this.addTopLevelSection(sections, {
                section: settings.parent,
                height: settings.parentHeight ?? 0,
                heightOffset: settings.parentHeightOffset ?? 1,
            });
        } else if (settings.parentTitle) {
            sections = sections.map(s => this.addTopLevelSection([s], {
                title: settings.parentTitle,
                height: settings.parentTitleHeight ?? 0,
                heightOffset: settings.parentTitleHeightOffset ?? 1,
            })[0]);
        }

        if (settings.title != null) {
            sections = this.addTopLevelSection(sections, {
                title: settings.title,
                height: settings.titleHeight ?? 0,
                heightOffset: settings.titleHeightOffset ?? 1,
            });
        }

        if (settings.height != null) {
            this.adjustHeightLevel(sections, settings.height);
        }

        if (settings.mutation) {
            sections.forEach(section => this.setupMutation(section, settings.mutation, settings.mutationTitle || settings.name));
        }

        if (settings.setupAbilities) {
            sections.forEach(section => this.setupAbility(section));
        }

        return sections;
    }

    static getInitModifySettings() {
        return {
            classify: true,
            height: 1,
            setupAbilities: true,
        };
    }

    static getPathModifierSettings(modifiers, section, encoded = false) {
        if (!encoded) modifiers = modifiers.map(part => SectionReferenceHelpers.pathEncoder.encode(part));
        let settings = {
            height: 1,
        };
        for (let modifier of modifiers) {
            let parts = modifier.split('=').map(part => SectionReferenceHelpers.pathEncoder.unescape(part));
            if (parts.length == 1) settings[parts[0]] = true;
            else if (parts.length == 2) settings[parts[0]] = parts[1];
        }

        if (settings.addChild) settings.addChildren = settings.addChild;
        delete settings.addChild;
        if (settings.removeChild) settings.removeChildren = settings.removeChild;
        delete settings.removeChild;

        if (settings.replaceChildren) {
            settings.noChildren = true;
            settings.addChildren = settings.replaceChildren;
            delete settings.replaceChildren;
        }
        if (settings.addChildren) settings.addChildren = this.resolveMultipleSectionsExpression(settings.addChildren);
        if (settings.removeChildren) settings.removeChildren = this.resolveMultipleSectionsExpression(settings.removeChildren);
        if (settings.parent) {
            if (settings.parent === true) {
                settings.parent = section.parent;
            } else {
                settings.parent = this.resolveSectionExpression(settings.parent);
            }
        }

        if (settings.parentTitle) {
            settings.parentTitle = section.parent.title;
            settings.parentTitleHeightOffset = section.height - section.parent.height;
        }

        settings.classify = false;
        settings.setupAbilities = false;
        settings.clone = true;

        return settings;
    }

    static resolveSectionExpression(expression, multiple = false) {
        let paths = expression.split('&');

        let sections = [];
        for (let path of paths) {
            let modifiers = SectionReferenceHelpers.pathEncoder.encode(path).split('*');
            path = modifiers.shift();
            let section = this.resolvePath(path, true);
            if (!section) {
                if (!multiple) return null;
                continue;
            }
            let modifyResult = SectionHelpers.modify(section, this.getPathModifierSettings(modifiers, section, true));
            if (!multiple) return modifyResult[0];
            modifyResult.forEach(s => sections.push(s));
        }
        return sections;
    }

    static resolveMultipleSectionsExpression(expression) {
        return this.resolveSectionExpression(expression, true);
    }

    static resolvePath(path, encoded = false) {
        if (!encoded) path = SectionReferenceHelpers.pathEncoder.encode(part);
        let parts = path.split('/').map(part => SectionReferenceHelpers.pathEncoder.unescape(part));
        if (parts.length < 2) return null;
        let registry = Registries.all[parts.shift()];
        let sectionId = parts.pop();
        for (let part of parts) {
            registry = registry.get(part)?.subSections;
            if (!registry) return null;
        }
        return registry.get(sectionId);
    }

    static classify(sections) {
        sections.forEach(s => s.SubSections = s.SubSections?.filter(sub => !sub.Title?.includes("(Example Mutation)")));
        let newSections = [];
        for (const section of sections) {
            if (section instanceof Section) continue;
            newSections.push(Section.classify(section));
        }

        return newSections;
    }

    static adjustHeightLevel(sections, heightLevel = 1) {
        if (!sections) return sections;

        let lowestHeight = 99999;
        for (let section of sections) if (section.height < lowestHeight) lowestHeight = section.height;
        let offset = lowestHeight - heightLevel;

        for (let section of sections) {
            section.height -= offset;
            if (section.subSections) section.subSections.forEach(s => this.adjustHeightLevel([s], s.height - offset));
        }

        return sections;
    }

    static addTopLevelSection(sections, settings = null) {
        settings ??= {};
        settings.height ??= 0;
        settings.heightOffset ??= 1;
        this.adjustHeightLevel(sections, settings.height + settings.heightOffset);

        let section;
        if (settings.section) {
            section = settings.section.cloneWithoutSubSections();
            section.height = settings.height;
            sections.forEach(s => section.addSubSection(s));
        } else if (settings.title != null) {
            section = new Section({
                title,
                height,
                subSections: sections, // Nest all current sections as subsections
            });
        }

        return [section];
    }

    static setupAbility(section) {
        if (section instanceof Section) return;
    }

    static setupMutation(section, mutation, mutationTitle) {
        mutation = mutation.replace(/ Mutation$/, "");
        section.removeHeadValue("Connections");
        section.addHeadValue("Mutation", `<${section.title}> + <${mutation} Mutation>`, { lineIndex: 0 });
        section.title = mutationTitle;

        let weapon = section.getHeadValueValue("Weapon");
        let weaponCore = section.getHeadValueValue("Weapon Core");
        let headValueName = weapon ? "Weapon" : "Weapon Core";
        let headValueValue = (weapon || weaponCore) + " + " + mutation;
        section.addHeadValue(headValueName, headValueValue, { update: true });


        let mutationSection = Registries.techniques.get(mutation + " Mutation");
        if (!mutationSection) return;

        // Handle "Damage"
        const damageInfo = DamageHelpers.parseAttribute(section.getHeadValueValue("Damage"));
        if (!damageInfo) return;
        const mutationDamage = DamageHelpers.parseAttribute(mutationSection.getHeadValueValue("Base Damage"));

        // Special case: If "rolled damage" content exists, only update types, not the dice
        if (!section.content || section.content.includes("rolled damage")) {
            if (mutationDamage) {
                const damageTypes = DamageHelpers.mergeTypes(damageInfo?.types, mutationDamage?.types);
                const newDamageValue = DamageHelpers.formatDiceDamage(damageInfo?.dice, damageTypes); // Keep original dice, just update types
                section.addHeadValue("Damage", newDamageValue, { update: true });
            }
        } else {
            if (mutationDamage) {
                const damage = DamageHelpers.updateDiceDamage(damageInfo?.dice, mutationDamage?.dice);
                const damageTypes = DamageHelpers.mergeTypes(damageInfo?.types, mutationDamage?.types);
                const newDamageValue = DamageHelpers.formatDiceDamage(damage, damageTypes);
                section.addHeadValue("Damage", newDamageValue, { update: true });
            }
        }

        // Handle other attributes
        const attributesToMutate = ["Accuracy", "Graze Range", "Crit Range"];
        for (const attribute of attributesToMutate) {
            let sectionValueRaw = section.getHeadValueValue(attribute);
            let mutationValueRaw = mutationSection.getHeadValueValue(attribute);
            if (mutationValueRaw == null) continue;

            let sectionValue = 0;
            if (sectionValueRaw != null) {
                const negativeSection = sectionValueRaw.startsWith('-');
                sectionValueRaw = sectionValueRaw.replace(/^[+-]{2}?\s*/, "");
                sectionValue = negativeSection ? -parseInt(sectionValueRaw) : parseInt(sectionValueRaw);
            }

            const negativeMutation = mutationValueRaw.startsWith('-');
            mutationValueRaw = mutationValueRaw.replace(/^[+-]{2}?\s*/, "");
            const mutationValue = negativeMutation ? -parseInt(mutationValueRaw) : parseInt(mutationValueRaw);

            const totalValue = sectionValue + mutationValue;

            // Add or update the attribute with the correctly formatted modifier (++ or --)
            const formattedValue = DamageHelpers.formatModifierValue(totalValue);
            section.addHeadValue(attribute, formattedValue, { update: sectionValueRaw != null });
        }
    }

    static generateStructuredHtmlForSection(section, type, settings = null) {
        settings ??= {};
        const sectionElement = fromHTML(`<div class="section">`);
        const structuredSection = new StructuredSectionHtml(
            type,
            section,
            sectionElement,
            sectionElement,
            settings,
        );

        let needsBreak = false;

        let titleElement = null;
        if (section.title) {
            const headerLevel = Math.min(Math.max(1, section.height), 6);
            titleElement = fromHTML(`<h${headerLevel} class="section-title">`);
            titleElement.textContent = section.title;
            sectionElement.appendChild(titleElement);
        } 

        // Need to extract embedded (summon) variables before here.
        let attributesElement = null;
        if (section.attributes?.length > 0) {
            needsBreak = true;
            attributesElement = fromHTML(`<div class="section-attributes applySnippets markTooltips">`);
            section.attributes.forEach(attributeList => {
                let attributesLine = fromHTML(`<div class="section-attributesLine">`);
                attributesElement.appendChild(attributesLine);
                attributeList.forEach((attr, index) => {
                    let attributeElement;
                    if (SectionAttributesHelpers.isTag(attr)) {
                        let isActionTag = attr.includes('Action');
                        if (isActionTag) attr = attr.split(' + ').map(actionType => `<span class="section-actionType">${escapeHTML(actionType)}</span>`).join(' + ');
                        else attr = escapeHTML(attr);
                        attributeElement = fromHTML(`<span class="section-attribute section-tag">${attr}</span>`);
                        if (isActionTag) attributeElement.classList.add('section-actionTypes');
                    } else if (SectionAttributesHelpers.isHeadValue(attr)) {
                        attributeElement = fromHTML(`<span class="section-attribute section-headValue"><span class="section-headValue-name">${escapeHTML(attr.name)}</span>: <span class="section-headValue-value">${escapeHTML(attr.value)}</span></span>`);
                        attributeElement._headValue = attr;
                    }
                    attributesLine.appendChild(attributeElement);
                    if (index < attributeList.length - 1) attributesLine.appendChild(document.createTextNode(", "));
                });
            });
            sectionElement.appendChild(attributesElement);
        }


        let contentElement = null;
        if (section.content) {
            needsBreak = true;
            contentElement = fromHTML(`<div class="section-content fixText applySnippets markTooltips">`);

            // Convert markdown links to html
            const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
            const htmlContent = escapeHTML(section.content).replace(markdownLinkRegex, '<a class="textLink" href="$2">$1</a>');

            contentElement.innerHTML = htmlContent;
            sectionElement.appendChild(contentElement);
        }

        let tableElement = null;
        if (section.table) {
            if (needsBreak) sectionElement.appendChild(hb(2));
            needsBreak = true;
            tableElement = fromHTML(SectionTableHelpers.generateTableHTML(section));
            tableElement.classList.add('applySnippets');
            sectionElement.appendChild(tableElement);
        }


        structuredSection.titleElement = titleElement;
        structuredSection.attributesElement = attributesElement;
        structuredSection.contentElement = contentElement;
        structuredSection.tableElement = tableElement;

        if (section.subSections?.length > 0) {
            section.subSections.forEach(subSection => {
                structuredSection.addSubSection(subSection);
            });
        }

        SectionReferenceHelpers.addTooltips(attributesElement, settings.variables);
        SectionReferenceHelpers.addTooltips(contentElement, settings.variables);
        SectionReferenceHelpers.addTooltips(tableElement, settings.variables);

        return structuredSection;
    }

    static generateStructuredHtmlForSectionOverview(sections, type, settings = null) {
        settings ??= {};
        let container = fromHTML(`<div class="section-overview listContainerVertical children-w-100">`);

        let searchContainer;
        if (settings.addSearch) {
            searchContainer = fromHTML(`<div class="sticky">`);
            container.appendChild(searchContainer);
        }

        let sectionListElement;
        if (type === this.TextType) {
            sectionListElement = fromHTML(`<div class="listContainerVertical mediumGap children-w-100">`);
        } else if (type === this.MasonryType) {
            sectionListElement = fromHTML(`<div class="masonryGrid" gap-x="20" gap-y="20" min-width="400">`);
        }
        sectionListElement.setAttribute('placeholder', "Loading...");
        container.appendChild(sectionListElement);

        const overview = new StructuredSectionOverviewHtml(type, container, sectionListElement, searchContainer, settings);
        sections.forEach(section => overview.addSection(section));
        if (!settings.dontInitSearch) overview.initSearch();

        return overview;
    }

    static wrapSectionForOverview(section, type, settings = null) {
        const structuredSection = this.generateStructuredHtmlForSection(section, type, settings);
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
    constructor(type, section, element, wrapperElement, settings = null) {
        this.type = type;
        this.section = section;
        this.element = element;
        this.wrapperElement = wrapperElement;
        this.settings = settings;
        this.titleElement = null;
        this.attributesElement = null;
        this.contentElement = null;
        this.tableElement = null;
        this.subSectionContainer = null;
        this.subSections = new Registry(); // Structured sections

        element._section = section;
        element._structuredSection = this;
        wrapperElement._section = section;
        wrapperElement._structuredSection = this;
    }

    addSubSection(subSection, insertSettings = {}) {
        if (!this.subSectionContainer) {
            this.subSectionContainer = fromHTML(`<div class="section-subSections listVertical halfMediumGap children-w-100">`);
            this.wrapperElement.appendChild(this.subSectionContainer);
        }

        let needsBreak = this.contentElement || this.attributesElement || this.tableElement;
        if (needsBreak && this.subSections.length == 0) {
            this.element.insertBefore(hb(this.section.height > 1 ? 2 : 4), this.subSectionContainer);
        }

        const structuredSubSection = SectionHelpers.generateStructuredHtmlForSection(subSection, this.type, this.settings);

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

        if (this.subSections.length == 0) {
            this.subSectionContainer.previousSibling.remove();
        }
    }
}




class StructuredSectionOverviewHtml {
    constructor(type, container, sectionListElement, searchContainer, settings = null) {
        this.type = type;
        this.container = container;
        this.sectionListElement = sectionListElement;
        this.searchContainer = searchContainer;
        this.settings = settings;
        this.sections = new Registry(); // Structured sections
        this.didSearchInit = false;

        container._sectionOverview = this;
        sectionListElement._sectionOverview = this;
    }

    initSearch() {
        if (!this.searchContainer || this.didSearchInit || this.sections.size == 0) return;
        this.didSearchInit = true;
        this.search = new SectionSearch(this.searchContainer, [this]);
        this.searchContainer._search = this.search;
    }

    addSection(section, insertSettings) {
        insertSettings ??= {};
        const structuredSection = SectionHelpers.wrapSectionForOverview(section, this.type, this.settings);

        let index = this.sections.getInsertIndex(insertSettings.insertBefore, insertSettings.insertAfter);
        if (index !== null) {
            HtmlHelpers.insertAt(this.sectionListElement, index, structuredSection.wrapperElement);
        } else {
            this.sectionListElement.appendChild(structuredSection.wrapperElement);
        }

        this.sections.register(structuredSection, { ...insertSettings, id: structuredSection.section.title });

        if (!this.settings.dontInitSearch) this.initSearch();
    }

    removeSection(section) {
        const structuredSection = this.sections.get(section?.title);
        if (!structuredSection) return;
        structuredSection.wrapperElement.remove();
        this.sections.unregister(structuredSection);
    }
}