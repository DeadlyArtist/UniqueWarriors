class Character {
    constructor(settings = null) {
        settings ??= {};

        this.id = settings.id ?? generateUniqueId();
        this.imageUrl = settings.imageUrl ?? null;
        this.name = settings.name ?? CharacterHelpers.defaultName;
        this.stats = settings.stats ?? CharacterHelpers.getDefaultStats();
        this.attributes = settings.attributes ?? CharacterHelpers.getDefaultAttributes();
        this.settings = settings.settings ?? {};
        this.settings.validate ??= true;

        this.items = new Registry();
        this.techniques = new Registry();
        this.masteries = new Registry();
        this.weapons = new Registry();
        this.paths = new Registry();
        this.ancestry = settings.ancestry ?? null;
        this.characteristics = new Registry();
        this.passions = new Registry();

        settings.items?.forEach(e => this.items.register(e));
        settings.techniques?.forEach(e => this.techniques.register(e));
        settings.masteries?.forEach(e => this.masteries.register(e));
        settings.weapons?.forEach(e => this.weapons.register(e));
        settings.paths?.forEach(e => this.paths.register(e));
        settings.characteristics?.forEach(e => this.characteristics.register(e));
        settings.passions?.forEach(e => this.passions.register(e));
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
        let tier = 1 + Math.floor(rank / 3);
        let maxRunes = 1 + Math.floor(level / 10);
        let attributeIncreases = this.getMaxAttributeIncreases();
        let maxAttributes = 2 + rank - tier;

        return {
            level,
            rank,
            tier,
            maxRunes,
            attributeIncreases,
            maxAttributes,
        };
    }

    getAttributeStats() {
        let { tier } = this.getScalingStats();
        let maxHealth = this.stats.maxHealth + tier * 20 + this.attributes.maxHealth * 10;
        let power = this.stats.power + this.attributes.power * 1;
        let speed = this.stats.speed + this.attributes.speed * 2;
        let evasion = this.stats.evasion + this.attributes.evasion * 1;
        let accuracy = this.stats.accuracy + this.attributes.accuracy * 1;
        let luck = this.stats.luck + this.attributes.luck * 1;
        let initiative = this.stats.initiative + this.attributes.initiative * 3;
        let range = this.stats.range + this.attributes.range * 6;

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
        return {
            grazeRange: this.stats.grazeRange,
            critRange: this.stats.critRange,
            reach: this.stats.reach,
            size: this.stats.size,
            actions: this.stats.actions,
            moveActions: this.stats.moveActions,
            quickActions: this.stats.quickActions,
        };
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
        let attributeIncreases = 4;
        if (level >= 2) attributeIncreases += 1;
        if (level >= 3) attributeIncreases += 1;
        if (level >= 4) attributeIncreases += 2;
        if (level >= 5) attributeIncreases += 2;
        if (level >= 6) attributeIncreases += 2;
        if (level >= 7) attributeIncreases += 1;
        if (level >= 9) attributeIncreases += 1;
        if (level >= 10) attributeIncreases += 2;
        if (level >= 11) attributeIncreases += 1;
        if (level >= 13) attributeIncreases += 1;
        if (level >= 16) attributeIncreases += 1;
        if (level >= 18) attributeIncreases += 1;
        if (level >= 20) attributeIncreases += 2;
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
        let techniques = 3;
        if (level >= 2) techniques += 2;
        if (level >= 3) techniques += 2;
        if (level >= 4) techniques += 2;
        if (level >= 5) techniques += 2;
        if (level >= 6) techniques += 1;
        if (level >= 7) techniques += 1;
        if (level >= 9) techniques += 1;
        if (level >= 11) techniques += 1;
        if (level >= 13) techniques += 1;
        if (level >= 14) techniques += 1;
        if (level >= 16) techniques += 1;
        if (level >= 18) techniques += 1;
        if (level >= 19) techniques += 1;
        if (level >= 21) techniques += 1;
        if (level >= 22) techniques += 1;
        if (level >= 24) techniques += 1;
        if (level >= 25) techniques += 2;
        if (level >= 26) techniques += 1;
        if (level >= 28) techniques += 1;
        if (level >= 29) techniques += 1;
        return techniques;
    }

    getMaxMasteries() {
        let level = this.stats.level;
        let masteries = 0;
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

    clone() {
        let json = this.toJSON();
        json.id = null;
        return Character.fromJSON(json);
    }

    // JSON
    toJSON() {
        return {
            id: this.id,
            imageUrl: this.imageUrl,
            name: this.name,
            stats: this.stats,
            attributes: this.attributes,
            items: this.items.getAll(),
            techniques: this.techniques.getAll(),
            masteries: this.masteries.getAll(),
            weapons: this.weapons.getAll(),
            paths: this.paths.getAll(),
            ancestry: this.ancestry,
            characteristics: this.characteristics.getAll(),
            passions: this.passions.getAll(),
        };
    }

    static fromJSON(json) {
        return new Character(json);
    }
}