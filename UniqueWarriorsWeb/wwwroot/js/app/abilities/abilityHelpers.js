class AbiltyHelpers {
    static createTechnique(settings = null) {
        settings ??= {};
        settings = {
            ...settings,
            type: AbilityTypes.technique,
        };
        return new Ability(settings);
    }
}

class AbilityTypes {
    static technique = "Technique";
    static mastery = "Mastery";
    static pathCore = "Path Core";
}

class AbilityZones {
    static melee = "Melee";
    static ranged = "Ranged";
}

class AbilityDistances {
    static reach = "Reach";
    static range = "Range";
}

class AbilityRangeHelpers {
    static short = "Short";
}

class AbilitySimplicities {
    static none = null;
    static basic = "Basic";
    static simple = "Simple";
}

class AreaTypes {
    static none = null;
    static circle = "Circle";
    static halfCircle = "Half Circle";
    static cone = "Cone";
    static square = "Square";
    static ray = "Ray";
}