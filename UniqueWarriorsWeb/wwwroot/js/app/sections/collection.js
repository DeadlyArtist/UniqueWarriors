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
            for (let section of sections) {
                Registries.categories.register(section.cloneWithoutSubSections());

                // Register all second-level sections in the target registry
                if (section.subSections && section.subSections.length > 0) {
                    for (let subSection of section.subSections) {
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
            var sections = await wrapper.resource.getFromJson();
            sections = SectionHelpers.modify(sections, { ...SectionHelpers.getInitModifySettings(),  ...wrapper.settings });
            sections.forEach(s => allSections.push(s));
        }
        return allSections;
    }
}