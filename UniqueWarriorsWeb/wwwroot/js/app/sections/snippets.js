class Snippets {
    static snippetQuery = ".applySnippets";
    static waitingForRerender = false;

    static defaultSnippets = [
        new Snippet("Turn Action", "rules/Turn Actions"),
        new Snippet("Action", "rules/Turn Actions"),
        new Snippet("Move Action", "rules/Turn Actions"),
        new Snippet("Quick Action", "rules/Turn Actions"),
        new Snippet("Free Action", "rules/Turn Actions"),
        new Snippet("Difficult Terrain", "rules/Keywords/Difficult Terrain"),
        new Snippet("close to", "rules/Keywords/Close To"),
        new Snippet("reserve", "rules/Keywords/Reserve Health"),
        new Snippet("Inverse", "rules/Conditions/Inverse"),
        new Snippet("Severity", "rules/Conditions/Severity"),
        new Snippet("Stackable", "rules/Conditions/Stackable"),
        new Snippet("Unstackable", "rules/Conditions/Unstackable"),
        new Snippet("Summon", "rules/Restriction Modifiers/Summons And Terrain (Upkeep)"),
        new Snippet("Terrain", "rules/Restriction Modifiers/Summons And Terrain (Upkeep)*noChildren"),
        new Snippet("Importance", "rules/Restriction Modifiers/Importance"),
        new Snippet("Min Importance", "rules/Restriction Modifiers/Min Importance"),
        new Snippet("Healthy", "rules/States Of Health"),
        new Snippet("Bruised", "rules/States Of Health"),
        new Snippet("Injured", "rules/States Of Health"),
        new Snippet("Dying", "rules/States Of Health"),
        new Snippet("Weapon", "rules/Weapons"),
        new Snippet("Weapon Core", "rules/Weapons"),
        new Snippet("Technique", "rules/Techniques*noChildren"),
        new Snippet("Path", "rules/Paths"),
        new Snippet("Path Core", "rules/Paths/Path Core"),
        new Snippet("Evolved Path Core", "rules/Paths/Path Core/Evolved Path Core"),
        new Snippet("Mastery", "rules/Masteries"),
        new Snippet("Masteries", "rules/Masteries"),
        new Snippet("Mutation", "rules/Techniques/Mutations"),
        new Snippet("learn summon", "rules/Techniques/Summons"),
        new Snippet("learned summon", "rules/Techniques/Summons"),
        new Snippet("attribute increase", "rules/Attributes"),
        new Snippet("attribute increase", "rules/Attributes"),
        new Snippet("boon", "rules/Boons And Banes"),
        new Snippet("bane", "rules/Boons And Banes"),
        new Snippet("Attack", "rules/Attacks/Attack Resolution*noChildren"),
        new Snippet("Natural", "rules/Attacks/Attack Resolution/Natural Rolls And Modifiers"),
        new Snippet("Success Level", "rules/Attacks/Attack Resolution/Success Level"),
        new Snippet("Miss", "rules/Attacks/Attack Resolution/Success Level"),
        new Snippet("Hit", "rules/Attacks/Attack Resolution/Success Level"),
        new Snippet("Graze", "rules/Attacks/Attack Resolution/Success Level"),
        new Snippet("Strike", "rules/Attacks/Attack Resolution/Success Level"),
        new Snippet("Crit", "rules/Attacks/Attack Resolution/Success Level"),
        new Snippet("Accuracy", "rules/Attacks/Attack Resolution*noChildren"),
        new Snippet("Graze Range", "rules/Attacks/Attack Resolution*noChildren"),
        new Snippet("Crit Range", "rules/Attacks/Attack Resolution*noChildren"),
        new Snippet("Advantage", "rules/Attacks/Advantage\\/Disadvantage"),
        new Snippet("Disadvantage", "rules/Attacks/Advantage\\/Disadvantage"),
        new Snippet("Cover", "rules/Attacks/Cover"),
        new Snippet("Unaware", "rules/Attacks/Unaware And Hidden"),
        new Snippet("Hidden", "rules/Attacks/Unaware And Hidden"),
        new Snippet("Damage", "rules/Attacks/Damage*noChildren"),
        new Snippet("Explode", "rules/Attacks/Damage/Explode"),

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
        new Snippet("Basic", "rules/Descriptive Tags/Basic", { whitelist: "tags" }),
        new Snippet("Simple", "rules/Descriptive Tags/Simple", { whitelist: "tags" }),
        new Snippet("Melee", "rules/Descriptive Tags/Melee&rules/Attacks/Advantage\\/Disadvantage/Ranged Against Melee", { whitelist: "tags" }),
        new Snippet("Ranged", "rules/Descriptive Tags/Ranged&rules/Attacks/Advantage\\/Disadvantage/Ranged Against Melee", { whitelist: "tags" }),
        new Snippet("Area", "rules/Descriptive Tags/Area", { whitelist: "tags" }),
        new Snippet("Multitarget", "rules/Descriptive Tags/Multitarget", { whitelist: "tags" }),
        new Snippet("Movement", "rules/Descriptive Tags/Movement", { whitelist: "tags" }),
        new Snippet("Teleportation", "rules/Descriptive Tags/Teleportation", { whitelist: "tags" }),
        new Snippet("Base Damage", "rules/Mutations/Base Damage", { whitelist: "tags" }),
    ];

    static onAppLoadedSetup() {
        this.registerAllSnippets();
    }

    static registerSnippet(snippet) {
        Registries.snippets.register(snippet);
    }

    static unregisterSnippet(snippet) {
        Registries.snippets.unregister(snippet);
    }

    static async registerAllSnippets() {
        for (let snippet of this.defaultSnippets) {
            Registries.snippets.register(snippet);
        }

        for (let type of DamageHelpers.damageTypes) {
            Registries.snippets.register(new Snippet(type, `rules/Attacks/Damage/Damage Types`));
        }

        Registries.conditions.stream(event => {
            let condition = event.obj;
            if (event.registered) Snippets.registerSnippet(new Snippet(condition.title, `conditions/${condition.title}`));
            else Snippets.unregisterSnippet(condition.title);
        });
    }
}

App.onAppLoaded(() => Snippets.onAppLoadedSetup());