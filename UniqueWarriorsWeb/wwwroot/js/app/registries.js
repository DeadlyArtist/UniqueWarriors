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
    static techniques = this.register(new Registry("techniques"));
    static masteries = this.register(new Registry("masteries"));
    static summons = this.register(new Registry("summons"));
    static conditions = this.register(new Registry("conditions"));
    static rules = this.register(new Registry("rules"));
    static ancestries = this.register(new Registry("ancestries"));
    static characters = this.register(new Registry("characters"));
    static npcs = this.register(new Registry("npcs"));

    static snippets = this.register(new Registry("snippets"));
}