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
        var sections = await this.parse();

        // Register top-level sections in categories registry if specified in settings
        if (this.settings.categories) {
            for (let section of sections) {
                Registries.categories.registerSection(SectionHelpers.copyWithoutSubsections(section));

                // Register all second-level sections in the target registry
                if (section.SubSections && section.SubSections.length > 0) {
                    for (let subSection of section.SubSections) {
                        this.registry.registerSection(subSection);
                    }
                }
            }
        } else {
            // Default behavior: register all sections directly to the target registry
            for (let section of sections) {
                this.registry.registerSection(section);
            }
        }
    }

    async parse() {
        var allSections = [];
        for (let wrapper of this.sectionResourceWrappers) {
            var sections = await wrapper.resource.getFromJson();
            sections = SectionHelpers.modify(sections, wrapper.settings);
            sections.forEach(s => allSections.push(s));
        }
        return allSections;
    }
}