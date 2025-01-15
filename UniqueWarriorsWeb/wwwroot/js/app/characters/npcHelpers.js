class NPCHelpers {
    static defaultName = "New NPC";
    static scalingStatNames = new Set(["Level", "Importance", "Rank", "Tier", "Scaling", "Max Energy", "Energy Recovery"]);
    static attributeStatNames = new Set(["Max Health", "Base Shield", "Regeneration", "Speed", "Power", "Evasion", "Accuracy", "Consistency", "Potential", "Luck", "Reflex", "Initiative", "Range"]);
    static staticStatNames = new Set(["Graze Range", "Crit Range", "Reach", "Size", "Actions", "Move Actions", "Quick Actions"]);
    static allStatNames = new Set();

    static setup() {
        this.allStatNames = new Set([...this.scalingStatNames, ...this.attributeStatNames, ...this.staticStatNames]);
    }

    static getDefaultStats() {
        return {
            level: 1,
            importance: 0,
        };
    }

    static getBaseStats() {
        return {
            maxHealth: 0,
            baseShield: 0,
            regeneration: 0,
            power: 1,
            speed: 8,
            evasion: 12,
            accuracy: 2,
            consistency: 0,
            agility: 0,
            potential: 0,
            luck: 0,
            reflex: 0,
            initiative: 0,
            genius: 0,
            multitasking: 2,
            range: 24,
            grazeRange: 5,
            critRange: 1,
            reach: 2,
            size: 2,
            actions: 1,
            moveActions: 1,
            quickActions: 0,
        };
    }

    static getEmptyAttributes() {
        return {
            maxHealth: 0,
            baseShield: 0,
            power: 0,
            speed: 0,
            evasion: 0,
            accuracy: 0,
            range: 0,
        };
    }
}