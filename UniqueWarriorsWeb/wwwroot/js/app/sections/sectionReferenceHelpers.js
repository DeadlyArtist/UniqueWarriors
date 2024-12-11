class SectionReferenceHelpers {
    static invalidFormulaTooltip = "Invalid Formula";

    static parseFormula(formula, variables) {
        var settings = CustomMath.getDefaultSettings();
        for (let variable in variables) {
            settings.variables[variable.key] = variable.value;
        }
        return CustomMath.parse(formula, settings);
    }

    static getFormulaTooltip(formula, variables) {
        return this.parseFormula(formula, variables) ?? this.invalidFormulaTooltip;
    }

    static addTooltips(element, variables = null) {
        this.addIncreaseDecreaseTooltips(element);
        if (variables) {
            this.addSpecialVariableTooltips(element, variables);
            this.addVariableTooltips(element, variables);
        }
    }

    static addIncreaseDecreaseTooltips(element) {
        let textNodes = getTextNodes(element);
        for (let node of textNodes) {
            const value = node.nodeValue;
            let name = HtmlHelpers.getClosestProperty(node.parentElement, "_headValue")?.name;
            let tooltip = null;
            let operator = null;
            if (value.startsWith(operator = "++")) {
                tooltip = name ? "is increased by" : "is added";
            } else if (value.startsWith(operator = "--")) {
                tooltip = name ? "is decreased by" : "is removed";
            } else if (value.startsWith(operator = "+//")) {
                tooltip = name ? "is divided (and rounded up) by" : null;
            } else if (value.startsWith(operator = "-//")) {
                tooltip = name ? "is divided (and rounded down) by" : null;
            }
            if (!tooltip) continue;

            let html = `<span tooltip="${escapeHTML(tooltip)}">${operator}</span>` + value.substring(operator.length);
            replaceTextNodeWithHTML(node, html);
        }
    }

    static addSpecialVariableTooltips(element, variables) {
        let textNodes = getTextNodes(element);
        for (let node of textNodes) {
            let value = node.nodeValue;
            let special = {};
            if (variables.has('Range')) special['within range'] = 'Range';
            if (variables.has('Reach')) special['within reach'] = 'Reach';
            if (Object.keys(special).length > 0) {
                const regex = new RegExp("\\b(" + Object.keys(special).map(k => escapeRegex(k)).join("|") + ")\\b", "gi");
                let html = value.replace(regex, (matched, group1) => {
                    return `<span tooltip="within ${escapeHTML(variables.get(special[group1.toLowerCase()]))} meters">${matched}</span>`;
                });
                replaceTextNodeWithHTML(node, html);
            }
        }
    }

    static addVariableTooltips(element, variables) {
        let textNodes = getTextNodes(element);
        for (let node of textNodes) {
            let value = node.nodeValue;
            let html = "";
            let start = -1, end = -1;

            for (let i = 0; i < value.length; i++) {
                if (value[i] === '[') {
                    if (i > start + 1) {
                        html += escapeHTML(value.substring(end + 1, i));
                    }
                    start = i;
                } else if (value[i] === ']') {
                    end = i;
                    const formula = value.substring(start, end + 1);
                    const tooltip = this.getFormulaTooltip(formula, variables);
                    html += `<span tooltip="${escapeHTML(tooltip)}" section-formula>${escapeHTML(formula)}</span>`;
                }
            }
            if (end < value.length - 1) {
                html += escapeHTML(value.substring(end + 1));
            }

            if (html !== value) replaceTextNodeWithHTML(node, html);
        }
    }

    static updateSnippets() {

    }
}