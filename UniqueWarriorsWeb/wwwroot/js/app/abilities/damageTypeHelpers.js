class DamageTypeHelpers {
    static setup() {
        Object.entries(DamageTypes).forEach(([key, value]) => Registries.damageTypes.register(value));
    }


}

class DamageTypes {
    static bludgeoning = "Bludgeoning";
    static piercing = "Piercing";
    static slashing = "Slashing";
    static cryo = "Cryo";
    static thermal = "Thermal";
    static shock = "Shock";
    static necrotic = "Necrotic";
    static psychic = "Psychic";
    static sonic = "Sonic";
    static holy = "Holy";
    static unholy = "Unholy";
    static metabolism = "Metabolism";
}

Loader.beforeLoadingCollections(() => DamageTypeHelpers.setup());