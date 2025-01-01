class SummonHelpers {
    static defaultName = "New Summon";

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
}