class NPC {
    constructor(settings = null) {
        settings ??= {};

        this.id = settings.id ?? generateUniqueId();
        this.version = settings.version ?? App.version;
        this.timestamp = settings.timestamp ?? Date.now();
        this.imageUrl = settings.imageUrl ?? null;
        this.settings = settings.settings ?? {};
        this.name = settings.name ?? ("New " + this.settings.subType ?? "NPC");
        this.stats = { ...NPCHelpers.getDefaultStats(), ...(settings.stats ?? {}) };
        if (this.stats.importance < this.settings.minImportance) this.stats.importance = this.settings.minImportance;
        this.baseStatOverrides = settings.baseStatOverrides ?? {};
        this.statOverrides = settings.statOverrides ?? {};
        this.boons = settings.boons ?? {};
        this.details = settings.details ?? {};
        this.linkedSection = settings.linkedSection ?? {};

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

    get name() {
        return this.linkedSection?._title ?? this._name;
    }
    set name(name) {
        this._name = name;
        if (this.linkedSection) this.linkedSection.title = name;
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
        return this.settings.subType == "Summon";
    }

    isImmobile() {
        return this.settings.immobile;
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
        let tier = 1 + Math.floor(level / 10);
        let scaling = importance + rank - tier;
        let maxEnergy = importance;

        return {
            level,
            importance,
            rank,
            tier,
            scaling,
            maxEnergy,
        };
    }

    getAttributeStats() {
        let baseStats = { ...NPCHelpers.getBaseStats(), ...(this.baseStatOverrides ?? {}) };
        let { tier, rank, importance } = this.getScalingStats();
        let attributes = this.getAttributes();
        let maxHealth = (baseStats.maxHealth + rank * 3 + importance * 3 + attributes.maxHealth * tier * 2) * Math.pow(2, importance);
        let baseShield = (baseStats.baseShield + rank * 1 + importance * 1 + attributes.baseShield * tier * 3) * Math.pow(2, importance);
        let regeneration = baseStats.regeneration;
        let power = baseStats.power + attributes.power * tier * 1;
        let speed = baseStats.speed + attributes.speed * 2;
        let evasion = baseStats.evasion + attributes.evasion * 1;
        let accuracy = baseStats.accuracy + attributes.accuracy * 1;
        let consistency = baseStats.consistency;
        let potential = baseStats.potential;
        let luck = baseStats.luck + importance;
        let reflex = baseStats.reflex;
        let initiative = baseStats.initiative + importance * 2 + reflex * 3;
        let range = baseStats.range + attributes.range * 6;

        if (this.isImmobile()) speed = 0;

        return {
            maxHealth: this.statOverrides.maxHealth ?? maxHealth,
            baseShield: this.statOverrides.baseShield ?? baseShield,
            regeneration: this.statOverrides.regeneration ?? regeneration,
            power: this.statOverrides.power ?? power,
            speed: this.statOverrides.speed ?? speed,
            evasion: this.statOverrides.evasion ?? evasion,
            accuracy: this.statOverrides.accuracy ?? accuracy,
            consistency: this.statOverrides.consistency ?? consistency,
            potential: this.statOverrides.potential ?? potential,
            luck: this.statOverrides.luck ?? luck,
            reflex: this.statOverrides.reflex ?? reflex,
            initiative: this.statOverrides.initiative ?? initiative,
            range: this.statOverrides.range ?? range,
        };
    }

    getStaticStats() {
        let baseStats = { ...NPCHelpers.getBaseStats(), ...(this.baseStatOverrides ?? {}) };
        let { importance } = this.getScalingStats();
        let moveActions = baseStats.moveActions;
        if (this.isImmobile()) moveActions = 0;

        return {
            grazeRange: this.statOverrides.grazeRange ?? baseStats.grazeRange,
            critRange: this.statOverrides.critRange ?? baseStats.critRange,
            reach: this.statOverrides.reach ?? baseStats.reach,
            size: this.statOverrides.size ?? baseStats.size,
            actions: this.statOverrides.actions ?? (baseStats.actions + importance),
            moveActions: this.statOverrides.moveActions ?? moveActions,
            quickActions: this.statOverrides.quickActions ?? (baseStats.quickActions + Math.ceil(importance / 2)),
        };
    }

    getAttributes() {
        let boons = this.boons;
        let { scaling } = this.getScalingStats();
        let attributes = NPCHelpers.getEmptyAttributes();
        let nonScalingAttributes = NPCHelpers.nonScalingAttributeNames;
        for (let [name, value] of Object.entries(attributes)) {
            let boon = boons[name] ?? 0;
            attributes[name] = value + boon;
            if (!nonScalingAttributes.has(toTextCase(name))) attributes[name] += scaling;
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

    // Serialization
    clone() {
        return NPC.fromJSON(clone(this));
    }

    toJSON() {
        return {
            id: this.id,
            version: this.version,
            timestamp: this.timestamp,
            imageUrl: this.imageUrl,
            name: this.name,
            stats: this.stats,
            baseStatOverrides: this.baseStatOverrides,
            statOverrides: this.statOverrides,
            boons: this.boons,
            details: this.details,
            settings: this.settings,
            items: this.items.getAll(),
            techniques: this.techniques.getAll(),
            summons: this.summons.getAll(),
            masteries: this.masteries.getAll(),
            weapons: this.weapons.getAll(),
            paths: this.paths.getAll(),
            ancestry: this.ancestry,
            characteristics: this.characteristics.getAll(),
            passions: this.passions.getAll(),
        };
    }

    static fromJSON(json) {
        json.items = SectionHelpers.initSections(json.items ?? []);
        json.techniques = SectionHelpers.initSections(json.techniques ?? []);
        json.summons = SectionHelpers.initSections(json.summons ?? []);
        json.masteries = SectionHelpers.initSections(json.masteries ?? []);
        return new NPC(json);
    }
}