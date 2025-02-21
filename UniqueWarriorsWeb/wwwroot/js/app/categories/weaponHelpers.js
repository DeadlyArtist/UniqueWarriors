
class Weapons {
    static acid = "Acid";
    static alchemy = "Alchemy";
    static ascetism = "Ascetism";
    static axe = "Axe";
    static blood = "Blood";
    static blowgun = "Blowgun";
    static bow = "Bow";
    static cannon = "Cannon";
    static chains = "Chains";
    static claw = "Claw";
    static cosmology = "Cosmology";
    static crossbow = "Crossbow";
    static cudgel = "Cudgel";
    static dagger = "Dagger";
    static divinity = "Divinity";
    static earth = "Earth";
    static fire = "Fire";
    static foot = "Foot";
    static hammer = "Hammer";
    static hand = "Hand";
    static halberd = "Halberd";
    static ice = "Ice";
    static illusions = "Illusions";
    static light = "Light";
    static lightning = "Lightning";
    static machinery = "Machinery";
    static machineGun = "Machine Gun";
    static maw = "Maw";
    static metal = "Metal";
    static occultism = "Occultism";
    static orb = "Orb";
    static plants = "Plants";
    static poison = "Poison";
    static psionics = "Psionics";
    static revolver = "Revolver";
    static scythe = "Scythe";
    static shadow = "Shadow";
    static shield = "Shield";
    static shotgun = "Shotgun";
    static sniper = "Sniper";
    static souls = "Souls";
    static space = "Space";
    static spear = "Spear";
    static spirits = "Spirits";
    static sword = "Sword";
    static taoism = "Taoism";
    static water = "Water";
    static wind = "Wind";
    static words = "Words";
}

class WeaponHelpers {
    static setup() {
        Object.entries(Weapons).forEach(([key, value]) => CategoryHelpers.registerWeapon(value));
    }

    static _damageTypesByWeapon = ObjectHelpers.toMap({
        // Martial
        [Weapons.axe]: [DamageTypes.slashing],
        [Weapons.blowgun]: [DamageTypes.piercing],
        [Weapons.bow]: [DamageTypes.piercing],
        [Weapons.cannon]: [DamageTypes.bludgeoning],
        [Weapons.chains]: [DamageTypes.slashing, DamageTypes.sonic],
        [Weapons.claw]: [DamageTypes.slashing],
        [Weapons.crossbow]: [DamageTypes.piercing],
        [Weapons.cudgel]: [DamageTypes.bludgeoning],
        [Weapons.dagger]: [DamageTypes.piercing],
        [Weapons.foot]: [DamageTypes.bludgeoning],
        [Weapons.hammer]: [DamageTypes.bludgeoning],
        [Weapons.hand]: [DamageTypes.bludgeoning],
        [Weapons.halberd]: [DamageTypes.slashing],
        [Weapons.machineGun]: [DamageTypes.piercing],
        [Weapons.maw]: [DamageTypes.piercing],
        [Weapons.orb]: [DamageTypes.bludgeoning],
        [Weapons.revolver]: [DamageTypes.piercing],
        [Weapons.scythe]: [DamageTypes.slashing],
        [Weapons.shield]: [DamageTypes.bludgeoning],
        [Weapons.sniper]: [DamageTypes.piercing],
        [Weapons.shotgun]: [DamageTypes.piercing, DamageTypes.bludgeoning],
        [Weapons.spear]: [DamageTypes.piercing],
        [Weapons.sword]: [DamageTypes.slashing],

        // Elemental
        [Weapons.acid]: [DamageTypes.thermal],
        [Weapons.blood]: [DamageTypes.metabolism],
        [Weapons.earth]: [DamageTypes.bludgeoning],
        [Weapons.fire]: [DamageTypes.thermal],
        [Weapons.ice]: [DamageTypes.cryo],
        [Weapons.light]: [DamageTypes.holy, DamageTypes.thermal],
        [Weapons.lightning]: [DamageTypes.shock],
        [Weapons.metal]: [DamageTypes.piercing, DamageTypes.bludgeoning],
        [Weapons.plants]: [DamageTypes.slashing, DamageTypes.piercing],
        [Weapons.poison]: [DamageTypes.metabolism],
        [Weapons.shadow]: [DamageTypes.unholy],
        [Weapons.space]: [DamageTypes.slashing],
        [Weapons.water]: [DamageTypes.bludgeoning],
        [Weapons.wind]: [DamageTypes.slashing, DamageTypes.sonic],

        // Special
        [Weapons.alchemy]: [DamageTypes.cryo, DamageTypes.thermal, DamageTypes.shock],
        [Weapons.ascetism]: [DamageTypes.holy],
        [Weapons.cosmology]: [DamageTypes.unholy],
        [Weapons.divinity]: [DamageTypes.holy],
        [Weapons.illusions]: [DamageTypes.psychic],
        [Weapons.machinery]: [DamageTypes.bludgeoning, DamageTypes.piercing, DamageTypes.thermal],
        [Weapons.occultism]: [DamageTypes.unholy],
        [Weapons.psionics]: [DamageTypes.psychic],
        [Weapons.souls]: [DamageTypes.necrotic],
        [Weapons.spirits]: [DamageTypes.psychic],
        [Weapons.taoism]: [DamageTypes.metabolism],
        [Weapons.words]: [DamageTypes.psychic],
    });

    // Note: Stat calculations ignore the presence of distance modifiers (reach and range)
    // Distance modifiers don't apply to mutations
    static _statModifiersByWeapon = ObjectHelpers.toMap({
        // Martial
        [Weapons.axe]: {
            dieSize: 2,
            grazeRange: -3,
        },
        [Weapons.blowgun]: {
            dieSize: -2,
            grazeRange: 3,
        },
        [Weapons.bow]: {
            dieSize: -2,
            accuracy: 2,
        },
        [Weapons.cannon]: {
            dieSize: 2,
            accuracy: -2,
        },
        [Weapons.chains]: {
            dieSize: 2,
            accuracy: -2,
            reach: 2,
        },
        [Weapons.claw]: {
            dieSize: -2,
            critRange: 1,
        },
        [Weapons.crossbow]: {

        },
        [Weapons.cudgel]: {
            dieSize: 2,
            grazeRange: 4,
            accuracy: -4,
            reach: 2,
        },
        [Weapons.dagger]: {
            critRange: 1,
            grazeRange: 4,
            accuracy: -4,
        },
        [Weapons.foot]: {
            dieSize: -2,
            grazeRange: 3,
            reach: 2,
        },
        [Weapons.hammer]: {
            dieSize: 2,
            accuracy: -2,
        },
        [Weapons.hand]: {
            dieSize: -2,
            grazeRange: 3,
        },
        [Weapons.halberd]: {
            dieSize: 2,
            accuracy: -2,
            reach: 2,
        },
        [Weapons.machineGun]: {
            dieSize: -2,
            grazeRange: 6,
            accuracy: -2,
        },
        [Weapons.maw]: {
            accuracy: 2,
            grazeRange: -3,
        },
        [Weapons.orb]: {
            dieSize: -2,
            grazeRange: 3,
            range: AbilityRangeHelpers.short,
        },
        [Weapons.revolver]: {
            dieSize: -2,
            accuracy: 2,
            range: AbilityRangeHelpers.short,
        },
        [Weapons.scythe]: {
            critRange: 1,
            grazeRange: -3,
            reach: 2,
        },
        [Weapons.shield]: {
            dieSize: -2,
            grazeRange: 3,
        },
        [Weapons.sniper]: {
            critRange: 1,
            grazeRange: -3,
        },
        [Weapons.shotgun]: {
            dieSize: -2,
            grazeRange: 3,
            range: AbilityRangeHelpers.short,
        },
        [Weapons.spear]: {
            reach: 2,
        },
        [Weapons.sword]: {
            dieSize: -2,
            accuracy: 2,
        },

        // Elemental
        [Weapons.acid]: {
            range: AbilityRangeHelpers.short,
        },
        [Weapons.blood]: {
            dieSize: -2,
            grazeRange: 3,
        },
        [Weapons.earth]: {
            dieSize: 2,
            grazeRange: 4,
            accuracy: -4,
        },
        [Weapons.fire]: {
            dieSize: 2,
            grazeRange: 4,
            accuracy: -4,
        },
        [Weapons.ice]: {
            dieSize: -2,
            accuracy: 2,
        },
        [Weapons.light]: {
            dieSize: -2,
            accuracy: 4,
            grazeRange: -3,
        },
        [Weapons.lightning]: {
            dieSize: -2,
            critRange: 1,
        },
        [Weapons.metal]: {
            critRange: 1,
            accuracy: -2,
        },
        [Weapons.plants]: {
            grazeRange: -3,
            reach: 2,
        },
        [Weapons.poison]: {
            dieSize: -2,
            grazeRange: 3,
        },
        [Weapons.shadow]: {
            dieSize: -2,
            critRange: 1,
        },
        [Weapons.space]: {

        },
        [Weapons.water]: {
            dieSize: -2,
            accuracy: 2,
        },
        [Weapons.wind]: {
            dieSize: -2,
            critRange: 1,
        },

        // Special
        [Weapons.alchemy]: {
            dieSize: -2,
            grazeRange: 3,
        },
        [Weapons.ascetism]: {

        },
        [Weapons.cosmology]: {
            grazeRange: 3,
            accuracy: -2,
        },
        [Weapons.divinity]: {
            critRange: 1,
            grazeRange: -3,
        },
        [Weapons.illusions]: {
            grazeRange: 3,
        },
        [Weapons.machinery]: {
            dieSize: -2,
            critRange: 1,
        },
        [Weapons.occultism]: {
            dieSize: -2,
            grazeRange: 3,
        },
        [Weapons.psionics]: {
            dieSize: -2,
            accuracy: 2,
            range: AbilityRangeHelpers.short,
        },
        [Weapons.souls]: {
            grazeRange: 3,
            accuracy: -2,
        },
        [Weapons.spirits]: {

        },
        [Weapons.taoism]: {
            grazeRange: -3,
        },
        [Weapons.words]: {
            dieSize: -2,
            grazeRange: 3,
        },
    });

    static _articleByWeapon = ObjectHelpers.toMap({
        // Martial
        [Weapons.axe]: 'an',
        [Weapons.blowgun]: 'a',
        [Weapons.bow]: 'a',
        [Weapons.cannon]: 'a',
        [Weapons.chains]: 'a',
        [Weapons.claw]: 'a',
        [Weapons.crossbow]: 'a',
        [Weapons.cudgel]: 'a',
        [Weapons.dagger]: 'a',
        [Weapons.foot]: 'a',
        [Weapons.hammer]: 'a',
        [Weapons.hand]: 'a',
        [Weapons.halberd]: 'a',
        [Weapons.machineGun]: 'a',
        [Weapons.maw]: 'a',
        [Weapons.orb]: 'an',
        [Weapons.revolver]: 'a',
        [Weapons.scythe]: 'a',
        [Weapons.shield]: 'a',
        [Weapons.sniper]: 'a',
        [Weapons.shotgun]: 'a',
        [Weapons.spear]: 'a',
        [Weapons.sword]: 'a',

        // Elemental
        [Weapons.acid]: 'an',
        [Weapons.blood]: 'a',
        [Weapons.earth]: 'an',
        [Weapons.fire]: 'a',
        [Weapons.ice]: 'an',
        [Weapons.light]: 'a',
        [Weapons.lightning]: 'a',
        [Weapons.metal]: 'a',
        [Weapons.plants]: 'a',
        [Weapons.poison]: 'a',
        [Weapons.shadow]: 'a',
        [Weapons.space]: 'a',
        [Weapons.water]: 'a',
        [Weapons.wind]: 'a',

        // Special
        [Weapons.alchemy]: 'an',
        [Weapons.ascetism]: 'an',
        [Weapons.cosmology]: 'a',
        [Weapons.divinity]: 'a',
        [Weapons.illusions]: 'an',
        [Weapons.machinery]: 'a',
        [Weapons.occultism]: 'an',
        [Weapons.psionics]: 'a',
        [Weapons.souls]: 'a',
        [Weapons.spirits]: 'a',
        [Weapons.taoism]: 'a',
        [Weapons.words]: 'a',
    });


    static disallowedMutationStats = new Set("reach", "range");

    static getStatModifiers(weapon) {
        return clone(this._statModifiersByWeapon.get(weapon));
    }

    static getMutationStatModifiers(weapon) {
        return ObjectHelpers.filterProperties(this._statModifiersByWeapon.get(weapon), key => !this.disallowedMutationStats.has(key));
    }

    static getDamageTypes(weapon) {
        return clone(this._damageTypesByWeapon.get(weapon));
    }

    static getArticle(weapon) {
        return this._articleByWeapon.get(weapon);
    }
}


Loader.beforeLoadingCollections(() => WeaponHelpers.setup());