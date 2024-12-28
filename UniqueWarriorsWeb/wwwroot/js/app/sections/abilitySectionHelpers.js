class AbilitySectionHelpers {

    static getActionCostTag(section) {
        return [...section.tags].find(value => value.includes("Action"));
    }

    static getActionCostAndTag(section) {
        let cost = this.getActionCostTag(section);
        let costMap = new Map();
        if (!cost) return { tag: cost, map: costMap };
        for (const item of cost.split(" + ")) {
            costMap.set(item, (costMap.get(item) || 0) + 1);
        }
        return { tag: cost, map: costMap };
    }

    static getActionCost(section) {
        return this.getActionCostAndTag(section).map;
    }

    static getWeapons(section) {
        return new Set(section.getHeadValueParts("Weapon").concat(section.getHeadValueParts("Weapon Core")));
    }

    static getType(section) {
        let type = null;
        ["Technique", "Mastery"].forEach(tag => {
            if (section.tags.has(tag)) type = tag;
        });
        ["Path Core", "Summon"].forEach(headValueName => {
            if (section.headValues.has(headValueName)) type = headValueName;
        });
        return type;
    }

    static getLimit(section) {
        return section.headValues.get("Limit");
    }

    static getCooldown(section) {
        return section.headValues.get("Cooldown");
    }

    static getDelayedCooldown(section) {
        return section.headValues.get("Delayed Cooldown");
    }

    static getMax(section) {
        return section.headValues.get("Max");
    }

    static isAttack(section) {
        return section.tags.has("Attack");
    }

    static isBasic(section) {
        return section.tags.has("Basic");
    }

    static isSimple(section) {
        return section.tags.has("Simple") || section.tags.has("Basic");
    }

    static isChannel(section) {
        return section.tags.has("Channel");
    }

    static createsSummon(section) {
        return section.tags.has("Summon");
    }

    static createsTerrain(section) {
        return section.tags.has("Terrain");
    }

    static getUpkeep(section) {
        return section.headValues.get("Upkeep") ?? 1;
    }

    static isMutation(section) {
        return section.headValues.has("Weapon Mutation");
    }

    static isTrigger(section) {
        return section.headValues.has("Trigger");
    }

    static getTrigger(section) {
        return section.headValues.get("Trigger");
    }

    static isMastery(section) {
        return section.tags.has("Mastery");
    }

    static isPathCore(section) {
        return section.headValues.has("Path Core");
    }

    static isTopMastery(section) {
        return this.isMastery(section) || this.isPathCore(section);
    }

    static isSubMastery(section) {
        return this.isUpgrade(section) || this.isEvolution(section) || this.isAscendancy(section);
    }

    static isMasteryLike(section) {
        return this.isTopMastery(section) || this.isSubMastery(section);
    }

    static isTechnique(section) {
        return section.tags.has("Technique");
    }

    static isWeaponCore(section) {
        return section.headValues.has("Weapon Core");
    }

    static isUpgrade(section) {
        return section.tags.has("Upgrade");
    }

    static isEvolution(section) {
        return section.tags.has("Evolution");
    }

    static isAscendancy(section) {
        return section.tags.has("Ascendancy");
    }

    static getDistanceType(section) {
        if (section.tags.has("Melee")) return "Melee";
        else return "Ranged";
    }

    static getTargetingTypes(section) {
        let tags = [];
        ["Area", "Multitarget"].forEach(tag => {
            if (section.tags.has(tag)) tags.push(tag);
        });
        if (tags.length == 0) tags.push("Singletarget");
        return new Set(tags);
    }

    static getSpecialTypes(section) {
        let tags = [];
        ["Summon", "Terrain", "Channel"].forEach(tag => {
            if (section.tags.has(tag)) tags.push(tag);
        });
        return new Set(tags);
    }

    static getConnections(section) {
        return new Set(section.getHeadValueParts("Connections"));
    }

    static getUnlocks(section) {
        return new Set(section.getHeadValueParts("Unlocks"));
    }

    static categoryHeadValueNames = ["Weapon", "Weapon Core", "Weapon Mutation", "Path", "Path Core", "Summon"];
    static getCategories(section) {
        for (let headValueName of this.categoryHeadValueNames) {
            let values = section.getHeadValueParts(headValueName);
            if (values.length != 0) return values;
        }
        return [];
    }

    static getMainCategory(section) {
        let categories = this.getCategories(section);
        if (categories.length == 0) return null;
        return categories[0];
    }

    static getSecondaryCategory(section) {
        let categories = this.getCategories(section);
        if (categories.length < 2) return null;
        return categories[1];
    }

    static parseStatModifier(section, name) {
        let valueRaw = section.getHeadValueValue(name);
        if (!valueRaw) return null;
        let type = null;
        ["++", "--", "-//", "+//"].forEach(operator => {
            if (valueRaw.startsWith(operator)) type = operator.substring(0, operator.length - 1);
        });
        if (type == null) return { operator: null, value: parseInt(valueRaw) }

        valueRaw = valueRaw.replace(/^[+-\\/]*\s*/, "");
        let value = parseInt(valueRaw);
        return { operator: type, value };
    }

    static getStatModifiers(section) {
        let statModifiers = new Map();
        CharacterHelpers.allStatNames.forEach(stat => {
            let modifier = this.parseStatModifier(section, stat);
            if (modifier) statModifiers.set(stat, modifier);
        });
        return statModifiers;
    }

    static splitMasteries(masteries) {
        let splitMasteries = new Registry();
        let newMasteries = new Registry();
        let masteryLikes = new Registry();
        let upgrades = new Registry();
        let evolutions = new Registry();
        let ascendancies = new Registry();
        for (let mastery of masteries) {
            mastery = mastery.clone();
            let splitMastery = { title: mastery.title, mastery, main: mastery.cloneWithoutSubSections(), upgrades: new Registry(), evolutions: new Registry(), ascendancies: new Registry() };
            for (let subSection of mastery.subSections) {
                let path = subSection.getPath();
                if (this.isUpgrade(subSection)) {
                    splitMastery.upgrades.register(subSection);
                    upgrades.register(subSection, { id: path });
                }
                else if (this.isEvolution(subSection)) {
                    splitMastery.evolutions.register(subSection);
                    evolutions.register(subSection, { id: path });
                }
                else if (this.isAscendancy(subSection)) {
                    splitMastery.ascendancies.register(subSection);
                    ascendancies.register(subSection, { id: path });
                }
                else {
                    splitMastery.main.subSections.register(subSection);
                }
            }
            newMasteries.register(mastery);
            splitMasteries.register(splitMastery);
        }
        return { splitMasteries, masteries: newMasteries, upgrades, evolutions, ascendancies };
    }

    static splitMastery(mastery, settings = null) {
        settings ??= {};
        if (!settings.mainOnly) mastery = mastery.clone();
        let splitMastery = { title: mastery.title, mastery, main: mastery.cloneWithoutSubSections(), upgrades: new Registry(), evolutions: new Registry(), ascendancies: new Registry() };
        for (let subSection of mastery.subSections) {
            if (this.isUpgrade(subSection)) splitMastery.upgrades.register(subSection);
            else if (this.isEvolution(subSection)) splitMastery.evolutions.register(subSection);
            else if (this.isAscendancy(subSection)) splitMastery.ascendancies.register(subSection);
            else splitMastery.main.subSections.register(subSection);
        }

        if (settings.mainOnly) {
            splitMastery.mastery = splitMastery.main.clone();
            splitMastery.upgrades.clear();
            splitMastery.evolutions.clear();
            splitMastery.ascendancies.clear();
        }

        return splitMastery;
    }
}