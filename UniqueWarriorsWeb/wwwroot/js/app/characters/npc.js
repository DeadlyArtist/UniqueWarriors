class NPC {
    constructor(settings = null) {
        settings ??= {};

        this.subType = settings.subType;
        this.id = settings.id ?? generateUniqueId();
        this.imageUrl = settings.imageUrl ?? null;
        this.name = settings.name ?? ("New " + this.subType ?? "NPC");
        this.stats = settings.stats ?? NPCHelpers.getDefaultStats();
        this.statOverrides = settings.statOverrides ?? {};
        this.boons = settings.boons ?? {};
        this.settings = settings.settings ?? {};

        this.items = new Registry();
        this.techniques = new Registry();
        this.summons = new Registry();
        this.masteryManager = new MasteryManager({ masteries: settings.masteries });
        this.weapons = new Registry();
        this.paths = new Registry();
        this.ancestry = settings.ancestry ?? null;
        this.characteristics = new Registry();
        this.passions = new Registry();

        settings.items?.forEach(e => this.items.register(e.clone()));
        settings.techniques?.forEach(e => this.techniques.register(e.clone()));
        settings.summons?.forEach(e => this.summons.register(e.clone()));
        settings.weapons?.forEach(e => this.weapons.register(e));
        settings.paths?.forEach(e => this.paths.register(e));
        settings.characteristics?.forEach(e => this.characteristics.register(e));
        settings.passions?.forEach(e => this.passions.register(e));

        settings.mixed?.forEach(section => {
            let target = this.techniques;
            if (AbilitySectionHelpers.isTopMastery(section)) target = this.masteries;
            else if (NPCSectionHelpers.isSummon(section)) target = this.summons;
            target.register(section.clone());
        });
    }

    get masteries() {
        return this.masteryManager.masteries;
    }

    get splitMasteries() {
        return this.masteryManager.splitMasteries;
    }

    get upgrades() {
        return this.masteryManager.upgrades;
    }

    get evolutions() {
        return this.masteryManager.evolutions;
    }

    get ascendancies() {
        return this.masteryManager.ascendancies;
    }

    isSummon() {
        return this.subType == "Summon";
    }

    getStats() {
        return {
            ...this.getScalingStats(),
            ...this.getAttributeStats(),
            ...this.getStaticStats(),
        };
    }

    getScalingStats() {
        let level = this.stats.level;
        let importance = this.stats.importance;
        let rank = 1 + Math.floor(level / 5);
        let tier = 1 + Math.floor(rank / 3);
        let scaling = importance + rank - tier;

        return {
            level,
            importance,
            rank,
            tier,
            scaling,
        };
    }

    getAttributeStats() {
        let { tier, importance } = this.getScalingStats();
        let attributes = this.getAttributes();
        let maxHealth = (this.stats.maxHealth + tier * 8 + attributes.maxHealth * 2) * Math.pow(2, importance);
        let power = this.stats.power + attributes.power * 1;
        let speed = this.stats.speed + attributes.speed * 2;
        let evasion = this.stats.evasion + attributes.evasion * 1;
        let accuracy = this.stats.accuracy + attributes.accuracy * 1;
        let luck = this.stats.luck + importance;
        let initiative = this.stats.initiative + importance * 2 + attributes.initiative * 3;
        let range = this.stats.range + attributes.range * 6;

        if (this.settings.immobile) speed = 0;

        return {
            maxHealth,
            power,
            speed,
            evasion,
            accuracy,
            luck,
            initiative,
            range,
        };
    }

    getStaticStats() {
        let moveActions = this.stats.moveActions;
        if (this.settings.immobile) moveActions = 0;

        return {
            grazeRange: this.stats.grazeRange,
            critRange: this.stats.critRange,
            reach: this.stats.reach,
            size: this.stats.size,
            actions: this.stats.actions,
            moveActions,
            quickActions: this.stats.quickActions,
        };
    }

    getAttributes() {
        let boons = this.boons;
        let { scaling } = this.getScalingStats();
        let attributes = CharacterHelpers.getDefaultAttributes();
        for (let [key, value] of Object.entries(boons)) {
            attributes[key] = scaling + value;
        }
        return attributes;
    }

    getVariables() {
        let stats = this.getStats();
        let variables = new Map();
        for (let [name, value] of Object.entries(stats)) {
            variables.set(toTextCase(name), value);
        }
        return variables;
    }
}