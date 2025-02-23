class Resources {
    static preloadableResources = [];
    static precacheUrls = [];
    static allLoaded = false;

    static register(resource) {
        const entry = Registries.resources.register(resource);
        if (resource.preload) {
            this.preloadableResources.push(resource);
            this.precacheUrls.push(resource.link);
        }
        return entry.obj;
    }

    static index_html = this.register(new Resource("/", true));

    // Game
    static ancestries = this.register(new Resource("/data/ancestries.json", true));
    static conditions = this.register(new Resource("/data/conditions.json", true));
    static masteries_a = this.register(new Resource("/data/masteries_a.json", true));
    static masteries_m = this.register(new Resource("/data/masteries_m.json", true));
    static rules_attacks = this.register(new Resource("/data/rules_attacks.json", true));
    static rules_skills = this.register(new Resource("/data/rules_skills.json", true));
    static rules_character_creation = this.register(new Resource("/data/rules_character_creation.json", true));
    static rules_character_leveling = this.register(new Resource("/data/rules_character_leveling.json", true));
    static rules_introduction = this.register(new Resource("/data/rules_introduction.json", true));
    static rules_main = this.register(new Resource("/data/rules_main.json", true));
    static skills_tech = this.register(new Resource("/data/skills_tech.json", true));
    static skills_magic = this.register(new Resource("/data/skills_magic.json", true));
    static skills_physical = this.register(new Resource("/data/skills_physical.json", true));
    static skills_social = this.register(new Resource("/data/skills_social.json", true));
    static skills_book = this.register(new Resource("/data/skills_book.json", true));
    static summons_a = this.register(new Resource("/data/summons_a.json", true));
    static shop = this.register(new Resource("/data/shop.json", true));
    static techniques_element_a = this.register(new Resource("/data/techniques_element_a.json", true));
    static techniques_element_m = this.register(new Resource("/data/techniques_element_m.json", true));
    static techniques_special_a = this.register(new Resource("/data/techniques_special_a.json", true));
    static techniques_special_m = this.register(new Resource("/data/techniques_special_m.json", true));
    static techniques_weapon_a = this.register(new Resource("/data/techniques_weapon_a.json", true));
    static techniques_weapon_d = this.register(new Resource("/data/techniques_weapon_d.json", true));
    static techniques_weapon_o = this.register(new Resource("/data/techniques_weapon_o.json", true));
    static tools_sheet_npc = this.register(new Resource("/data/tools_sheet_npc.json", true));
    static tools_sheet_pc = this.register(new Resource("/data/tools_sheet_pc.json", true));

    // Setting
    static neontris = this.register(new Resource("/data/neontris.json", true));

    static setup() {
        let loadPromises = this.preloadableResources.map(r => r.onLoaded());
        Promise.allSettled(loadPromises).then(() => {
            window.dispatchEvent(new CustomEvent('resources-loaded'));
        });
    }

    static async onLoaded(callback = doNothing) {
        return new Promise((resolve, reject) => {
            let _callback = () => { callback(); resolve(); }
            if (this.allLoaded) {
                _callback();
            } else {
                window.addEventListener('resources-loaded', e => {
                    _callback();
                });
            }
        });
    }
}

Resources.setup();
Resources.onLoaded(() => {
    ServiceWorkerHelpers.onResourceUpdateReceived(() => ServiceWorkerHelpers.tryPromptResourceUpdate());
});
