class Collection {
    static SectionResourceWrapper = class {
        constructor(resource, settings) {
            this.resource = resource;
            this.settings = settings;
        }
    }

    loaded;
    all;
    constructor(registry, sectionResourceWrappers, settings = null) {
        this.registry = registry;
        this.sectionResourceWrappers = sectionResourceWrappers;
        this.settings = settings ?? {};
        this.id = registry.name ?? generateUniqueId();
    }

    async register() {
        let sections = await this.parse();
        let all = [];

        if (this.settings.categories) {
            // Register top-level sections in categories registry if specified in settings
            let categories = sections.map(s => CategoryHelpers.fromSection(s));
            //all.push({ registry: Registries.categories, sections: categories });
            for (let category of categories) CategoryHelpers.registerCategory(category);
            for (let section of sections) {
                if (section.subSections && section.subSections.length > 0) {
                    let subSections = SectionHelpers.modify(section.subSections.getAll(), { height: 1 });
                    all.push({ registry: this.registry, sections: subSections });
                    for (let subSection of subSections) {
                        subSection.anchor = section.anchor;
                        subSection.parent = null;
                        this.registry.register(subSection);
                    }
                }
            }
        } else {
            // Default behavior: register all sections directly to the target registry
            all.push({ registry: this.registry, sections: sections });
            for (let section of sections) {
                let settings = {};
                if (this.registry == Registries.skills) {
                    Registries.skillFields.register(section.cloneWithoutSubSections());
                    let field = section.title;
                    let branchSections = SectionHelpers.modify(section.subSections.getAll(), { height: 1 });
                    for (let branchSection of branchSections) {
                        Registries.skillBranches.register(branchSection.cloneWithoutSubSections(), { tags: [field] });
                        let branch = branchSection.title;
                        let skillSections = SectionHelpers.modify(branchSection.subSections.getAll(), { height: 1 });
                        for (let skillSection of skillSections) {
                            Registries.skills.register(skillSection, { tags: [field, branch] });
                        }
                    }
                } else {
                    this.registry.register(section, settings);
                }
            }
        }
        this.all = all;
        window.dispatchEvent(new CustomEvent('collection-loaded-' + this.id));
        this.loaded = true;
    }

    async parse() {
        let allSections = [];
        for (let wrapper of this.sectionResourceWrappers) {
            let sections = await wrapper.resource.getFromJson();
            sections = SectionHelpers.modify(sections, { ...SectionHelpers.getInitModifySettings(), anchor: this.registry.name, ...wrapper.settings });
            sections.forEach(s => allSections.push(s));
        }
        return allSections;
    }

    resolvePendingReferences() {
        for (let { registry, sections } of this.all) {
            let remaining = sections.map(s => ({ registry, section: s }));
            while (remaining.length != 0) {
                let { registry, section } = remaining.pop();
                let newSection = Section.resolvePendingReferences(section);
                if (newSection == null) {
                    remaining = remaining.concat(section.subSections.map(s => ({ registry: section.subSections, section: s })));
                } else {
                    registry.register(newSection, { replace: section });
                }
            }
        }
    }

    async onLoaded(callback = doNothing) {
        return new Promise((resolve, reject) => {
            let _callback = () => { callback(); resolve(); }
            if (this.loaded) {
                _callback();
            } else {
                window.addEventListener('collection-loaded-' + this.id, e => {
                    _callback();
                });
            }
        });
    }
}