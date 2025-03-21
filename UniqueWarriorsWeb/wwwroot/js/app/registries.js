class Registries {
    static all = {};

    /**
     * @returns {Registry}
     */
    static register(registry) {
        return this.all[registry.name] = registry;
    }

    static resources = this.register(new Registry("resources"));
    static pages = this.register(new Registry("pages"));

    // Game
    static categories = this.register(new Registry("categories"));
    static defaultAbilities = this.register(new Registry("defaultAbilities"));
    static techniques = this.register(new Registry("techniques"));
    static masteries = this.register(new Registry("masteries"));
    static summons = this.register(new Registry("summons"));
    static conditions = this.register(new Registry("conditions"));
    static skills = this.register(new Registry("skills"));
    static skillBranches = this.register(new Registry("skillBranches"));
    static skillFields = this.register(new Registry("skillFields"));
    static items = this.register(new Registry("items"));
    static rules = this.register(new Registry("rules"));
    static ancestries = this.register(new Registry("ancestries"));
    static characters = this.register(new Registry("characters"));
    static npcs = this.register(new Registry("npcs"));

    static damageTypes = this.register(new Registry("damageTypes"));
    static weapons = this.register(new Registry("weapons"));
    static paths = this.register(new Registry("paths"));

    static snippets = this.register(new Registry("snippets"));

    // Setting
    static neontris = this.register(new Registry("neontris"));
}