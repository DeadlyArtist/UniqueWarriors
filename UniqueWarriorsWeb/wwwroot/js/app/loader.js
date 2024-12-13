class Loader {
    static collectionsLoaded = false;

    static collections = [
        new Collection(Registries.conditions, [
            new Collection.SectionResourceWrapper(Resources.conditions)
        ]),
        new Collection(Registries.masteries, [
            new Collection.SectionResourceWrapper(Resources.masteries_path),
        ], { categories: true }),
        new Collection(Registries.rules, [
            new Collection.SectionResourceWrapper(Resources.rules_character_creation),
            new Collection.SectionResourceWrapper(Resources.rules_character_leveling),
            new Collection.SectionResourceWrapper(Resources.rules_main),
            new Collection.SectionResourceWrapper(Resources.rules_attacks),
            new Collection.SectionResourceWrapper(Resources.tools_sheet_pc),
            new Collection.SectionResourceWrapper(Resources.tools_sheet_npc),
        ]),
        new Collection(Registries.summons, [
            new Collection.SectionResourceWrapper(Resources.summons_a),
        ], { categories: true }),
        new Collection(Registries.techniques, [
            new Collection.SectionResourceWrapper(Resources.techniques_weapon_a),
            new Collection.SectionResourceWrapper(Resources.techniques_weapon_m),
            new Collection.SectionResourceWrapper(Resources.techniques_element_a),
            new Collection.SectionResourceWrapper(Resources.techniques_element_m),
            new Collection.SectionResourceWrapper(Resources.techniques_special_a),
            new Collection.SectionResourceWrapper(Resources.techniques_special_m),
        ], {categories: true}),
    ];

    static async registerAllCollections() {
        await parallel(this.collections, async function (collection) {
            await collection.register();
        });
        this.collectionsLoaded = true;
        window.dispatchEvent(new CustomEvent('collections-loaded'));
    }

    static async onCollectionsLoaded(callback = doNothing) {
        return new Promise((resolve, reject) => {
            _callback = () => { callback(); resolve(); }
            if (this.collectionsLoaded) {
                _callback();
            } else {
                window.addEventListener('collections-loaded', e => _callback());
            }
        });
    }
}

App.onAppLoaded(() => Loader.registerAllCollections());