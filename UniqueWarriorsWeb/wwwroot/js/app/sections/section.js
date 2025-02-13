class Section {
    constructor(settings) {
        settings ??= {};
        this.id = settings.id;
        this.version = settings.version ?? App.version;
        this.title = settings.title;
        this.height = settings.height ?? 0;
        this.attributes = settings.attributes ?? [];
        this.content = settings.content ?? null;
        this.table = settings.table ?? null;
        this.tableHeaderLocation = settings.tableHeaderLocation ?? null;
        this.subSections = new Registry();
        if (settings.subSections) for (const subSection of settings.subSections) this.addSubSection(subSection);
        this.npc = settings.npc;

        // Custom
        this.parent = settings.parent ?? null;
        this.anchor = settings.anchor ?? null;
        this.headValues = new Map();
        this.tags = new Set();

        this.#setup();
    }

    get id() {
        return this._overrideId ?? this.title;
    }
    set id(id) {
        this._overrideId = id;
    }

    get title() {
        return this.npc?.name ?? this._title;
    }
    set title(title) {
        this._title = title;
        if (this.npc) this.npc.name = title;
    }

    #setup() {
        for (let subSection of this.subSections) subSection.parent = this;

        for (let line of this.attributes) {
            for (let attribute of line) {
                if (typeof attribute == 'string') this.tags.add(attribute);
                else this.headValues.set(attribute.name, attribute.value);
            }
        }
    }

    addSubSection(section, settings) {
        this.subSections.register(section, settings);
        section.parent = this;
    }

    removeSubSection(section) {
        section = this.subSections.get(section);
        this.subSections.unregister(section);
        section.parent = null;
    }

    clearSubSections() {
        for (let subSection of this.subSections) this.removeSubSection(subSection);
    }

    getHeadValueValue(name) {
        return this.headValues.get(name);
    }

    addAttributeLine() {
        this.attributes.push([]);
    }

    addHeadValue(name, value, settings = null) {
        settings ??= null;
        const { lineIndex, positionInLine, update } = settings || {};

        this.headValues.set(name, value);
        let headValue = new HeadValue(name, value);

        if (lineIndex != null) {
            // Ensure the attributes list has enough lines
            if (this.attributes.length <= lineIndex) {
                this.addAttributeLine();
            }

            let targetLine = this.attributes[lineIndex];

            if (positionInLine != null || targetLine.length <= positionInLine) {
                // Add or overwrite the head value at the specified location
                targetLine[positionInLine] = headValue;
            } else {
                // If positionInLine is not provided, add the head value to the end of the line
                targetLine.push(headValue);
            }
        } else {
            let foundAttribute = false;
            for (let line of this.attributes) {
                for (let attribute of line) {
                    if (typeof attribute !== 'string' && attribute.name === name) {
                        // Update existing attribute if it already exists
                        attribute.value = value;
                        foundAttribute = true;
                        break;
                    }
                }
                if (foundAttribute) break;
            }

            if (!foundAttribute && !update) {
                if (this.attributes.length == 0) this.addAttributeLine();
                this.attributes[this.attributes.length - 1].push(headValue);
            }
        }
    }
    updateHeadValue(name, value) {
        this.addHeadValue(name, value, { update: true });
    }

    addTag(tag, settings = null) {
        settings ??= null;
        const { lineIndex, positionInLine, update } = settings || {};

        // If update is specified, replace an existing tag with the new tag
        if (update) {
            let tagUpdated = false;

            for (let line of this.attributes) {
                for (let i = 0; i < line.length; i++) {
                    if (line[i] === update) {
                        // Replace the tag with the new tag
                        line[i] = tag;
                        tagUpdated = true;
                        break;
                    }
                }
                if (tagUpdated) break;
            }

            // If the update tag was found and replaced, update the tags set
            if (tagUpdated) {
                this.tags.delete(update);
                this.tags.add(tag);
                return;
            }
        }

        this.tags.add(tag);

        if (lineIndex != null) {
            // Ensure the attributes list has enough lines
            if (this.attributes.length <= lineIndex) {
                this.addAttributeLine();
            }

            let targetLine = this.attributes[lineIndex];

            if (positionInLine != null || targetLine.length <= positionInLine) {
                // Add or overwrite the tag at the specified location
                targetLine[positionInLine] = tag;
            } else {
                // If positionInLine is not provided, add the tag to the end of the line
                if (!targetLine.includes(tag)) {
                    targetLine.push(tag);
                }
            }
        } else {
            // If no lineIndex is specified, add the tag to a new line if it doesn't already exist in the attributes
            if (!this.attributes.some(line => line.includes(tag))) {
                this.attributes.push([tag]);
            }
        }
    }


    removeHeadValue(name) {
        // Remove from headValues map
        this.headValues.delete(name);

        // Remove from the attributes list
        this.attributes = this.attributes.map(line =>
            line.filter(attribute => typeof attribute === 'string' || attribute.name !== name)
        );
    }

    removeTag(tag) {
        // Remove from tags set
        this.tags.delete(tag);

        // Remove from the attributes list
        this.attributes = this.attributes.map(line => line.filter(a => a !== tag));
    }

    getHeadValueParts(name) {
        let value = this.getHeadValueValue(name);
        if (!value) return [];
        if (value[value.length - 1] == ".") value = value.substring(0, value.length - 1);
        return value.split(", ");
    }

    getPath() {
        let parts = [];
        let section = this;
        while (section) {
            if (section.id) parts.push(section.id);
            if (section.anchor) {
                parts.push(section.anchor);
                break;
            }
            section = section.parent;
        }

        return parts.reverse().map(p => SectionReferenceHelpers.pathEncoder.escape(p)).join('/');
    }

    static classify(section) {
        if (section instanceof Section) return section;

        let classified = ObjectHelpers.lowerFirstCharOfKeys(section, false);
        if (classified.subSections) classified.subSections = SectionHelpers.classify(classified.subSections);
        if (classified.attributes) classified.attributes = SectionAttributesHelpers.classify(classified.attributes);
        if (classified.npc) classified.npc = NPC.fromJSON(classified.npc);
        section = new Section(classified);

        if (section.tags.has("Skill Field")) {
            for (let subSection of section.subSections) {
                if (subSection.tags.has("Skill Branch")) {
                    subSection.addHeadValue("Skill Field", section.title, { lineIndex: 0 });
                    for (let subSubSection of subSection.subSections) {
                        if (subSubSection.tags.has("Skill")) {
                            subSubSection.addHeadValue("Skill Branch", subSection.title, { lineIndex: 0 });
                            subSubSection.addHeadValue("Skill Field", section.title, { lineIndex: 0 });
                        }
                    }
                }
            }
        }

        return section;
    }

    static resolvePendingReferences(section) {
        if (NPCSectionHelpers.isSummon(section)) {
            let mixed = section.subSections.getAll();
            function parseMixed(text) {
                return text.replace(/(^|\n)<[^<]+>/g, matched => {
                    let parsed = SectionReferenceHelpers.parseReference(matched);
                    let path = "techniques/" + parsed.reference;
                    let section = SectionHelpers.resolveSectionExpression(path);
                    if (section) mixed.push(section);
                    return "";
                });
            }
            if (section.content) {
                section.content = parseMixed(text);
            }
            if (section.attributes) {
                section.attributes = section.attributes.map(attributeLine => attributeLine.map(attribute => {
                    if (SectionAttributesHelpers.isTag(attribute)) return parseMixed(attribute);
                    return attribute;
                }).filter(a => a));
            }
            section = new Section(section);
            section.npc = NPCSectionHelpers.parseNPC(section, { mixed });
            section.subSections.clear();
            return section;
        }
    }

    compareSurface(other) {
        if (!other) return false;

        if (this.title != other.title) return false;
        if (JSON.stringify(this.attributes) != JSON.stringify(other.attributes)) return false;
        if (this.content != other.content) return false;
        if (JSON.stringify(this.table) != JSON.stringify(other.table)) return false;
        if (this.tableHeaderLocation != other.tableHeaderLocation) return false;

        return true;
    }

    compareRecursively(other) {
        if (!other) return false;
        if (!this.compareSurface(other)) return false;
        if (this.subSections.length != other.subSections.length) return false;

        for (let section of this.subSections) {
            if (!section.compareRecursively(other.subSections.get(section.title))) return false;
        }

        if (!this.npc != !other.npc) return false;
        if (this.npc && !this.npc.compareRecursively(other.npc)) return false;

        return true;
    }

    // Cloning
    clone() {
        let cloned = Section.fromJSON(clone(this));
        cloned.parent = this.parent;
        return cloned;
    }

    cloneWithoutSubSections() {
        let json = this.toJSON();
        json.subSections = [];
        let clone = Section.fromJSON(json);
        clone.parent = this.parent;
        return clone;
    }

    toJSON() {
        return {
            id: this._overrideId,
            version: this.version,
            title: this.title,
            height: this.height,
            attributes: SectionAttributesHelpers.toJSON(this.attributes),
            content: this.content,
            table: this.table,
            tableHeaderLocation: this.tableHeaderLocation,
            anchor: this.anchor,
            subSections: this.subSections.getAll().map(s => s.toJSON()),
            npc: this.npc?.toJSON(),
        };
    }

    static fromJSON(section) {
        let newSubSections = [];
        if (section.attributes) section.attributes = SectionAttributesHelpers.fromJSON(section.attributes);
        if (section.subSections) section.subSections.forEach(s => newSubSections.push(Section.fromJSON(s)));
        if (section.npc) section.npc = NPC.fromJSON(section.npc);
        section.subSections = newSubSections;
        return new Section(section);
    }
}