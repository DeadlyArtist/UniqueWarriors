class NPCHelpers {
    static defaultName = "New NPC";
    static scalingStatNames = new Set(["Level", "Importance", "Rank", "Tier", "Scaling"]);
    static attributeStatNames = new Set(["Max Health", "Speed", "Power", "Evasion", "Accuracy", "Luck", "Initiative", "Range"]);
    static staticStatNames = new Set(["Graze Range", "Crit Range", "Reach", "Size", "Actions", "Move Actions", "Quick Actions"]);
    static allStatNames = new Set();

    static setup() {
        this.allStatNames = new Set([...this.scalingStatNames, ...this.attributeStatNames, ...this.staticStatNames]);
    }

    static getDefaultStats() {
        return {
            level: 1,
            importance: 0,
            maxHealth: 0,
            power: 1,
            speed: 8,
            evasion: 12,
            accuracy: 2,
            initiative: 0,
            luck: 0,
            range: 24,
            grazeRange: 5,
            critRange: 1,
            reach: 2,
            size: 2,
            actions: 1,
            moveActions: 1,
            quickActions: 2,
        };
    }
}