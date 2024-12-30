class SummonHelpers {
    static defaultName = "New Summon";

    static getVariantOriginal(character, summon) {
        let original = AbilitySectionHelpers.getVariantOriginal(summon);
        original = character.summons.get(original);
        return original;
    }
}