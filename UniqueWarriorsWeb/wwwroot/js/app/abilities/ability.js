class Ability {
    constructor(settings = null) {
        settings ??= {};

        this.name = settings.name; // Required
        this.type = settings.type;
        this.isTypeCore = settings.isTypeCore || settings.core || false; // e.g. true if weapon core or path core
        this.category = settings.category;
        this.connections = new Registry();
        this.original = settings.original;
        this.mutation = settings.mutation ?? false; // true, false, or mutation link
        this.description = settings.description;

        this.zone = settings.zone ?? (settings.melee ? AbilityZones.melee : AbilityZones.ranged);
        this.actionCost = settings.actionCost;
        this.simplicity = settings.simplicity;
        this.movement = settings.movement ?? false;
        this.teleportation = settings.teleportation ?? false;
        this.attack = settings.attack ?? false;
        this.channel = settings.channel ?? false;
        this.terrain = settings.terrain ?? false;
        this.summon = settings.summon ?? false; // true, false, or summon link
        this.statModifiers = settings.statModifiers ?? {};
        this.energyCost = settings.energyCost;
        this.limitations = settings.limitations;

        this.trigger = settings.trigger;
        this.damage = settings.damage;
        this.targeting = settings.targeting;

        // Optional
        this.delay = settings.delay;
        this.repeat = settings.repeat ?? false;

        this.subAbilities = new Registry();

        if (isString(this.category)) this.category = Registries.categories.get(this.category);
        if (!(this.actionCost instanceof ActionCost)) this.actionCost = new ActionCost(this.actionCost);
        if (!(this.energyCost instanceof ActionEnergyCost)) this.energyCost = new ActionEnergyCost(this.energyCost);
        if (!(this.limitations instanceof ActionLimitations)) this.limitations = new ActionLimitations(this.limitations);
        if (!(this.damage instanceof Damage)) this.damage = new Damage(this.damage);
        if (!(this.targeting instanceof Targeting)) this.targeting = new Targeting(this.targeting);

        for (const connection of settings.connections ?? []) this.connections.register(connection);
        for (const subAbility of settings.subAbilities ?? []) this.subAbilities.register(subAbility);
    }

    get melee() {
        return this.zone == AbilityZones.melee;
    }

    get ranged() {
        return this.zone == AbilityZones.ranged;
    }

    get isMutation() {
        return this.mutation == true;
    }

    get isMutatated() {
        return isString(this.mutation) || isObject(this.mutation);
    }

    // Serialization
    clone() {
        return Ability.fromJSON(clone(this));
    }

    toSection() {
        let attributes = [];

        // Line 1: Tags
        let line1 = [];
        if (this.type) line1.push(this.type);
        if (this.isTypeCore) line1.push(new HeadValue(this.category.type + " Core", this.category.name));
        else if (this.isMutation) line1.push(new HeadValue(this.category.type + " Mutation", this.category.name));
        else if (this.category) line1.push(new HeadValue(this.category.type, this.category.name));

        if (this.connections.size != 0) line1.push(new HeadValue("Connections", this.connections.join(', ') + "."));
        attributes.push(line1);

        // Add Energy Costs (Line 2+)
        if (this.energyCost.energy > 0) {
            attributes.push([new HeadValue("Energy", this.energyCost.energy)]);
        }
        if (this.energyCost.passiveSlots > 0) {
            attributes.push([new HeadValue("Passive Slots", this.energyCost.passiveSlots)]);
        }

        // Add Limitations (Line 3+)
        if (this.limitations.limit) {
            attributes.push([new HeadValue("Limit", this.limitations.limit)]);
        }
        if (this.limitations.cooldown) {
            attributes.push([new HeadValue("Cooldown", this.limitations.cooldown)]);
        }
        if (this.limitations.delayedCooldown) {
            attributes.push([new HeadValue("Delayed Cooldown", this.limitations.delayedCooldown)]);
        }
        if (this.limitations.restrictions) {
            attributes.push([new HeadValue("Restrictions", this.limitations.restrictions.join(', '))]);
        }

        // Line 4: Action Cost and Modifiers
        let line4 = [];
        let actionCost = this.actionCost.toString();
        if (actionCost) line4.push(actionCost);
        if (this.attack) line4.push("Attack");
        if (this.simplicity === AbilitySimplicities.basic) {
            line4.push(AbilitySimplicities.basic);
            line4.push(AbilitySimplicities.simple);
        } else if (this.simplicity) {
            line4.push(this.simplicity);
        }
        if (this.attack) {
            if (this.zone === AbilityZones.melee) line4.push("Melee");
            if (this.zone === AbilityZones.ranged) line4.push("Ranged");
        }
        if (this.movement) line4.push("Movement");
        if (this.teleportation) line4.push("Teleportation");
        if (this.channel) line4.push("Channel");
        if (this.terrain) line4.push("Terrain");
        if (this.summon) line4.push("Summon");
        if (!this.isMutation) attributes.push(line4);

        // Line 5: Trigger
        if (this.trigger) {
            attributes.push([new HeadValue("Trigger", this.trigger)]);
        }

        // Line 6: Damage, Stat Modifiers
        if (this.attack || this.isMutation) {
            let clonedDamage = this.damage.clone();
            let statModifiers = clone(this.statModifiers);

            // Add dieSize to damage if it exists in statModifiers
            if (statModifiers.dieSize) {
                this.isMutation ? clonedDamage.dieSize += statModifiers.dieSize : clonedDamage.stepUpDieSize(Math.floor(statModifiers.dieSize / 2));
                delete statModifiers.dieSize;
            }

            if (this.statModifiers.reach) {
                if (!this.description.match(/reach/i)) delete this.statModifiers.reach;
            }
            if (this.statModifiers.range) {
                if (!this.description.includes(/range/i)) delete this.statModifiers.range;
            }

            let damage = this.isMutation ? clonedDamage.toMutationString() : clonedDamage.toString();
            let damageLine = [new HeadValue("Damage", damage)];

            // Add Stat Modifiers
            if (Object.keys(statModifiers).length > 0) {
                // Positive Modifiers
                for (const [key, value] of Object.entries(statModifiers).filter(([_, v]) => v > 0)) {
                    damageLine.push(new HeadValue(toTextCase(key), `++${value}`));
                }

                // Negative Modifiers
                for (const [key, value] of Object.entries(statModifiers).filter(([_, v]) => v < 0)) {
                    damageLine.push(new HeadValue(toTextCase(key), `--${Math.abs(value)}`));
                }

                // Special Stat Modifiers
                for (const [key, value] of Object.entries(statModifiers).filter(([k, _]) => k == "range" && value == "Short")) {
                    damageLine.push(new HeadValue("Range", "-// 4"));
                }
            }
            attributes.push(damageLine);
        }

        return new Section({
            title: this.name,
            content: this.description,
            attributes,
        });
    }

    toJSON() {
        return {
            name: this.name,
            type: this.type,
            isTypeCore: this.isTypeCore,
            category: this.category,
            connections: this.connections,
            original: this.original,
            mutation: this.mutation,
            description: this.description,
            zone: this.zone,
            actionCost: this.actionCost.toJSON(),
            simplicity: this.simplicity,
            movement: this.movement,
            teleportation: this.teleportation,
            channel: this.channel,
            terrain: this.terrain,
            summon: this.summon,
            statModifiers: this.statModifiers,
            energyCost: this.energyCost.toJSON(),
            limitations: this.limitations.toJSON(),
            trigger: this.trigger,
            damage: this.damage.toJSON(),
            targeting: this.targeting.toJSON(),
            delay: this.delay,
            repeat: this.repeat,
            subAbilities: this.subAbilities.map(subAbility => subAbility.toJSON()),
        };
    }

    static fromJSON() {
        const obj = new Ability({
            name: data.name,
            type: data.type,
            isTypeCore: data.isTypeCore,
            category: data.category?.name,
            connections: data.connections.getAll(),
            original: data.original,
            mutation: data.mutation,
            description: data.description,
            zone: data.zone,
            actionCost: data.actionCost,
            simplicity: data.simplicity,
            movement: data.movement,
            teleportation: data.teleportation,
            channel: data.channel,
            terrain: data.terrain,
            summon: data.summon,
            statModifiers: data.statModifiers,
            energyCost: data.energyCost,
            limitations: data.limitations,
            trigger: data.trigger,
            damage: data.damage,
            targeting: data.targeting,
            delay: data.delay,
            repeat: data.repeat,
            subAbilities: data.subAbilities.map(subAbility => Ability.fromJSON(subAbility)),
        });

        return obj;
    }
}

class Damage {
    constructor(settings = null) {
        settings ??= {};

        this.scaling = new Set();
        this.amount = settings.amount ?? 0;
        this.dieSize = settings.dieSize ?? 0; // dieSize of 1 means no dice
        this.bonus = settings.bonus ?? 0;
        this.damageTypes = new Set();

        for (const damageTypes of settings.damageTypes ?? []) this.damageTypes.add(damageTypes);
        for (const variable of settings.scaling ?? ["T"]) this.scaling.add(variable);
    }

    stepUpDieSize(steps = 1) {
        if (steps > 0) {
            for (let i = 0; i < steps; i++) {
                if (this.dieSize < 4) {
                    this.dieSize += 1;
                    continue;
                }

                this.dieSize += 2;
                if (this.dieSize > 12) {
                    this.dieSize = 6;
                    this.amount *= 2;
                }
            }
        } else {
            for (let i = 0; i < -steps; i++) {
                if (this.dieSize <= 4) {
                    this.dieSize = Math.max(1, this.dieSize - 1);
                    continue;
                } else if (this.dieSize == 6 && this.amount % 2 == 0) {
                    this.dieSize = 12;
                    this.amount /= 2;
                }

                this.dieSize -= 2;
            }
        }
    }

    toString() {
        let string = [...this.scaling].join('') + this.amount;
        if (this.dieSize > 0) string += "d" + this.dieSize;
        if (this.bonus != 0) string += (this.bonus > 0 ? '+' : '-') + this.bonus;
        if (this.damageTypes.size != 0) string += ` (${[...this.damageTypes].map(d => d.toLowerCase()).join(', ')})`;
        return string;
    }

    toMutationString() {
        let string = this.dieSize < 0 ? "--" : "++";
        if (this.dieSize != 0) string += "d" + Math.abs(this.dieSize);
        if (this.damageTypes.size != 0) string += ` (${[...this.damageTypes].map(d => d.toLowerCase()).join(', ')})`;
        return string;
    }

    // Serialization
    clone() {
        return Damage.fromJSON(clone(this));
    }

    toJSON() {
        return {
            scaling: [...this.scaling],
            amount: this.amount,
            dieSize: this.dieSize,
            bonus: this.bonus,
            damageTypes: [...this.damageTypes],
        };
    }

    static fromJSON(data) {
        return new Damage({
            scaling: data.scaling,
            amount: data.amount,
            dieSize: data.dieSize,
            bonus: data.bonus,
            damageTypes: data.damageTypes,
        });
    }
}

class ActionCost {
    constructor(settings = null) {
        settings ??= {};

        this.actions = settings.actions ?? 0;
        this.moveActions = settings.moveActions ?? 0;
        this.quickActions = settings.quickActions ?? 0;
    }

    // Serialization
    toString() {
        let parts = [];
        parts.push(Array(this.moveActions).fill("Move Action").join(" + "));
        parts.push(Array(this.actions).fill("Action").join(", "));
        parts.push(Array(this.quickActions).fill("Quick Action").join(" + "));
        return parts.filter(p => p.length != 0).join(" + ");
    }

    clone() {
        return ActionCost.fromJSON(clone(this));
    }

    toJSON() {
        return {
            actions: this.actions,
            moveActions: this.moveActions,
            quickActions: this.quickActions,
        };
    }

    static fromJSON(data) {
        return new ActionCost({
            actions: data.actions,
            moveActions: data.moveActions,
            quickActions: data.quickActions,
        });
    }
}

class ActionEnergyCost {
    constructor(settings = null) {
        settings ??= {};

        this.energy = settings.energy ?? 0;
        this.passiveSlots = settings.passiveSlots ?? 0;
    }

    // Serialization
    clone() {
        return ActionEnergyCost.fromJSON(clone(this));
    }

    toJSON() {
        return {
            energy: this.energy,
            passiveSlots: this.passiveSlots,
        };
    }

    static fromJSON(data) {
        return new ActionEnergyCost({
            energy: data.energy,
            passiveSlots: data.passiveSlots,
        });
    }
}

class ActionLimitations {
    constructor(settings = null) {
        settings ??= {};

        this.limit = settings.limit;
        this.cooldown = settings.cooldown;
        this.delayedCooldown = settings.delayedCooldown;
        this.restrictions = settings.restrictions;
    }

    // Serialization
    clone() {
        return ActionLimitations.fromJSON(clone(this));
    }

    toJSON() {
        return {
            limit: this.limit,
            cooldown: this.cooldown,
            delayedCooldown: this.delayedCooldown,
            restrictions: this.restrictions,
        };
    }

    static fromJSON(data) {
        return new ActionLimitations({
            limit: data.limit,
            cooldown: data.cooldown,
            delayedCooldown: data.delayedCooldown,
            restrictions: data.restrictions,
        });
    }
}

class Targeting {
    constructor(settings = null) {
        settings ??= {};

        this.distance = settings.distance ?? null;
        this.withinDistance = settings.withinDistance ?? false;
        this.targets = settings.targets ?? 1;
        this.area = settings.area;
        this.areaAmount = settings.areaAmount ?? 1;

        if (!(this.area instanceof Area)) this.area = new Area(this.area);
    }

    // Serialization
    clone() {
        return Targeting.fromJSON(clone(this));
    }

    toJSON() {
        return {
            distance: this.distance,
            withinDistance: this.withinDistance,
            targets: this.targets,
            area: this.area.toJSON(),
            areaAmount: this.areaAmount,
        };
    }

    static fromJSON(data) {
        return new Targeting({
            distance: data.distance,
            withinDistance: data.withinDistance,
            targets: data.targets,
            area: Area.fromJSON(data.area),
            areaAmount: data.areaAmount,
        });
    }
}

class Area {
    constructor(settings = null) {
        settings ??= {};

        this.type = settings.type ?? AreaTypes.none;
        this.size = settings.size; // length, radius
        this.size2 = settings.size2; // width
        this.size3 = settings.size3; // height
    }

    // Serialization
    clone() {
        return Area.fromJSON(clone(this));
    }

    toJSON() {
        return {
            type: this.type,
            size: this.size,
            size2: this.size2,
            size3: this.size3,
        };
    }

    static fromJSON(data) {
        return new Area({
            type: data.type,
            size: data.size,
            size2: data.size2,
            size3: data.size3,
        });
    }
}

       