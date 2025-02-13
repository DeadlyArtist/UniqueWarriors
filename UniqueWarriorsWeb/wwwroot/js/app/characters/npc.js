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
        let maxHealth = (1 + baseStats.maxHealth + rank * 2 + importance * 2 + attributes.maxHealth * rank * 1) * Math.pow(2, importance);
        let baseShield = (1 + baseStats.baseShield + rank * 3 + importance * 3 + attributes.baseShield * rank * 1) * Math.pow(2, importance);
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

    compareSurface(other) {
        if (!other) return false;

        if (this.imageUrl != other.imageUrl) return false;
        if (this.name != other.name) return false;
        if (JSON.stringify(this.stats) != JSON.stringify(other.stats)) return false;
        if (JSON.stringify(this.baseStatOverrides) != JSON.stringify(other.baseStatOverrides)) return false;
        if (JSON.stringify(this.statOverrides) != JSON.stringify(other.statOverrides)) return false;
        if (JSON.stringify(this.boons) != JSON.stringify(other.boons)) return false;
        if (JSON.stringify(this.details) != JSON.stringify(other.details)) return false;
        if (JSON.stringify(this.settings) != JSON.stringify(other.settings)) return false;
        if (JSON.stringify(this.weapons) != JSON.stringify(other.weapons)) return false;
        if (JSON.stringify(this.paths) != JSON.stringify(other.paths)) return false;
        if (JSON.stringify(this.characteristics) != JSON.stringify(other.characteristics)) return false;
        if (JSON.stringify(this.passions) != JSON.stringify(other.passions)) return false;
        if (this.ancestry != other.ancestry) return false;

        return true;
    }

    compareRecursively(other) {
        if (!other) return false;
        if (!this.compareSurface(other)) return false;
        if (this.techniques.length != other.techniques.length) return false;
        if (this.summons.length != other.summons.length) return false;
        if (this.masteries.length != other.masteries.length) return false;

        for (let section of this.techniques) {
            if (!section.compareRecursively(other.techniques.get(section.title))) return false;
        }
        for (let section of this.summons) {
            if (!section.compareRecursively(other.summons.get(section.title))) return false;
        }
        for (let section of this.masteries) {
            if (!section.compareRecursively(other.masteries.get(section.title))) return false;
        }

        return true;
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