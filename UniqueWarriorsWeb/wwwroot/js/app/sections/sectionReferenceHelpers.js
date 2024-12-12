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
        if (!element) return;
        this.addIncreaseDecreaseTooltips(element);
        this.addSectionReferenceTooltip(element);
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

    static addSectionReferenceTooltip(element) {
        let textNodes = getTextNodes(element);
        for (let node of textNodes.reverse()) {
            let value = node.nodeValue;
            let html = "";
            let start = -1, end = -1;

            let reference = null;
            let path = null;
            let mutation = null;
            let name = null;
            let isLine = false;
            for (let i = 0; i < value.length; i++) {
                if (value[i] === '<') {
                    if (i > start + 1) {
                        html += escapeHTML(value.substring(end + 1, i));
                    }
                    start = i;
                } else if (value[i] === '>') {
                    end = i;
                    const parts = value.substring(start + 1, end).split('|');
                    reference = parts.shift();
                    for (let part of parts) {
                        if (!mutation && part.endsWith('Mutation')) mutation = part;
                        else name = part;
                    }
                    if (mutation) reference += `*mutation=${mutation}`;
                    if (name) reference += `*name=${name}`;
                    path = this.findPathFromReference(reference);
                    isLine = start == 0 && end == value.length - 1;
                    let display = name ?? reference;
                    html += `<span tooltip-path="${escapeHTML(path)}" section-formula>${escapeHTML(isLine ? "<" + display + ">" : display)}</span>`;
                }
            }
            if (isLine) {
                let section = SectionHelpers.resolveSectionExpression(path);
                let parentSectionElement = HtmlHelpers.getClosestWithProperty(node, "_section");
                let parentSection = parentSectionElement._section;
                if (section) {
                    let height = 1;
                    if (parentSection) height = parentSection.height + 1;
                    section = SectionHelpers.modify(section, { height })[0];
                    node.remove();
                    parentSectionElement._structuredSection.addSubSection(section, {insertBefore: 0});
                    continue;
                }
            }

            if (end < value.length - 1) {
                html += escapeHTML(value.substring(end + 1));
            }

            if (html !== value) replaceTextNodeWithHTML(node, html);
        }
    }

    static findPathFromReference(reference) {
        return 'techniques/' + reference;
    }
}