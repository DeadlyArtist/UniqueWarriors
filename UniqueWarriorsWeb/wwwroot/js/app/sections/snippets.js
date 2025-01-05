class Snippets {
    static snippetQuery = ".applySnippets";
    static tagQuery = ".section-tag, .section-headValue-name, .character-stat-name";
    static waitingForRerender = false;

    static defaultSnippets;

    static setup() {
        this.defaultSnippets = [
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
            new Snippet("Evolution", "rules/Paths/Path Core/Evolution"),
            new Snippet("Mastery", "rules/Masteries"),
            new Snippet("Masteries", "rules/Masteries"),
            new Snippet("Upgrade", "rules/Masteries/Upgrades"),
            new Snippet("Ascendancy", "rules/Masteries/Upgrades/Ascendancy"),
            new Snippet("Ascendancies", "rules/Masteries/Upgrades/Ascendancy"),
            new Snippet("Mutation", "rules/Techniques/Mutations"),
            new Snippet("learn summon", "rules/Techniques/Summons"),
            new Snippet("learned summon", "rules/Techniques/Summons"),
            new Snippet("Weapon Item", "rules/Items/Weapon Items*noChildren"),
            new Snippet("Rune", "rules/Items/Weapon Items/Runes*noChildren"),
            new Snippet("Stats", "rules/Stats*noChildren"),
            new Snippet("Scaling Stats", "rules/Stats/Scaling Stats"),
            new Snippet("Attribute Stats", "rules/Stats/Attribute Stats"),
            new Snippet("Static Stats", "rules/Stats/Static Stats"),
            new Snippet("attribute", "rules/Attributes"),
            new Snippet("attribute increase", "rules/Attributes/Attribute Increases"),
            new Snippet("attribute maximum", "rules/Attributes/Attribute Increases"),
            new Snippet("boon", "rules/Boons And Banes"),
            new Snippet("bane", "rules/Boons And Banes"),
            new Snippet("Attack", "rules/Attacks/Attack Resolution*noChildren"),
            new Snippet("Attack Roll Formula", "rules/Attacks/Attack Resolution/Attack Roll Formulas"),
            new Snippet("Attack Damage Rule", "rules/Attacks/Attack Resolution/Attack Damage Rules"),
            new Snippet("Attack Roll Modifier", "rules/Attacks/Attack Resolution/Attack Roll Modifiers"),
            new Snippet("Natural", "rules/Attacks/Attack Resolution/Attack Roll Modifiers/Natural Results"),
            new Snippet("Success Level", "rules/Attacks/Attack Resolution/Success Level"),
            new Snippet("Miss", "rules/Attacks/Attack Resolution/Success Level"),
            new Snippet("Hit", "rules/Attacks/Attack Resolution/Success Level"),
            new Snippet("Graze", "rules/Attacks/Attack Resolution/Success Level"),
            new Snippet("Strike", "rules/Attacks/Attack Resolution/Success Level"),
            new Snippet("Crit", "rules/Attacks/Attack Resolution/Success Level"),
            new Snippet("Accuracy", "rules/Attacks/Attack Resolution/Attack Roll Modifiers"),
            new Snippet("Graze Range", "rules/Attacks/Attack Resolution/Attack Roll Formulas"),
            new Snippet("Crit Range", "rules/Attacks/Attack Resolution/Attack Roll Formulas"),
            new Snippet("Advantage", "rules/Attacks/Advantage\\/Disadvantage"),
            new Snippet("Disadvantage", "rules/Attacks/Advantage\\/Disadvantage"),
            new Snippet("Cover", "rules/Attacks/Cover"),
            new Snippet("Unaware", "rules/Attacks/Unaware And Hidden"),
            new Snippet("Hidden", "rules/Attacks/Unaware And Hidden"),
            new Snippet("Damage", "rules/Attacks/Damage*noChildren"),
            new Snippet("Damage Modifier Order", "rules/Attacks/Damage/Damage Modifier Order"),
            new Snippet("Damage Type", "rules/Attacks/Damage/Damage Types"),
            new Snippet("Explode", "rules/Attacks/Damage/Explode"),
            new Snippet("ancestry", "rules/Flavor/Ancestry"),
            new Snippet("ancestries", "rules/Flavor/Ancestry"),
            new Snippet("characteristic", "rules/Flavor/Passions"),
            new Snippet("passion", "rules/Flavor/Characteristics"),
            new Snippet("more summon techniques", "rules/Techniques/Summons/More Summon Techniques"),
            new Snippet("evasion", "rules/Stats/Attribute Stats/Evasion"),
            new Snippet("initiative roll", "rules/Combat Structure"),
            new Snippet("roll initiative", "rules/Combat Structure"),
            new Snippet("level", "rules/Stats/Scaling Stats/Level"),
            new Snippet("rank", "rules/Stats/Scaling Stats/Rank"),
            new Snippet("tier", "rules/Stats/Scaling Stats/Tier"),
            new Snippet("max health", "rules/Stats/Attribute Stats/Max Health"),
            new Snippet("power", "rules/Stats/Attribute Stats/Power"),
            new Snippet("speed", "rules/Stats/Attribute Stats/Speed"),


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
            new Snippet("scaling", "rules/Stats/Scaling Stats/Scaling", { whitelist: "tags" }),
            new Snippet("luck", "rules/Stats/Attribute Stats/Luck", { whitelist: "tags" }),
            new Snippet("initiative", "rules/Stats/Attribute Stats/Initiative"),
            new Snippet("range", "rules/Stats/Attribute Stats/Range", { whitelist: "tags" }),
            new Snippet("reach", "rules/Stats/Static Stats/Reach", { whitelist: "tags" }),
            new Snippet("size", "rules/Stats/Static Stats/Size", { whitelist: "tags" }),

            // Duplicates to avoid tag only conflicts
            new Snippet("max health", "rules/Stats/Attribute Stats/Max Health", { whitelist: "tags" }),
            new Snippet("Graze Range", "rules/Attacks/Attack Resolution/Attack Roll Formulas", { whitelist: "tags" }),
            new Snippet("Crit Range", "rules/Attacks/Attack Resolution/Attack Roll Formulas", { whitelist: "tags" }),
        ]
    }

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
            if (event.registered) Snippets.registerSnippet(new Snippet(condition.id, `conditions/${condition.id}`));
            else Snippets.unregisterSnippet(condition.id);
        });
    }
}
Snippets.setup();
App.onAppLoaded(() => Snippets.onAppLoadedSetup());