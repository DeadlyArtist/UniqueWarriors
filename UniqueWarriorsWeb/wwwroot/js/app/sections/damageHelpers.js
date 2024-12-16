class DamageHelpers {
    // Utility: Parse dice damage and types
    static parseAttribute(attributeValue) {
        if (!attributeValue) return null;

        // Regex to match the dice and modifiers
        const diceRegex = /^([+-]{2})?\s*T?(\d+)d(\d*)/; // Handles both formats with modifiers before or after
        const typesRegex = /\((.*?)\)/; // Example: (slashing, sonic)

        const diceMatch = attributeValue.match(diceRegex);
        const typesMatch = attributeValue.match(typesRegex);

        let isMutation = false;
        if (diceMatch && !diceMatch[3]) {
            isMutation = true;
            diceMatch[3] = diceMatch[2];
            diceMatch[2] = "";
        }
        const modifier = diceMatch ? diceMatch[1] || "" : "";
        let size = diceMatch ? parseInt(diceMatch[3]) : 0;
        if (isMutation) size *= 2;
        return {
            dice: diceMatch
                ? {
                    modifier,
                    count: parseInt(diceMatch[2]),
                    size: modifier.startsWith('-') ? -size : size,
                }
                : null,
            types: typesMatch ? typesMatch[1].split(",").map(t => t.trim()) : [],
        };
    }
    // Utility: Update dice damage
    static updateDiceDamage(originalDice, mutationDice) {
        if (!originalDice && !mutationDice) return null;

        const result = { count: 0, size: 0 };
        if (originalDice) {
            result.count += originalDice.count;
            result.size = originalDice.size;
        }

        if (mutationDice) {
            result.size += mutationDice.size;
        }

        // Handle dice size overflow rules
        if (result.size > 12) {
            result.size = 6;
            result.count *= 2;
        } else if (result.size < 4) {
            result.size = 3;
        }

        return result;
    }

    // Utility: Merge types
    static mergeTypes(originalTypes, mutationTypes) {
        const typeSet = new Set([...(originalTypes || []), ...(mutationTypes || [])]);
        return Array.from(typeSet);
    }

    // Utility: Format dice damage as a string
    static formatDiceDamage(dice, types) {
        if (!dice) return "";
        const damageStr = `T${dice.count}d${dice.size}`;
        const typesStr = types.length > 0 ? `(${types.join(", ")})` : "";
        return `${damageStr} ${typesStr}`.trim();
    }

    // Utility: Format modifier values (++/--)
    static formatModifierValue(value) {
        if (value === 0) return "0";
        return (value > 0 ? "++" : "--") + Math.abs(value);
    }
}