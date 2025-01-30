
class Paths {
    static assassin = "Assassin";
    static berserker = "Berserker";
    static duelist = "Duelist";
    static hunter = "Hunter";
    static monarch = "Monarch";
    static monk = "Monk";
    static sorcerer = "Sorcerer";
    static thaumaturge = "Thaumaturge";
    static trickster = "Trickster";
    static witch = "Witch";
}

class PathHelpers {
    static setup() {
        Object.entries(Paths).forEach(([key, value]) => CategoryHelpers.registerPath(value));
    }

}


Loader.beforeLoadingCollections(() => PathHelpers.setup());