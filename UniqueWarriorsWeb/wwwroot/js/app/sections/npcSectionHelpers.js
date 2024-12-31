class NPCSectionHelpers {

    static getBoons(section, settings = null) {
        settings ??= {};
        let result = {};
        let boons = section.getHeadValueParts("Boons");
        let banes = section.getHeadValueParts("Banes");
        for (let boon of boons) {
            let amount = 1;
            boon = boon.replace(/^(\d*)x\s+/, (matched, group1) => {
                if (group1) amount = parseInt(group1);
                return "";
            });
            result[boon] = (result[boon] ?? 0) + amount
        }
        for (let bane of banes) {
            let amount = 1;
            bane = bane.replace(/^(\d*)x\s+/, (matched, group1) => {
                if (group1) amount = parseInt(group1);
                return "";
            });
            result[bane] = (result[bane] ?? 0) - amount
        }
        if (!settings.keepCase) result = ObjectHelpers.mapKeys(result, key => toCamelCase(key));
        return result;
    }

    static isObject(section) {
        return section.headValues.has('Object');
    }

    static isSummon(section) {
        return section.headValues.has('Summon');
    }

    static isImmobile(section) {
        return section.tags.has('Immobile') || (section.tags.has('Object') && !section.tags.has('Mobile'));
    }

    static getWeapons(section) {
        return new Set(section.getHeadValueParts("Weapons"));
    }

    static parseNPC(section, settings = null) {
        settings ??= {};
        let isSummon = this.isSummon(section);
        let boons = this.getBoons(section);
        let weapons = this.getWeapons(section);
        let object = this.isObject(section);
        let immobile = this.isImmobile(section);

        let parsedSettings = { name: section.title, boons, weapons, settings: { object, immobile } };
        if (isSummon) {
            parsedSettings.subType = "Summon";
        }
        let statOverrides = {};
        parsedSettings.statOverrides = statOverrides;
        for (let statName of [...NPCHelpers.attributeStatNames, ...NPCHelpers.staticStatNames]) {
            let value = section.getHeadValueValue(statName);
            if (value != null) statOverrides[toCamelCase(statName)] = value;
        }
        let stats = {};
        parsedSettings.stats = stats;
        for (let statName of ["Level", "Importance"]) {
            let value = section.getHeadValueValue(statName);
            if (value != null) stats[toCamelCase(statName)] = value;
        }

        let npc = new NPC({ ...parsedSettings, ...settings });
        return npc;
    }
}