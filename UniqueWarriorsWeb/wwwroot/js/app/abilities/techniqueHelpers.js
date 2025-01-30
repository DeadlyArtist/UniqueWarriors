
class TechniqueHelpers {

    static _createBaseAttackTechnique(name, weapon, settings) {
        settings ??= {};

        let previous = settings.previous?.attack ?? settings.previous;
        if (!isString(previous) || previous == name) previous = "Category";
        settings = {
            name: name,
            connections: settings.connections ?? [previous],
            category: Registries.categories.get(weapon),
            attack: true,
            actionCost: {
                actions: 1,
            },
            simplicity: AbilitySimplicities.basic,
            damage: {
                scaling: "T",
                amount: 1,
                dieSize: 8,
                ...(settings.damage ?? {}),
            },
            ...settings,
        }

        settings.damage.damageTypes ??= WeaponHelpers.getDamageTypes(weapon);
        settings.statModifiers ??= WeaponHelpers.getStatModifiers(weapon);
        if (settings.area) {
            settings.targeting ??= {};
            settings.targeting.area = settings.area;
        }

        let ability = AbiltyHelpers.createTechnique(settings);
        ability.description ??= TechniqueDescriptionHelpers.findDescriptionForAttackTechnique(ability);

        if (ability.ranged) {
            if (ability.statModifiers.range == AbilityRangeHelpers.short) {
                ability.damage.dieSize += 2;
            }
        } else if (ability.melee) {
            ability.damage.dieSize += 2;
            if (ability.statModifiers.reach == 2) {
                ability.damage.dieSize -= 2;
            }
        }

        return ability;
    }

    static createAttackTechnique(name, weapon, settings) {
        settings ??= {};

        let ability = TechniqueHelpers._createBaseAttackTechnique(name, weapon, settings.ability);

        // Construct
        let melee = ability.melee;
        let delay = ability.delay;
        let addAction = settings.addAction ?? false;
        if (addAction) {
            ability.actionCost.actions = 2;
            ability.damage.amount *= 2;
        }

        let damageIncreases = settings.damageIncreases ?? 0;
        ability.damage.stepUpDieSize(damageIncreases);

        let area = ability.targeting.area;
        let sizeIncreases = settings.sizeIncreases ?? 0;
        let size2Increases = settings.size2Increases ?? 0;
        if (area.type == AreaTypes.circle) {
            let size = melee ? (sizeIncreases > 0 ? 2 + sizeIncreases * 2 : AbilityDistances.reach) : (4 + sizeIncreases * 2);
            ability.targeting.area.size ??= size;
        }


        // Evaluate
        if (area.type != AreaTypes.none) {
            ability.actionCost.quickActions = 1;
        }

        if (!settings.ability?.description) ability.description = TechniqueDescriptionHelpers.findDescriptionForAttackTechnique(ability);

        if (settings.channelConditions) {
            ability.description += " " + TechniqueDescriptions.channelConditions.replace("%condition%", settings.channelConditions);
        }

        return ability;
    }

    static createMutationTechnique(weapon, settings = null) {
        settings ??= {};

        let name = settings.name ?? weapon + " Mutation";
        let previous = settings.previous?.mutation ?? settings.previous;
        if (!isString(previous) || previous == name) previous = "Category";
        settings = {
            name: name,
            connections: settings.connections ?? [previous],
            category: Registries.categories.get(weapon),
            mutation: true,
            damage: {
                damageTypes: settings.damage?.damageTypes ?? WeaponHelpers.getDamageTypes(weapon),
                ...(settings.damage ?? {}),
            },
            ...settings,
        }

        settings.statModifiers ??= WeaponHelpers.getStatModifiers(weapon);
        ObjectHelpers.filterProperties(settings.statModifiers, key => !WeaponHelpers.disallowedMutationStats.has(key));

        let ability = AbiltyHelpers.createTechnique(settings);
        return ability;
    }

    static _createBaseEffectTechnique(name, weapon, settings) {
        settings ??= {};

        let previous = settings.previous?.effect ?? settings.previous;
        if (!isString(previous) || previous == name) previous = "Category";
        settings = {
            name: name,
            connections: settings.connections ?? [previous],
            category: Registries.categories.get(weapon),
            actionCost: {
                quickActions: 1,
            },
            ...settings,
        }
        let ability = AbiltyHelpers.createTechnique(settings);
        return ability;
    }

    static createEffectTechnique(name, weapon, settings) {
        settings ??= {};
        let weaponArticle = WeaponHelpers.getArticle(weapon) + " ";

        let ability = this._createBaseEffectTechnique(name, weapon, settings.ability);

        if (settings.condition) {
            ability.description = TechniqueDescriptionHelpers.condition(settings.condition, settings.conditionInstance);
            ability.trigger ??= TechniqueTriggers.afterYouHit.replace("%a_weapon%", weaponArticle + weapon.toLowerCase());
        } else if (settings.barrage) {
            ability.description = TechniqueDescriptionHelpers.replaceWeapon(TechniqueDescriptions.barrage, weapon);
            ability.actionCost.actions = 2;
        } else if (settings.charge) {
            ability.description = TechniqueDescriptionHelpers.replaceWeapon(TechniqueDescriptions.charge, weapon);
            ability.actionCost.actions = 1;
            ability.actionCost.moveActions = 1;
            ability.movement = true;
        } else if (settings.reactionAttack) {
            ability.description = TechniqueDescriptionHelpers.replaceWeapon(TechniqueDescriptions.reactionAttack, weapon);
            if (isString(settings.reactionAttack)) ability.description += " " + settings.reactionAttack;
            ability.actionCost.actions = 1;
            ability.actionCost.quickActions = 0;
        }

        return ability;
    }

    static createLongConditionTechnique(name, weapon, condition, settings) {
        settings ??= {};
        let ability = this.createEffectTechnique(name, weapon, { ...settings, ...{ condition, conditionInstance: { duration: 3 } } });
        return ability;
    }
    static createStrongConditionTechnique(name, weapon, condition, settings) {
        settings ??= {};
        let ability = this.createEffectTechnique(name, weapon, { ...settings, ...{ condition, conditionInstance: { severity: 2, duration: 1 } } });
        return ability;
    }

    static createStacksTechnique(name, weapon, condition, stacks, settings) {
        settings ??= {};
        let ability = this.createEffectTechnique(name, weapon, { ...settings, ...{ condition, conditionInstance: { stacks } } });
        return ability;
    }
}

