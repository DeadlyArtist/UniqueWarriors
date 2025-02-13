class SummonHelpers {
    static defaultName = "New Summon";
    static copyOverridableStatNames = ["Power", "Speed", "Evasion", "Accuracy", "Range", "Graze Range", "Crit Range", "Size", "Reach"];

    static openSummonEditor(character, summon, tab = null) {
        Pages.goToPath(`${Pages.summonEditor.link}?characterId=${encodeURIComponent(character.id)}&summonId=${encodeURIComponent(summon.id)}${tab ? `#?tab=${tab}` : ''}`);
    }

    static getVariantOriginal(character, summon) {
        let original = AbilitySectionHelpers.getVariantOriginal(summon);
        original = character.summons.get(original);
        return original;
    }

    static getTechniquesNotInOriginal(character, summon) {
        let original = AbilitySectionHelpers.getVariantOriginal(summon);
        original = character.summons.get(original);
        return summon.npc.techniques.filter(t => !original.npc.techniques.has(t));
    }

    static getSummonsNotInOriginal(character, summon) {
        let original = AbilitySectionHelpers.getVariantOriginal(summon);
        original = character.summons.get(original);
        return summon.npc.summons.filter(t => !original.npc.summons.has(t));
    }

    static copyVariablesFromSummoner(summon, summonerVariables, npc = null) {
        npc ??= summon.npc;
        let newVariables = npc.getVariables();
        for (let statName of this.copyOverridableStatNames) {
            let value = summonerVariables.get(statName);
            if (value != null) newVariables.set(statName, value);
        }
        for (let statName of Object.keys(npc.statOverrides)) newVariables.set(toTextCase(statName), npc.statOverrides[statName]);
        return newVariables;
    }

    static getSummonSectionVariables(summon, variables, npc = null) {
        npc ??= summon.npc;
        return npc.settings.copyStatsFromSummoner ? SummonHelpers.copyVariablesFromSummoner(summon, variables, npc) : npc.getVariables();
    }

    static updateWeaponsHeadValue(summon) {
        summon.updateHeadValue("Weapons", summon.npc.weapons.join(', ') + '.');
    }
}