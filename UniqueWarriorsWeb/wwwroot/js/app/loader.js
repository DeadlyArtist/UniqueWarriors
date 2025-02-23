class Loader {
    static loadingCollectionsBefore = false;
    static loadingCollections = false;
    static collectionsLoadedBefore = false;
    static collectionsLoaded = false;
    static baseCollectionsLoadedBefore = false;
    static baseCollectionsLoaded = false;

    static collections = [
        // Game
        new Collection(Registries.ancestries, [
            new Collection.SectionResourceWrapper(Resources.ancestries)
        ]),
        new Collection(Registries.conditions, [
            new Collection.SectionResourceWrapper(Resources.conditions)
        ]),
        new Collection(Registries.items, [
            new Collection.SectionResourceWrapper(Resources.shop)
        ], { categories: true }),
        new Collection(Registries.masteries, [
            new Collection.SectionResourceWrapper(Resources.masteries_a),
            new Collection.SectionResourceWrapper(Resources.masteries_m),
        ], { categories: true }),
        new Collection(Registries.rules, [
            new Collection.SectionResourceWrapper(Resources.rules_introduction),
            new Collection.SectionResourceWrapper(Resources.rules_character_creation),
            new Collection.SectionResourceWrapper(Resources.rules_character_leveling),
            new Collection.SectionResourceWrapper(Resources.rules_main),
            new Collection.SectionResourceWrapper(Resources.rules_attacks),
            new Collection.SectionResourceWrapper(Resources.rules_skills),
            new Collection.SectionResourceWrapper(Resources.tools_sheet_pc),
            new Collection.SectionResourceWrapper(Resources.tools_sheet_npc),
        ]),
        new Collection(Registries.skills, [
            new Collection.SectionResourceWrapper(Resources.skills_tech),
            new Collection.SectionResourceWrapper(Resources.skills_magic),
            new Collection.SectionResourceWrapper(Resources.skills_physical),
            new Collection.SectionResourceWrapper(Resources.skills_social),
            new Collection.SectionResourceWrapper(Resources.skills_book),
        ]),
        new Collection(Registries.summons, [
            new Collection.SectionResourceWrapper(Resources.summons_a),
        ], { categories: true }),
        new Collection(Registries.techniques, [
            new Collection.SectionResourceWrapper(Resources.techniques_weapon_a),
            new Collection.SectionResourceWrapper(Resources.techniques_weapon_d),
            new Collection.SectionResourceWrapper(Resources.techniques_weapon_o),
            new Collection.SectionResourceWrapper(Resources.techniques_element_a),
            new Collection.SectionResourceWrapper(Resources.techniques_element_m),
            new Collection.SectionResourceWrapper(Resources.techniques_special_a),
            new Collection.SectionResourceWrapper(Resources.techniques_special_m),
        ], { categories: true }),

        // Setting
        new Collection(Registries.neontris, [
            new Collection.SectionResourceWrapper(Resources.neontris),
        ]),
    ];
    static collectionsByRegistry = new Map();

    static registerDefaultAbilities() {
        let abilities = Registries.rules.get('PC Sheet').subSections.get('Default Abilities').subSections.getAll();
        abilities = SectionHelpers.modify(abilities, { clone: true, height: 0 });
        for (let ability of abilities) {
            Registries.defaultAbilities.register(ability);
        }
    }

    static async registerAllCollections() {
        this.loadingCollectionsBefore = true;
        window.dispatchEvent(new CustomEvent('before-loading-collections'));
        this.loadingCollections = true;
        window.dispatchEvent(new CustomEvent('loading-collections'));

        this.collections.forEach(c => this.collectionsByRegistry.set(c.registry, c));
        await parallel(this.collections, async function (collection) {
            await collection.register();
        });
        this.registerDefaultAbilities();
        this.baseCollectionsLoadedBefore = true;
        window.dispatchEvent(new CustomEvent('before-base-collections-loaded'));
        this.baseCollectionsLoaded = true;
        window.dispatchEvent(new CustomEvent('base-collections-loaded'));

        this.collections.forEach(collection => collection.resolvePendingReferences());

        this.collectionsLoadedBefore = true;
        window.dispatchEvent(new CustomEvent('before-collections-loaded'));
        this.collectionsLoaded = true;
        window.dispatchEvent(new CustomEvent('collections-loaded'));
    }

    static async onLoadingCollections(callback = doNothing) {
        return new Promise((resolve, reject) => {
            let _callback = () => { callback(); resolve(); }
            if (this.loadingCollections) {
                _callback();
            } else {
                window.addEventListener('loading-collections', e => {
                    _callback();
                });
            }
        });
    }

    static async beforeLoadingCollections(callback = doNothing) {
        return new Promise((resolve, reject) => {
            let _callback = () => { callback(); resolve(); }
            if (this.loadingCollectionsBefore) {
                _callback();
            } else {
                window.addEventListener('before-loading-collections', e => {
                    _callback();
                });
            }
        });
    }

    static async onBaseCollectionsLoaded(callback = doNothing) {
        return new Promise((resolve, reject) => {
            let _callback = () => { callback(); resolve(); }
            if (this.baseCollectionsLoaded) {
                _callback();
            } else {
                window.addEventListener('base-collections-loaded', e => {
                    _callback();
                });
            }
        });
    }

    static async beforeBaseCollectionsLoaded(callback = doNothing) {
        return new Promise((resolve, reject) => {
            let _callback = () => { callback(); resolve(); }
            if (this.baseCollectionsLoadedBefore) {
                _callback();
            } else {
                window.addEventListener('before-base-collections-loaded', e => {
                    _callback();
                });
            }
        });
    }

    static async onCollectionsLoaded(callback = doNothing) {
        return new Promise((resolve, reject) => {
            let _callback = () => { callback(); resolve(); }
            if (this.collectionsLoaded) {
                _callback();
            } else {
                window.addEventListener('collections-loaded', e => {
                    _callback();
                });
            }
        });
    }

    static async beforeCollectionsLoaded(callback = doNothing) {
        return new Promise((resolve, reject) => {
            let _callback = () => { callback(); resolve(); }
            if (this.collectionsLoadedBefore) {
                _callback();
            } else {
                window.addEventListener('before-collections-loaded', e => {
                    _callback();
                });
            }
        });
    }
}

App.onAppLoaded(() => Loader.registerAllCollections());