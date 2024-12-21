class Resources {
    static preloadableResources = [];
    static precacheUrls = [];

    static register(resource) {
        const entry = Registries.resources.register(resource);
        if (resource.preload) {
            this.preloadableResources.push(resource);
            this.precacheUrls.push(resource.link);
        }
        return entry.obj;
    }

    static index_html = this.register(new Resource("/", true));

    static conditions = this.register(new Resource("/data/conditions.json", true));
    static masteries_a = this.register(new Resource("/data/masteries_a.json", true));
    static masteries_m = this.register(new Resource("/data/masteries_m.json", true));
    static rules_attacks = this.register(new Resource("/data/rules_attacks.json", true));
    static rules_character_creation = this.register(new Resource("/data/rules_character_creation.json", true));
    static rules_character_leveling = this.register(new Resource("/data/rules_character_leveling.json", true));
    static rules_main = this.register(new Resource("/data/rules_main.json", true));
    static summons_a = this.register(new Resource("/data/summons_a.json", true));
    static techniques_element_a = this.register(new Resource("/data/techniques_element_a.json", true));
    static techniques_element_m = this.register(new Resource("/data/techniques_element_m.json", true));
    static techniques_special_a = this.register(new Resource("/data/techniques_special_a.json", true));
    static techniques_special_m = this.register(new Resource("/data/techniques_special_m.json", true));
    static techniques_weapon_a = this.register(new Resource("/data/techniques_weapon_a.json", true));
    static techniques_weapon_m = this.register(new Resource("/data/techniques_weapon_m.json", true));
    static tools_sheet_npc = this.register(new Resource("/data/tools_sheet_npc.json", true));
    static tools_sheet_pc = this.register(new Resource("/data/tools_sheet_pc.json", true));
}
