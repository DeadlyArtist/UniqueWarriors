class Snippets {
    static snippets = [
        new Snippet("Action", "rules/Actions/Action*parent"),
        new Snippet("Move Action", "rules/Actions/Move Action*parent"),
        new Snippet("Quick Action", "rules/Actions/Quick Action*parent"),
        new Snippet("Free Action", "rules/Actions/Free Action*parent"),
        new Snippet("Difficult Terrain", "rules/Keywords/Difficult Terrain"),
        new Snippet("close to", "rules/Keywords/Close To"),
        new Snippet("reserve", "rules/Keywords/Reserve Health"),
        new Snippet("Inverse", "rules/Conditions/Inverse"),
        new Snippet("Severity", "rules/Conditions/Severity"),
        new Snippet("Stackable", "rules/Conditions/Stackable"),
        new Snippet("Unstackable", "rules/Conditions/Unstackable"),
        new Snippet("Summon", "rules/Restriction Modifiers/Summons And Terrain (Upkeep)"),
        new Snippet("Terrain", "rules/Restriction Modifiers/Summons And Terrain (Upkeep)*noChildren"),
        new Snippet("Healthy", "rules/States Of Health/Healthy"),
        new Snippet("Bruised", "rules/States Of Health/Bruised"),
        new Snippet("Injured", "rules/States Of Health/Injured"),
        new Snippet("Dying", "rules/States Of Health/Dying"),

        // Tag only
        new Snippet("Connections", "rules/Connections", { whitelist: "tags" }),
        new Snippet("Trigger", "rules/Restriction Modifiers/Trigger", { whitelist: "tags" }),
        new Snippet("Limit", "rules/Restriction Modifiers/Limit", { whitelist: "tags" }),
        new Snippet("Cooldown", "rules/Restriction Modifiers/Cooldown", { whitelist: "tags" }),
        new Snippet("Max", "rules/Restriction Modifiers/Max", { whitelist: "tags" }),
        new Snippet("Initial Lock", "rules/Restriction Modifiers/Initial Lock", { whitelist: "tags" }),
        new Snippet("Channel", "rules/Restriction Modifiers/Channel", { whitelist: "tags" }),
        new Snippet("Multitrigger", "rules/Restriction Modifiers/Multitrigger", { whitelist: "tags" }),
        new Snippet("Immobile", "rules/Restriction Modifiers/Immobile", { whitelist: "tags" }),
        new Snippet("Object", "rules/Restriction Modifiers/Object", { whitelist: "tags" }),
        new Snippet("Mobile", "rules/Restriction Modifiers/Mobile", { whitelist: "tags" }),
        new Snippet("Importance", "rules/Restriction Modifiers/Importance", { whitelist: "tags" }),
        new Snippet("Attack", "rules/Descriptive Tags/Attack", { whitelist: "tags" }),
        new Snippet("Basic", "rules/Descriptive Tags/Basic", { whitelist: "tags" }),
        new Snippet("Simple", "rules/Descriptive Tags/Simple", { whitelist: "tags" }),
        new Snippet("Melee", "rules/Descriptive Tags/Melee", { whitelist: "tags" }),
        new Snippet("Ranged", "rules/Descriptive Tags/Ranged", { whitelist: "tags" }),
        new Snippet("Area", "rules/Descriptive Tags/Area", { whitelist: "tags" }),
        new Snippet("Multitarget", "rules/Descriptive Tags/Multitarget", { whitelist: "tags" }),
        new Snippet("Movement", "rules/Descriptive Tags/Movement", { whitelist: "tags" }),
        new Snippet("Teleportation", "rules/Descriptive Tags/Teleportation", { whitelist: "tags" }),

    ];

    static setup() {

    }

    static registerAllSnippets() {
        for (let snippet of this.snippets) {
            Registries.snippets.register(snippet);
        }
    }
}