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

        if (settings.name && !settings.mutation) sections.forEach(s => this.setupVariant(s, settings.name));

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

        if (settings.severity) {
            sections.forEach(section => {
                if (section.headValues.has("Severity")) section.updateHeadValue("Severity", settings.severity);
            });
        }

        return sections;
    }

    static initSections(sections, settings = null) {
        settings ??= {};
        return this.modify(sections, { ...this.getInitModifySettings(), ...settings });
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
        if (!encoded) path = SectionReferenceHelpers.pathEncoder.encode(path);
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
        sections.forEach(s => {
            if (s.SubSections) s.SubSections = s.SubSections?.filter(sub => !sub.Title?.includes("(Example Mutation)"))
        });
        let newSections = [];
        for (const section of sections) {
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

    static getMutationId(section, mutation) {
        if (!isString(mutation)) mutation = mutation.title;
        if (!isString(section)) section = section.title;
        mutation = mutation.replace(/ Mutation$/, "");
        return `${mutation}___Mutated___${section}`;
    }

    static getDefaultMutationTitle(section, mutation) {
        if (!isString(mutation)) mutation = mutation.title;
        if (!isString(section)) section = section.title;
        mutation = mutation.replace(/ Mutation$/, "");
        return `${mutation} Mutated ${section}`;
    }

    static getMutated(section, mutation, mutationTitle = null) {
        section = section.clone();
        this.setupMutation(section, mutation, mutationTitle);
        return section;
    }

    static setupMutation(section, mutation, mutationTitle = null) {
        let mutationSection = null;
        if (!isString(mutation)) {
            mutationSection = mutation;
            mutation = mutation.title;
        }
        mutation = mutation.replace(/ Mutation$/, "");
        section.removeHeadValue("Connections");
        section.addHeadValue("Mutation", `<${section.title}> + <${mutation} Mutation>`, { lineIndex: 0 });
        section.id = this.getMutationId(section, mutation);
        section.title = mutationTitle ?? this.getDefaultMutationTitle(section, mutation);

        let weaponDefinitionHeadValueName;
        ["Weapon", "Weapon Core", "Weapons"].forEach(name => {
            if (section.headValues.has(name)) weaponDefinitionHeadValueName = name;
        });
        let weaponDefinitionHeadValueValue = section.getHeadValueValue(weaponDefinitionHeadValueName);
        section.addHeadValue(weaponDefinitionHeadValueName, weaponDefinitionHeadValueValue + " + " + mutation, { update: true });


        mutationSection ??= Registries.techniques.get(mutation + " Mutation");
        if (!mutationSection) return;

        // Handle "Damage"
        const damageInfo = SectionDamageHelpers.parseAttribute(section.getHeadValueValue("Damage"));
        const mutationDamage = SectionDamageHelpers.parseAttribute(mutationSection.getHeadValueValue("Base Damage"));

        let canAttributesBeChanged = section.content && section.content.match(/you attack /i) && mutationDamage && damageInfo;
        if (canAttributesBeChanged) {
            // Merge full damage head value
            const damage = SectionDamageHelpers.updateDiceDamage(damageInfo?.dice, mutationDamage.dice);
            const damageTypes = SectionDamageHelpers.mergeTypes(damageInfo?.types, mutationDamage.types);
            const newDamageValue = SectionDamageHelpers.formatDiceDamage(damage, damageTypes);
            section.addHeadValue("Damage", newDamageValue, { update: true });
        } else {
            // Merge damage head value types only
            const damageTypes = SectionDamageHelpers.mergeTypes(damageInfo?.types, mutationDamage.types);
            const newDamageValue = SectionDamageHelpers.formatDiceDamage(damageInfo?.dice, damageTypes); // Keep original dice, just update types
            section.addHeadValue("Damage", newDamageValue, { update: true });
        }

        if (section.content) {
            if (mutationDamage) {
                // Find and merge damage types in content
                const damageTypes = SectionDamageHelpers.damageTypes;
                section.content.replace(/\(([^)]+)\)/g, (match, capturedGroup) => {
                    const extractedItems = capturedGroup.split(', ').map(type => toTextCase(type));
                    if (extractedItems.some(type => !damageTypes.has(type))) return match;
                    const mutationTypes = mutationDamage.types || [];
                    const mergedTypesSet = new Set([...extractedItems.map(t => t.toLowerCase()), ...mutationTypes]);
                    const mergedTypes = Array.from(mergedTypesSet);
                    return `(${mergedTypes.join(", ")})`;
                });
            }

            ["attack", "ability"].forEach(type => {
                section.content = section.content.replaceAll(`${weaponDefinitionHeadValueValue.toLowerCase()} ${type}`, (match) => {
                    return `${weaponDefinitionHeadValueValue.toLowerCase()} or ${mutation.toLowerCase()} attack`;
                });
            });
        }

        let trigger = AbilitySectionHelpers.getTrigger(section);
        if (trigger) {
            ["attack", "ability"].forEach(type => {
                trigger = trigger.replaceAll(`${weaponDefinitionHeadValueValue.toLowerCase()} ${type}`, (match) => {
                    return `${weaponDefinitionHeadValueValue.toLowerCase()} or ${mutation.toLowerCase()} attack`;
                });
            });
            section.addHeadValue("Trigger", trigger, { update: true });
        }

        if (!canAttributesBeChanged) return;

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
            if (totalValue == 0) {
                section.removeHeadValue(attribute);
            } else {
                const formattedValue = SectionDamageHelpers.formatModifierValue(totalValue);
                section.addHeadValue(attribute, formattedValue, { update: sectionValueRaw != null });
            }
        }
    }

    static getVariant(section, variationTitle = null) {
        section = section.clone();
        this.setupVariant(section, variationTitle);
        return section;
    }

    static setupVariant(section, variationTitle = null) {
        section.removeHeadValue("Connections");
        section.addHeadValue("Variant", `<${section.title}>`, { lineIndex: 0 });
        section.id = generateUniqueId();
        section.title = variationTitle ?? `Variant ${section.title}`;
    }

    static getScaled(section, scaling, variationTitle = null) {
        section = section.clone();
        this.setupScaled(section, scaling, variationTitle);
        return section;
    }

    static setupScaled(section, scaling, variationTitle = null) {
        section.removeHeadValue("Connections");
        if (!section.headValues.has("Source")) section.addHeadValue("Source", `</items/${section.title}>`, { lineIndex: 0 });
        section.title = variationTitle ?? section.title.replace(/ X$/, " " + scaling);
        if (variationTitle) section.id = generateUniqueId();
        if (!section.headValues.has("X")) return section;
        section.removeHeadValue("X");

        let variables = new Map([["X", scaling]]);
        if (section.attributes) {
            for (let line of section.attributes) {
                for (let attribute of line) {
                    if (attribute instanceof HeadValue) {
                        attribute.value = SectionReferenceHelpers.replaceVariablesWithinText(attribute.value, variables);
                        section.headValues.set(attribute.name, attribute.value);
                    }
                }
            }

        }
        if (section.content) section.content = SectionReferenceHelpers.replaceVariablesWithinText(section.content, variables);

        if (section.table) {
            for (let row of section.table) {
                for (let i = 0; i < row.length; i++) {
                    row[i] = SectionReferenceHelpers.replaceVariablesWithinText(row[i], variables);
                }
            }
        }

        return section;
    }

    static generateStructuredHtmlForSection(section, settings = null) {
        settings ??= {};
        settings = { ...settings };
        settings.variables = settings.variables ? new Map(settings.variables) : new Map();

        const sectionElement = fromHTML(`<div class="section">`);
        const structuredSection = new StructuredSectionHtml(
            section,
            sectionElement,
            settings.wrapperElement ?? sectionElement,
            settings,
        );

        this.regenerateHtmlForStructuredSection(structuredSection, true);

        return structuredSection;
    }

    static regenerateHtmlForStructuredSection(structuredSection, firstRun = false) {
        let section = structuredSection.section;
        let settings = structuredSection.settings;
        let sectionElement = structuredSection.element;
        sectionElement.innerHTML = '';
        structuredSection.subSections.clear();

        let content = section.content;
        let attributes = section.attributes;
        let newVariables = settings.variables;
        let hasLevel = false;
        let isNPC = section.npc != null;
        let npc = section.npc;
        if (isNPC) {
            npc = section.npc.clone();
            let level = settings.variables?.get("Level");
            if (level == null) {
                newVariables = new Map();
            } else {
                npc.stats.level = level;
                newVariables = SummonHelpers.getSummonSectionVariables(section, settings.variables, npc);
                hasLevel = true;
            }
        }


        let needsBreak = false;

        let titleElement = null;
        if (section.title) {
            const maxHeaderLevel = 6;
            const headerLevel = Math.min(Math.max(1, section.height), maxHeaderLevel);
            const tag = section.height > maxHeaderLevel ? "div" : `h${headerLevel}`;
            titleElement = fromHTML(`<${tag} class="section-title">`);
            titleElement.textContent = section.title;
            sectionElement.appendChild(titleElement);
        }

        // Need to extract embedded (summon) variables before here.
        let attributesElement = null;
        if (attributes?.length > 0) {
            needsBreak = true;
            attributesElement = fromHTML(`<div class="section-attributes applySnippets markTooltips">`);
            attributes.forEach(attributeList => {
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
                        attributeElement = fromHTML(`<span class="section-attribute section-headValue"><span class="section-headValue-name">${escapeHTML(attr.name)}</span>: </span>`);
                        let inputAttributes = new Set(["Severity", "X"]);
                        if (inputAttributes.has(attr.name)) {
                            let value = settings.variables.get(attr.name);
                            if (value == null) {
                                value = attr.value;
                                settings.variables.set(attr.name, value);
                            }
                            let severityInput = fromHTML(`<input type="number" class="section-headValue-value smallNumberInput">`);
                            attributeElement.appendChild(severityInput);
                            severityInput.value = value;
                            severityInput.addEventListener('input', () => {
                                if (severityInput.value == '') return;
                                let newValue = InputHelpers.fixNumberInput(severityInput);
                                newValue = InputHelpers.constrainInput(severityInput, value => clamp(value, 0, 10));
                                if (value == newValue) return;
                                value = newValue;
                                settings.variables.set(attr.name, value);
                                this.regenerateHtmlForStructuredSection(structuredSection);
                            });
                            severityInput.addEventListener('focusout', () => {
                                if (severityInput.value == '') severityInput.value = attr.value;
                            });
                        } else {
                            let valueElement = fromHTML(`<span class="section-headValue-value">${escapeHTML(attr.value)}</span>`);
                            attributeElement.appendChild(valueElement);
                        }

                        attributeElement._headValue = attr;
                    }
                    attributesLine.appendChild(attributeElement);
                    if (index < attributeList.length - 1) attributesLine.appendChild(document.createTextNode(attributesLine.textContent.endsWith('.') ? " " : ", "));
                });
            });
            sectionElement.appendChild(attributesElement);
        }


        let contentElement = null;
        if (content) {
            needsBreak = true;
            contentElement = fromHTML(`<div class="section-content fixText applySnippets markTooltips">`);

            // Convert markdown links to html
            const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
            const htmlContent = escapeHTML(content).replace(markdownLinkRegex, '<a class="textLink" href="$2">$1</a>');

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

        let subSectionContainer = fromHTML(`<div class="section-subSections listVertical gap-4 children-w-100">`);
        sectionElement.appendChild(subSectionContainer);


        structuredSection.titleElement = titleElement;
        structuredSection.attributesElement = attributesElement;
        structuredSection.contentElement = contentElement;
        structuredSection.tableElement = tableElement;
        structuredSection.subSectionContainer = subSectionContainer;
        structuredSection.newVariables = newVariables;
        if (isNPC) {
            sectionElement.appendChild(hb(1));
            let characterContainer = fromHTML(`<div>`);
            sectionElement.appendChild(characterContainer);
            if (hasLevel) {
                function updateCharacter() {
                    newVariables = SummonHelpers.getSummonSectionVariables(section, settings.variables, npc);
                    let structuredCharacter = CharacterHelpers.generateStructuredHtmlForCharacter(npc, { embedded: true, noTitle: true, simple: true, variables: newVariables });
                    structuredSection._structuredCharacter = structuredCharacter;
                    structuredCharacter._section = section;
                    structuredCharacter.element._section = section;
                    structuredCharacter.element._npc = npc;
                    characterContainer.innerHTML = "";
                    characterContainer.appendChild(structuredCharacter.element);
                }

                let importanceInputContainer = fromHTML(`<div class="listHorizontal gap-2">`);
                characterContainer.before(importanceInputContainer);
                characterContainer.before(hb(2));
                importanceInputContainer.appendChild(fromHTML(`<div class="applySnippets markTooltips">Importance:`));
                let importanceInput = fromHTML(`<input type="number" class="largeElement rounded smallNumberInput">`);
                importanceInputContainer.appendChild(importanceInput);
                importanceInput.value = npc.stats.importance;
                importanceInput.addEventListener('input', () => {
                    if (importanceInput.value == '') return;
                    let newValue = InputHelpers.fixNumberInput(importanceInput);
                    newValue = InputHelpers.constrainInput(importanceInput, value => clamp(value, npc.settings.minImportance ?? 0, 3));
                    if (npc.stats.importance == newValue) return;
                    npc.stats.importance = newValue;
                    updateCharacter();
                });
                importanceInput.addEventListener('focusout', () => {
                    if (importanceInput.value == '') importanceInput.value = npc.stats.importance;
                });

                SectionReferenceHelpers.addSnippets(importanceInputContainer);

                updateCharacter();
            } else {
                let abilityListElement = CharacterHelpers.generateAbilitiesSubPageHtml(npc, { noVariables: true, simple: true, variables: newVariables });
                characterContainer.appendChild(abilityListElement);
            }
        } else {
            if (section.subSections?.length > 0) {
                section.subSections.forEach(subSection => {
                    structuredSection.addSubSection(subSection);
                });
            }
        }

        SectionReferenceHelpers.addTooltipsToStructuredSection(structuredSection);

        if (settings.onRegenerated) settings.onRegenerated(structuredSection);

        if (!firstRun) HtmlHelpers.getClosestProperty(sectionElement, "_masonry")?.resize();
    }

    static generateStructuredHtmlForSectionOverview(sections, type, settings = null) {
        settings ??= {};
        let container = fromHTML(`<div class="section-overview listContainerVertical children-w-100">`);
        if (settings.removeTopLineHeight) container.classList.add('top-line-section-overview');

        if (settings.title) {
            let titleElement = fromHTML(`<h1>`);
            container.appendChild(titleElement);
            titleElement.textContent = settings.title;
        }

        let searchContainer;
        if (settings.addSearch) {
            searchContainer = fromHTML(`<div class="sticky">`);
            container.appendChild(searchContainer);
        }

        let listElement;
        if (type === this.TextType) {
            listElement = fromHTML(`<div class="listContainerVertical gap-6 children-w-100">`);
        } else if (type === this.MasonryType) {
            listElement = fromHTML(`<div class="masonryGrid" gap-x="20" gap-y="20" min-width="400">`);
        }
        listElement.setAttribute('placeholder', "Loading...");
        container.appendChild(listElement);

        const overview = new StructuredSectionOverviewHtml(type, container, listElement, searchContainer, settings);
        sections.forEach(section => overview.addSection(section));
        if (!settings.dontInitSearch) overview.initSearch();

        return overview;
    }

    static wrapSectionForOverview(section, type, settings = null) {
        settings ??= {};
        const structuredSection = this.generateStructuredHtmlForSection(section, settings);
        if (type === this.TextType) {
            structuredSection.wrapperElement = structuredSection.element;
        } else if (type === this.MasonryType) {
            let tag = settings.link ? "a" : "div";
            structuredSection.wrapperElement = fromHTML(`<${tag} class="masonryGridItem largeElement raised">`);
            structuredSection.wrapperElement.appendChild(structuredSection.element);
        }
        if (settings.link) {
            structuredSection.wrapperElement.setAttribute('href', settings.link);
            structuredSection.wrapperElement.classList.add('hoverable');
        }
        return structuredSection;
    }
}

class StructuredSectionHtml {
    constructor(section, element, wrapperElement, settings = null) {
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
        element._variables = settings.variables;
    }

    addSubSection(subSection, insertSettings = {}) {
        let needsBreak = this.contentElement || this.attributesElement || this.tableElement;
        if (needsBreak && this.subSections.length == 0) {
            this.element.insertBefore(hb(this.section.height > 1 ? 2 : 4), this.subSectionContainer);
        }

        const structuredSubSection = SectionHelpers.generateStructuredHtmlForSection(subSection, { ...this.insertSettings, variables: this.newVariables });
        this.subSections.register(structuredSubSection, { ...insertSettings, id: structuredSubSection.section.id });
        HtmlHelpers.insertAt(this.subSectionContainer, this.subSections.getIndex(structuredSubSection), structuredSubSection.wrapperElement);

        return structuredSubSection;
    }

    removeSubSection(subSection) {
        const structuredSubSection = this.subSections.get(subSection?.id);
        if (!structuredSubSection) return;
        structuredSubSection.wrapperElement.remove();
        this.subSections.unregister(structuredSubSection);

        if (this.subSections.length == 0) {
            this.subSectionContainer.previousSibling.remove();
        }
    }
}




class StructuredSectionOverviewHtml {
    constructor(type, container, listElement, searchContainer, settings = null) {
        this.type = type;
        this.container = container;
        this.listElement = listElement;
        this.searchContainer = searchContainer;
        this.settings = settings;
        this.sections = new Registry(); // Structured sections
        this.didSearchInit = false;

        container._sectionOverview = this;
        listElement._sectionOverview = this;

        this.updateSearchDisplay();
        if (this.settings.hideIfEmpty) this.container.classList.add("hide");
    }

    updateSearchDisplay() {
        if (!this.settings.showSearchIfEmpty) {
            if (this.sections.size == 0) this.searchContainer?.classList.add('hide');
            else this.searchContainer?.classList.remove('hide');
        }
    }

    initSearch() {
        if (!this.searchContainer || this.didSearchInit) return;
        this.didSearchInit = true;
        this.search = new SectionSearch(this.searchContainer, [this], {filterKey: this.settings.filterKey});
        this.searchContainer._search = this.search;
    }

    addSection(section, insertSettings) {
        insertSettings ??= {};
        const structuredSection = SectionHelpers.wrapSectionForOverview(section, this.type, this.settings);

        let oldIndex = this.sections.getIndex(structuredSection);
        this.sections.register(structuredSection, { ...insertSettings, id: structuredSection.section.id });
        let index = this.sections.getIndex(structuredSection);
        if (insertSettings.replace == true && oldIndex != -1) this.listElement.children[oldIndex].replaceWith(structuredSection.wrapperElement);
        else HtmlHelpers.insertAt(this.listElement, index, structuredSection.wrapperElement);

        this.updateSearchDisplay();
        if (this.settings.hideIfEmpty && this.sections.size != 0) this.container.classList.remove("hide");

        return structuredSection;
    }

    removeSection(section) {
        const structuredSection = this.sections.get(section?.id);
        if (!structuredSection) return;
        structuredSection.wrapperElement.remove();
        this.sections.unregister(structuredSection);

        this.updateSearchDisplay();
        if (this.settings.hideIfEmpty && this.sections.size == 0) this.container.classList.add("hide");
    }
}