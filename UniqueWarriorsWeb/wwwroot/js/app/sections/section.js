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

    clone() {
        return Section.fromJSON(JSON.stringify(this));
    }

    cloneWithoutSubSections() {
        let json = this.toJSON();
        json.subSections = [];
        return Section.fromJSON(JSON.stringify(this));
    }

    toJSON() {
        return {
            title: this.title,
            height: this.height,
            attributes: this.attributes,
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
        if (section.subSections) section.subSections.forEach(s => newSubSections.push(new Section(s)));
        section.subSections = newSubSections;
        return new Section(section);
    }
}