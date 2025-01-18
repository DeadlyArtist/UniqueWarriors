class Character {
    constructor(settings = null) {
        settings ??= {};

        this.id = settings.id ?? generateUniqueId();
        this.version = settings.version ?? App.version;
        this.timestamp = settings.timestamp ?? Date.now();
        this.imageUrl = settings.imageUrl ?? null;
        this.name = settings.name ?? CharacterHelpers.defaultName;
        this.stats = { ...CharacterHelpers.getDefaultStats(), ...(settings.stats ?? {}) };
        this.baseStatOverrides = settings.baseStatOverrides ?? {};
        this.statOverrides = settings.statOverrides ?? {};
        this.attributes = {...CharacterHelpers.getEmptyAttributes(), ...(settings.attributes ?? {})};
        this.settings = settings.settings ?? {};
        this.settings.validate ??= true;
        this.details = settings.details ?? {};

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

    getStats() {
        return {
            ...this.getScalingStats(),
            ...this.getAttributeStats(),
            ...this.getStaticStats(),
        };
    }

    getScalingStats() {
        let level = this.stats.level;
        let rank = 1 + Math.floor(level / 5);
        let tier = 1 + Math.floor(level / 10);
        let attributeIncreases = this.getMaxAttributeIncreases();
        let attributeMaximum = 2 + rank - tier;
        let maxRunes = tier;
        let maxEnergy = rank * 3;
        let energyRecovery = rank;

        return {
            level,
            rank,
            tier,
            attributeIncreases,
            attributeMaximum,
            maxRunes,
            maxEnergy,
            energyRecovery,
        };
    }

    getAttributeStats() {
        let baseStats = { ...CharacterHelpers.getBaseStats(), ...(this.baseStatOverrides ?? {}) };
        let { tier, level } = this.getScalingStats();
        let maxHealth = baseStats.maxHealth + level * 3 + this.attributes.maxHealth * 8;
        let baseShield = baseStats.baseShield + level * 1 + this.attributes.baseShield * 10;
        let regeneration = baseStats.regeneration + this.attributes.regeneration * 1;
        let power = baseStats.power + this.attributes.power * 1;
        let speed = baseStats.speed + this.attributes.speed * 2;
        let evasion = baseStats.evasion + this.attributes.evasion * 1;
        let accuracy = baseStats.accuracy + this.attributes.accuracy * 1;
        let consistency = baseStats.consistency + this.attributes.consistency * 1;
        let agility = baseStats.agility + this.attributes.agility * 1;
        let potential = baseStats.potential + this.attributes.potential * 1;
        let luck = baseStats.luck + this.attributes.luck * 1;
        let reflex = baseStats.reflex + this.attributes.reflex * 1;
        let initiative = baseStats.initiative + reflex * 3;
        let genius = baseStats.genius + this.attributes.genius * 3;
        let multitasking = baseStats.multitasking + this.attributes.multitasking * 1;
        let range = baseStats.range + this.attributes.range * 6;

        return {
            maxHealth: this.statOverrides.maxHealth ?? maxHealth,
            baseShield: this.statOverrides.baseShield ?? baseShield,
            regeneration: this.statOverrides.regeneration ?? regeneration,
            power: this.statOverrides.power ?? power,
            speed: this.statOverrides.speed ?? speed,
            evasion: this.statOverrides.evasion ?? evasion,
            accuracy: this.statOverrides.accuracy ?? accuracy,
            consistency: this.statOverrides.consistency ?? consistency,
            agility: this.statOverrides.agility ?? agility,
            potential: this.statOverrides.potential ?? potential,
            luck: this.statOverrides.luck ?? luck,
            reflex: this.statOverrides.reflex ?? reflex,
            initiative: this.statOverrides.initiative ?? initiative,
            genius: this.statOverrides.genius ?? genius,
            multitasking: this.statOverrides.multitasking ?? multitasking,
            range: this.statOverrides.range ?? range,
        };
    }

    getStaticStats() {
        let baseStats = { ...CharacterHelpers.getBaseStats(), ...(this.baseStatOverrides ?? {}) };
        return {
            grazeRange: this.statOverrides.grazeRange ?? baseStats.grazeRange,
            critRange: this.statOverrides.critRange ?? baseStats.critRange,
            reach: this.statOverrides.reach ?? baseStats.reach,
            size: this.statOverrides.size ?? baseStats.size,
            actions: this.statOverrides.actions ?? baseStats.actions,
            moveActions: this.statOverrides.moveActions ?? baseStats.moveActions,
            quickActions: this.statOverrides.quickActions ?? baseStats.quickActions,
        };
    }

    getRemainingAttributeIncreases() {
        let amount = this.getScalingStats().attributeIncreases;
        Object.keys(this.attributes).forEach(name => amount -= [this.attributes[name]]);
        return amount;
    }

    getVariables() {
        let stats = this.getStats();
        let variables = new Map();
        for (let [name, value] of Object.entries(stats)) {
            variables.set(toTextCase(name), value);
        }
        return variables;
    }

    getMaxAttributeIncreases() {
        let level = this.stats.level;
        let attributeIncreases = 8;
        if (level >= 2) attributeIncreases += 4;
        if (level >= 4) attributeIncreases += 4;
        if (level >= 5) attributeIncreases += 2;
        if (level >= 6) attributeIncreases += 1;
        if (level >= 7) attributeIncreases += 1;
        if (level >= 9) attributeIncreases += 1;
        if (level >= 11) attributeIncreases += 1;
        if (level >= 13) attributeIncreases += 1;
        if (level >= 15) attributeIncreases += 2;
        if (level >= 16) attributeIncreases += 1;
        if (level >= 18) attributeIncreases += 1;
        if (level >= 21) attributeIncreases += 1;
        if (level >= 22) attributeIncreases += 1;
        if (level >= 24) attributeIncreases += 1;
        if (level >= 25) attributeIncreases += 2;
        if (level >= 26) attributeIncreases += 1;
        if (level >= 28) attributeIncreases += 1;
        if (level >= 29) attributeIncreases += 1;
        return attributeIncreases;
    }

    getMaxTechniques() {
        let level = this.stats.level;
        let { genius } = this.getAttributeStats();
        let techniques = 3 + genius; // one of which is a weapon core technique
        if (level >= 2) techniques += 2;
        if (level >= 3) techniques += 2;
        if (level >= 4) techniques += 2;
        if (level >= 5) techniques += 2; // one of which is a mutation
        if (level >= 6) techniques += 2;
        if (level >= 7) techniques += 2;
        if (level >= 9) techniques += 2;
        if (level >= 11) techniques += 2;
        if (level >= 13) techniques += 2;
        if (level >= 14) techniques += 2;
        if (level >= 16) techniques += 2;
        if (level >= 18) techniques += 2;
        if (level >= 19) techniques += 2;
        if (level >= 21) techniques += 2;
        if (level >= 22) techniques += 2;
        if (level >= 24) techniques += 2;
        if (level >= 25) techniques += 2;
        if (level >= 26) techniques += 2;
        if (level >= 28) techniques += 2;
        if (level >= 29) techniques += 2;
        return techniques;
    }

    getMaxMasteries() {
        let level = this.stats.level;
        let masteries = 0; // does not include the free path core
        if (level >= 3) masteries += 1;
        if (level >= 5) masteries += 1;
        if (level >= 8) masteries += 1;
        if (level >= 12) masteries += 1;
        if (level >= 17) masteries += 1;
        if (level >= 23) masteries += 1;
        if (level >= 27) masteries += 1;
        return masteries;
    }

    getMaxEvolutions() {
        let level = this.stats.level;
        let evolutions = 0;
        if (level >= 10) evolutions += 1;
        return evolutions;
    }

    getMaxAscendancies() {
        let level = this.stats.level;
        let ascendancies = 0;
        if (level >= 20) ascendancies += 1;
        return ascendancies;
    }

    canHaveFreeMutation() {
        return this.stats.level >= 5;
    }

    clone() {
        let json = this.toJSON();
        json.id = null;
        return Character.fromJSON(json);
    }

    // JSON
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
            attributes: this.attributes,
            settings: this.settings,
            details: this.details,
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
        return new Character(json);
    }
}

class MasteryManager {
    constructor(settings = null) {
        settings ??= {};

        let data = AbilitySectionHelpers.splitMasteries(settings.masteries ?? []);
        this.splitMasteries = data.splitMasteries;
        this.masteries = data.masteries;
        this.upgrades = data.upgrades;
        this.evolutions = data.evolutions;
        this.ascendancies = data.ascendancies;
    }

    getSplitRegistry(splitMastery, subMastery) {
        if (AbilitySectionHelpers.isUpgrade(subMastery)) {
            return splitMastery.upgrades;
        } else if (AbilitySectionHelpers.isEvolution(subMastery)) {
            return splitMastery.evolutions;
        } else if (AbilitySectionHelpers.isAscendancy(subMastery)) {
            return splitMastery.ascendancies;
        }
    }

    getSubRegistry(subMastery) {
        return this.getSplitRegistry(this, subMastery);
    }

    learn(masteryLike) {
        if (AbilitySectionHelpers.isTopMastery(masteryLike)) {
            if (this.masteries.has(masteryLike)) return;
            let splitMastery = AbilitySectionHelpers.splitMastery(masteryLike, { mainOnly: true });
            this.splitMasteries.register(splitMastery);
            this.masteries.register(splitMastery.mastery);
        } else {
            let splitMastery = this.splitMasteries.get(masteryLike?.parent);
            if (!splitMastery) return;

            let splitRegistry = this.getSplitRegistry(splitMastery, masteryLike);
            let subRegistry = this.getSubRegistry(masteryLike);
            if (!splitRegistry || splitRegistry.has(masteryLike)) return;
            subRegistry.register(masteryLike, { id: masteryLike.getPath() });
            splitRegistry.register(masteryLike);

            const fullMastery = Registries.masteries.get(masteryLike.parent);
            const parentSubSections = fullMastery?.subSections;
            const settings = {};
            if (parentSubSections) {
                // Traverse the sub-sections to find the closest preceding mastery for insertAfter
                for (const subSection of parentSubSections) {
                    if (subSection === masteryLike) break;

                    if (splitRegistry.has(subSection)) {
                        settings.insertAfter = subSection; // Update insertion target if the subSection exists in subRegistry
                    }
                }
            }
            if (!settings.insertAfter) {
                if (AbilitySectionHelpers.isUpgrade(masteryLike)) {
                    const lastMainSubSection = splitMastery.main.subSections.last;
                    if (lastMainSubSection) {
                        settings.insertAfter = lastMainSubSection;
                    } else {
                        settings.insertFirst = true;
                    }
                } else if (AbilitySectionHelpers.isEvolution(masteryLike)) {
                    const firstAscendancy = [...splitMastery.mastery.subSections].find(sub =>
                        AbilitySectionHelpers.isAscendancy(sub)
                    );
                    if (firstAscendancy) {
                        settings.insertBefore = firstAscendancy; // Insert before this ascendancy
                    } else {
                        // No ascendancies, insert last
                    }
                } else if (AbilitySectionHelpers.isAscendancy(masteryLike)) {
                    // Ascendancies: Always insert last
                }
            }

            splitMastery.mastery.subSections.register(masteryLike, settings);
        }
    }

    learnWithChildren(mastery) {
        let splitMastery = AbilitySectionHelpers.splitMastery(mastery);
        this.splitMasteries.register(splitMastery);
        splitMastery.upgrades.forEach(m => this.upgrades.register(m, { id: m.getPath() }));
        splitMastery.evolutions.forEach(m => this.evolutions.register(m, { id: m.getPath() }));
        splitMastery.ascendancies.forEach(m => this.ascendancies.register(m, { id: m.getPath() }));
    }

    unlearn(masteryLike) {
        if (AbilitySectionHelpers.isTopMastery(masteryLike)) {
            let splitMastery = this.splitMasteries.get(masteryLike);
            if (!splitMastery) return;
            this.masteries.unregister(masteryLike);
            this.splitMasteries.unregister(splitMastery);
            splitMastery.upgrades.forEach(m => this.upgrades.unregister(m, { id: m.getPath() }));
            splitMastery.evolutions.forEach(m => this.evolutions.unregister(m, { id: m.getPath() }));
            splitMastery.ascendancies.forEach(m => this.ascendancies.unregister(m, { id: m.getPath() }));
        } else {
            let splitMastery = this.splitMasteries.get(masteryLike?.parent);
            if (!splitMastery) return;
            let splitRegistry = this.getSplitRegistry(splitMastery, masteryLike);
            let subRegistry = this.getSubRegistry(masteryLike);
            if (!splitRegistry) return;
            splitRegistry.unregister(masteryLike);
            subRegistry.unregister(masteryLike.getPath());
            splitMastery.mastery.subSections.unregister(masteryLike);
        }
    }

    // No toJSON or fromJSON because you shouldn't serialize this class.
}
