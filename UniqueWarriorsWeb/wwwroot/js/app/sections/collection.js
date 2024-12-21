class Collection {
    static SectionResourceWrapper = class {
        constructor(resource, settings) {
            this.resource = resource;
            this.settings = settings;
        }
    }

    constructor(registry, sectionResourceWrappers, settings = null) {
        this.registry = registry;
        this.sectionResourceWrappers = sectionResourceWrappers;
        this.settings = settings ?? {};
    }

    async register() {
        let sections = await this.parse();

        // Register top-level sections in categories registry if specified in settings
        if (this.settings.categories) {
            let categories = sections.map(s => s.cloneWithoutSubSections());
            for (let category of categories) Registries.categories.register(category);
            for (let section of sections) {
                if (section.subSections && section.subSections.length > 0) {
                    let subSections = SectionHelpers.modify(section.subSections.getAll(), { height:1 });
                    for (let subSection of subSections) {
                        this.registry.register(subSection);
                    }
                }
            }
        } else {
            // Default behavior: register all sections directly to the target registry
            for (let section of sections) {
                this.registry.register(section);
            }
        }
    }

    async parse() {
        let allSections = [];
        for (let wrapper of this.sectionResourceWrappers) {
            let sections = await wrapper.resource.getFromJson();
            sections = SectionHelpers.modify(sections, { ...SectionHelpers.getInitModifySettings(), anchor: this.registry.name,  ...wrapper.settings });
            sections.forEach(s => allSections.push(s));
        }
        return allSections;
    }
}