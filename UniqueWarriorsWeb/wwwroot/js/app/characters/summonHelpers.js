class SummonHelpers {

    static isSummon(section) {
        return section.headValues.has('Summon');
    }

    static getBoons(section) {
        let result = new Map();
        let boons = section.getHeadValueParts("Boons");
        let banes = section.getHeadValueParts("Banes");
        for (let boon of boons) {
            let amount = 1;
            boon = boon.replace(/^(\d*)x\s+/, (matched, group1) => {
                if (group1) amount = parseInt(group1);
                return "";
            });
            result.set(boon, (result.get(boon) ?? 0) + amount);
        }
        for (let bane of banes) {
            let amount = 1;
            bane = bane.replace(/^(\d*)x\s+/, (matched, group1) => {
                if (group1) amount = parseInt(group1);
                return "";
            });
            result.set(bane, (result.get(bane) ?? 0) - amount);
        }
        return result;
    }
}