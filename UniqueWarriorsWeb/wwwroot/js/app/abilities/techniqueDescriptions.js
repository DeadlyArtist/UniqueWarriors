class TechniqueDescriptions {
    // Choose
    static chooseCombatant = "Choose a combatant within %distance%.";
    static basicAttack = "You attack a combatant within %distance%.";
    static multiBasicAttack = "You attack up to %amount% combatants within %distance%.";

    // Area
    static areaCircleAttack = "You attack all combatants within %size%.";
    static areaRangedCircleAttack = "Choose a point within %distance%. You attack all combatants within %size% meters of the point.";
    static areaHalfCircleAttack = "You attack all combatants within a %size% half circle.";
    static areaRangedHalfCircleAttack = "Choose a point within %distance%. You attack all combatants within a %size% meters half circle from the point.";
    static areaConeAttack = "You attack all combatants within a %size% meters cone.";
    static areaRangedConeAttack = "Choose a point within %distance%. You attack all combatants within a %size% meters cone from the point.";
    static areaRangedSquareAttack = "You attack all combatants within a %size% meters square within %distance%.";
    static areaRayAttack = "You attack all combatants within a %size2% meters wide ray from you to a point within %size%.";
    static areaRangedRayAttack = "You attack all combatants within a %size2% meters wide, %size% meters long ray within %distance%.";

    // Choose Area
    static chooseAreaCircleAttack = "You attack up to %amount% combatants within %size%.";
    static chooseAreaRangedCircleAttack = "Choose a point within %distance%. You attack up to %amount% combatants within %size% meters of the point.";
    static chooseAreaHalfCircleAttack = "You attack up to %amount% combatants within a %size% half circle.";
    static chooseAreaRangedHalfCircleAttack = "Choose a point within %distance%. You attack up to %amount% combatants within a %size% meters half circle from the point.";
    static chooseAreaConeAttack = "You attack up to %amount% combatants within a %size% meters cone.";
    static chooseAreaRangedConeAttack = "Choose a point within %distance%. You attack up to %amount% combatants within a %size% meters cone from the point.";
    static chooseAreaRangedSquareAttack = "You attack up to %amount% combatants within a %size% meters square within %distance%.";
    static chooseAreaRayAttack = "You attack up to %amount% combatants within a %size2% meters wide ray from you to a point within %size%.";
    static chooseAreaRangedRayAttack = "You attack up to %amount% combatants within a %size2% meters wide, %size% meters long ray within %distance%.";

    // Multi Area
    static multiAreaRangedCircleAttack = "Choose up to %amount% points within %distance%. You attack all combatants within %size% meters of any chosen point.";
    static multiAreaRayAttack = "Choose up to %amount% points within %size%. You attack all combatants within a %size2% meters wide ray from you to any chosen point.";

    // Condition
    static conditionEffect = "The combatant becomes %condition% for %rounds% rounds.";
    static stackableConditionEffect = "The combatant gains %stacks% %condition% stacks.";
    static youConditionEffect = "You become %condition% for %rounds% rounds.";
    static youStackableConditionEffect = "You gain %stacks% %condition% stacks.";
    static longConditionEffect = "The combatant becomes %condition%.";
    static longYouConditionEffect = "You become %condition%.";

    // Special Condition
    static bleedingConditionEffect = "The combatant gains 3 bleeding stacks, or 5 on a crit.";

    // Modifier
    static delay = "After %duration%, ";
    static repeat = "At the start of your turns, ";
    static delayRepeat = "After %duration%, at the start of your turns, ";
    static channelConditions = "Until you use a free action to end this ability, you become %condition%.";

    // Reaction
    static reactionAttack = "You use a basic %weapon% attack ability against it.";

    // Attack Modifier
    static increaseDamage = "The damage is increased by T1d6.";
    static increaseSeverity = "The severity of all applied conditions is increased by 1.";
    static advantageAgainst = "The attack gains advantage against the combatant.";

    // Special
    static barrage = "Choose a basic %weapon% attack ability. Over the course of the turn, you use the ability up to 3 times against different combatants.";
    static charge = "You move up to [Speed*2] meters in a direction of your choice. You gain 1 momentum for every 8 meters moved, up to a maximum of T2. At the end of the movement, you use a basic %weapon% attack ability against a combatant within reach that is in front of you relative to your movement. The damage is increased by [momentum]d6.";
}

class TechniqueDescriptionHelpers {
    static findDescriptionForAttackTechnique(ability) {
        let description = this.basicAttack(ability);
        let area = ability.targeting.area;
        if (area.type != AreaTypes.none) {
            description = this.areaAttack(ability);
        }

        return description;
    }

    static processTechniqueDescription(description) {
        // Need registry like snippet registry to find and wrap them in {} brackets.
        return description;
    }

    static basicAttack(ability) {
        let targets = ability.targeting.targets;

        let text = TechniqueDescriptions.basicAttack;
        if (targets > 1) text = TechniqueDescriptions.multiBasicAttack.replace("%amount%", targets);
        return this.replaceDistanceVariable(text, "distance", ability.melee ? AbilityDistances.reach : AbilityDistances.range);
    }

    static replaceDistanceVariable(text, variable, value) {
        return text.replace(new RegExp(escapeRegex(`%${variable}%`) + "( meters)?", "g"), function (match, group1) {
            if (group1) {
                if (isString(value)) return `[${value}] ${group1}`;
                return `${value} ${group1}`;
            } else {
                if (isString(value)) return value.toLowerCase();
                return value + " meters";
            }
        });
    }

    static replaceWeapon(description, weapon) {
        return description.replace("%weapon%", weapon.toLowerCase());
    }

    static replaceAWeapon(description, weapon) {
        return description.replace("%a_weapon%", WeaponHelpers.getArticle(weapon) + " " + weapon.toLowerCase());
    }

    static areaAttack(ability) {
        let size = ability.targeting.area.size;
        let size2 = ability.targeting.area.size2;
        let type = ability.targeting.area.type;
        let distance = ability.targeting.distance;
        let targets = ability.targeting.targets;
        let areaAmount = ability.targeting.areaAmount;

        let text;
        if (type == AreaTypes.circle) {
            text = distance ? TechniqueDescriptions.areaRangedCircleAttack : TechniqueDescriptions.areaCircleAttack;
            if (targets > 1) text = distance ? TechniqueDescriptions.chooseAreaRangedCircleAttack : TechniqueDescriptions.chooseAreaCircleAttack;
            if (distance && areaAmount > 1) text = TechniqueDescriptions.multiAreaRangedCircleAttack.replace("%amount%", areaAmount);
        } else if (type == AreaTypes.halfCircle) {
            text = distance ? TechniqueDescriptions.areaRangedHalfCircleAttack : TechniqueDescriptions.areaHalfCircleAttack;
            if (targets > 1) text = distance ? TechniqueDescriptions.chooseAreaRangedHalfCircleAttack : TechniqueDescriptions.chooseAreaHalfCircleAttack;
        } else if (type == AreaTypes.cone) {
            text = distance ? TechniqueDescriptions.areaRangedConeAttack : TechniqueDescriptions.areaConeAttack;
            if (targets > 1) text = distance ? TechniqueDescriptions.chooseAreaRangedConeAttack : TechniqueDescriptions.chooseAreaConeAttack;
        } else if (type == AreaTypes.square) {
            text = TechniqueDescriptions.areaRangedSquareAttack;
            if (targets > 1) text = TechniqueDescriptions.chooseAreaRangedSquareAttack;
        } else if (type == AreaTypes.ray) {
            text = distance ? TechniqueDescriptions.areaRangedRayAttack : TechniqueDescriptions.areaRayAttack;
            if (targets > 1) text = distance ? TechniqueDescriptions.chooseAreaRangedRayAttack : TechniqueDescriptions.chooseAreaRayAttack;
            if (!distance && areaAmount > 1) text = TechniqueDescriptions.multiAreaRayAttack.replace("%amount%", areaAmount);
        }

        text = text.replace("%amount%", targets);
        text = this.replaceDistanceVariable(text, "distance", distance);
        text = this.replaceDistanceVariable(text, "size", size);
        text = this.replaceDistanceVariable(text, "size2", size2);

        let delay = ability.delay;
        let repeat = ability.repeat;
        if (delay) {
            if (isNumber(delay)) delay = delay + " round" + (delay != 1 ? "s" : "");
            let delayDescription = repeat ? TechniqueDescriptions.delayRepeat : TechniqueDescriptions.delay;
            text = text.replace("You attack", delayDescription.replace("%duration%", delay) + "you attack");
        } else if (repeat) {
            text = text.replace("You attack", TechniqueDescriptions.repeat + "you attack");
        }

        return text;
    }

    static chooseCombatant(distance) {
        return this.replaceDistanceVariable(text, "distance", distance);
    }

    static condition(condition, settings = null) {
        settings ??= {};
        if (condition == "Bleeding") return TechniqueDescriptions.bleedingConditionEffect;

        let duration = settings.duration ?? 0;
        let severity = settings.severity ?? 1;
        let stacks = settings.stacks ?? 0;
        let you = settings.you ?? false;
        let choose = settings.choose; // distance

        let conditionValue = condition.toLowerCase();
        if (severity > 1 && stacks < 1) conditionValue += " " + severity;

        let text = you ? TechniqueDescriptions.youConditionEffect : TechniqueDescriptions.conditionEffect;
        if (stacks > 0) text = you ? TechniqueDescriptions.youStackableConditionEffect : TechniqueDescriptions.stackableConditionEffect;
        else if (duration < 1) text = you ? TechniqueDescriptions.longYouConditionEffect : TechniqueDescriptions.longConditionEffect;

        if (choose) text = this.chooseCombatant(choose) + " " + text;

        return text.replace("%condition%", conditionValue).replace("%rounds%", duration).replace("%stacks%", stacks);
    }
}
(function () { // Process default descriptions.
    Object.entries(TechniqueDescriptions).forEach(([key, value]) => {
        TechniqueDescriptions[key] = TechniqueDescriptionHelpers.processTechniqueDescription(value);
    });
})();


class TechniqueTriggers {
    static afterYouHit = "After you hit %a_weapon% attack against a combatant.";
    static youAreHit = "You are hit.";
    static youAreHitBy = "You are hit by %source%.";
    static youAreHitByCombatant = "You are hit by a combatant.";
    static youAreHitByCombatantWithinReach = "You are hit by a within reach.";
    static youAreHitByCombatantWithinRange = "You are hit by a within range.";
    static afterYouMiss = "You miss a combatant with %a_weapon% attack.";
    static beforeCombatantMoves = "Before a combatant enters your reach.";
    static combatantAppliesConditionToYou = "After a combatant applies a condition to you.";
    static beforeConditionDealsDamage = "Before a combatant takes damage from your condition.";
    static afterConditionGainedByCombatant = "After a combatant gains a condition for a duration from you.";
    static afterBlowgunHit = "After you hit a blowgun attack against a combatant.";
    static combatantFirstMoves = "After the combatant first moves.";
}


class TechniqueTriggerHelpers {

}
    