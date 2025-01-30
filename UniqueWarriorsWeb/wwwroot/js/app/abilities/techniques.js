class Techniques {

    static lastByCategory = new Map();

    static registerTechnique(ability) {
        let last = this.lastByCategory.get(ability.category);
        Registries.techniques.register(ability.toSection(), { insertAfter: last });
        this.lastByCategory.set(ability);
    }

    static registerAtStart() {
        let weapon, previous, previous_b;

        // Axe
        weapon = Weapons.axe;
        previous = {
            attack: "Axe Cleave",
            effect: "Sundering Split",
        };
        this.registerTechnique(TechniqueHelpers.createAttackTechnique("Axe Cleave", weapon, { ability: { previous, core: true, melee: true, } }));
        this.registerTechnique(TechniqueHelpers.createLongConditionTechnique("Sundering Split", weapon, "Sundered", { ability: { previous, } }));
        this.registerTechnique(TechniqueHelpers.createMutationTechnique(weapon));
        this.registerTechnique(TechniqueHelpers.createAttackTechnique("Whirlwind", weapon, { ability: { previous, melee: true, area: { type: AreaTypes.circle, }, } }));
        this.registerTechnique(TechniqueHelpers.createAttackTechnique("Ultra Whirlwind", weapon, { ability: { previous, melee: true, area: { type: AreaTypes.circle, }, delay: 1, }, sizeIncreases: 3 }));
        this.registerTechnique(TechniqueHelpers.createAttackTechnique("Tornado", weapon, { ability: { previous, melee: true, channel: true, repeat: true, area: { type: AreaTypes.circle, }, }, channelConditions: "slowed 2", }));
        this.registerTechnique(TechniqueHelpers.createEffectTechnique("Barrage", weapon, { barrage: true, ability: { previous, }, }));
        this.registerTechnique(TechniqueHelpers.createEffectTechnique("Charge", weapon, { charge: true, ability: { previous, }, }));
        this.registerTechnique(TechniqueHelpers.createEffectTechnique("Retaliate", weapon, { reactionAttack: TechniqueDescriptions.increaseDamage, ability: { previous, trigger: TechniqueTriggers.youAreHitByCombatant, } }));
        this.registerTechnique(TechniqueHelpers.createAttackTechnique("Throw Axe", weapon, { ability: { previous, ranged: true, } }));
        this.registerTechnique(TechniqueHelpers.createEffectTechnique("Reckless Counter", weapon, { reactionAttack: TechniqueDescriptions.increaseSeverity, ability: { previous, trigger: TechniqueTriggers.youAreHitByCombatant, } }));
        this.registerTechnique(TechniqueHelpers.createEffectTechnique("Force Through", weapon, { ability: { previous, trigger: TechniqueDescriptionHelpers.replaceAWeapon(TechniqueTriggers.afterYouMiss, weapon), description: TechniqueDescriptions.advantageAgainst, } }));
        this.registerTechnique(TechniqueHelpers.createStacksTechnique("Brutal Chop", weapon, "Bleeding", { ability: { previous, } }));

        // Blowgun
        weapon = Weapons.blowgun;
        previous = {
            attack: "Blowgun Shot",
            effect: "Poison Dart",
        };
    }

    static registerAtEnd() {
        let weapon, previous, previous_b;

        // Axe
        weapon = Weapons.axe;
        previous = {
            attack: "Axe Cleave",
            effect: "Sundering Split",
        };
    }
}
Loader.onLoadingCollections(() => Techniques.registerAtStart());
Loader.beforeBaseCollectionsLoaded(() => Techniques.registerAtEnd());
