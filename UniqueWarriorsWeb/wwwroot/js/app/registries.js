class Registries {
    static all = {};

    static register(registry) {
        return this.all[registry.id] = registry;
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
}