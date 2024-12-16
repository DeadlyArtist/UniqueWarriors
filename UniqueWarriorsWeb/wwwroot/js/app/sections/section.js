class Section {
    constructor(section) {
        this.title = section.title;
        this.height = section.height ?? 0;
        this.attributes = section.attributes ?? [];
        this.content = section.content ?? null;
        this.table = section.table ?? null;
        this.tableHeaderLocation = section.tableHeaderLocation ?? null;
        this.subSections = new Registry();
        if (section.subSections) for (const subSection of section.subSections) this.addSubSection(subSection);

        // Custom
        this.parent = section.parent ?? null;
        this.headValues = new Map();
        this.tags = new Set();

        this.#setup();
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

    static classify(section) {
        let classified = ObjectHelpers.lowerFirstCharOfKeys(section, false);
        if (classified.subSections) classified.subSections = SectionHelpers.classify(classified.subSections);
        if (classified.attributes) classified.attributes = SectionAttributesHelpers.classify(classified.attributes);
        section = new Section(classified);
        return section;
    }

    addSubSection(section, settings) {
        this.subSections.register(section, settings);
        section.parent = this;
    }

    removeSubSection(section) {
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

    clone() {
        return Section.fromJSON(JSON.stringify(this));
    }

    cloneWithoutSubSections() {
        let json = this.toJSON();
        json.subSections = [];
        return Section.fromJSON(JSON.stringify(json));
    }

    toJSON() {
        return {
            title: this.title,
            height: this.height,
            attributes: SectionAttributesHelpers.toJSON(this.attributes),
            content: this.content,
            table: this.table,
            tableHeaderLocation: this.tableHeaderLocation,
            title: this.title,
            subSections: this.subSections.getAll(),
        };
    }

    static fromJSON(json) {
        let section = JSON.parse(json);
        let newSubSections = [];
        if (section.attributes) section.attributes = SectionAttributesHelpers.fromJSON(section.attributes);
        if (section.subSections) section.subSections.forEach(s => newSubSections.push(new Section(s)));
        section.subSections = newSubSections;
        return new Section(section);
    }
}