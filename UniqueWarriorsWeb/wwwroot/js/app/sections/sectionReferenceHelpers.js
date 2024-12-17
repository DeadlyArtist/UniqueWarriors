class SectionReferenceHelpers {
    static invalidFormulaTooltip = "Invalid Formula";
    static pathEncoding = {
        "\\": "back",
        "/": "for",
        "!": "invert",
        "?": "exact",
        "@": "at",
        "\$": "dollar",
        "|": "or",
        ",": "comma",
        " ": "space",
        "#": "hash",
        ">": "right",
        "<": "left",
        "^": "top",
        "-": "minus",
        "\'": "quote",
        "~": "rough",
        "+": "plus",
        ":": "semi",
        "%": "cent",
        "*": "mul",
    }

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
        this.addSnippets(element);
    }

    static addIncreaseDecreaseTooltips(element) {
        let textNodes = getTextNodes(element);
        for (let node of textNodes) {
            let value = node.nodeValue;
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

            value = value.replace(/([+-] ?)(\dd)( )/, `$1<span tooltip-path="rules/Mutations/Die Size">$2</span>$3`);
            let html = `<span tooltip="${escapeHTML(tooltip)}">${operator}</span>` + value.substring(operator.length);
            replaceTextNodeWithHTML(node, html);
        }
    }

    static addSpecialVariableTooltips(element, variables) {
        let textNodes = getTextNodes(element);
        let special = {};
        if (variables.has('Range')) special['within range'] = 'Range';
        if (variables.has('Reach')) special['within reach'] = 'Reach';
        if (Object.keys(special).length == 0) return;

        const regex = new RegExp("\\b(" + Object.keys(special).map(k => escapeRegex(k)).join("|") + ")\\b", "gi");
        for (let node of textNodes) {
            let value = node.nodeValue;
            let html = value.replace(regex, (matched, group1) => {
                return `<span tooltip="within ${escapeHTML(variables.get(special[group1.toLowerCase()]))} meters">${matched}</span>`;
            });
            replaceTextNodeWithHTML(node, html);
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
            if (node.parentElement.classList.contains('section-headValue-value')) {
                let headValue = HtmlHelpers.getClosestProperty(node, "_headValue");
                if (headValue.name == "Connections") {
                    value = headValue.value.replace(/\.$/, '').split(", ").map(v => v == "Category" ? v : `<${v}>`).join(', ') + ".";
                }
            }

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
                if (section && value[0] == '<' && value[value.length - 1] == '>') {
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

    static updateSnippets(element = document.documentElement) {
        const snippetElements = [...element.querySelectorAll(Snippets.snippetQuery)];
        if (element.matches(Snippets.snippetQuery)) snippetElements.push(element);
        if (snippetElements.length == 0) return;

        for (let snippetElement of snippetElements) {
            let existingTargets = [...snippetElement.querySelectorAll('.snippetTarget')];
            for (let target of existingTargets) {
                target.outerHTML = escapeHTML(target.textContent);
            }
        }

        SectionReferenceHelpers.addSnippets(element, snippetElements);
    }

    static addSnippets(element = document.documentElement, snippetElements = null) {
        if (snippetElements == null) {
            snippetElements = [...element.querySelectorAll(Snippets.snippetQuery)];
            if (element.matches(Snippets.snippetQuery)) snippetElements.push(element);
        }
        if (snippetElements.length == 0) return;
        // Group snippets by whitelist and blacklist to optimize performance
        const snippets = Registries.snippets.getAll().sort((a, b) => b.target.length - a.target.length);
        const groupedSnippets = new Map();

        // Group snippets by JSON.stringify of their whitelist/blacklist combination
        for (const snippet of snippets) {
            const key = JSON.stringify({
                whitelist: snippet.whitelist,
                blacklist: snippet.blacklist,
            });
            if (!groupedSnippets.has(key)) {
                groupedSnippets.set(key, {
                    snippets: [],
                    whitelist: snippet.whitelist,
                    blacklist: snippet.blacklist,
                });
            }
            groupedSnippets.get(key).snippets.push(snippet);
        }

        // Add the `snippetTarget` class to the blacklist to avoid re-snippeting
        for (const group of groupedSnippets.values()) {
            if (group.blacklist) group.blacklist = group.blacklist + ', .snippetTarget';
        }

        let groups = [...groupedSnippets.values()].sort((a, b) => ((b.whitelist ?? '').length + (b.blacklist ?? '').length) - ((a.whitelist ?? '').length + (a.blacklist ?? '').length));
        // Escape snippets and process matching text nodes
        for (const group of groups) {
            const { snippets, whitelist, blacklist } = group;
            const pathsByTarget = {};
            for (const snippet of snippets) pathsByTarget[escapeHTML(snippet.target).toLowerCase()] = snippet.path;

            // Generate regex for this group of snippets
            const regex = new RegExp("\\b(" + snippets.map(k => escapeRegex(escapeHTML(k.target))).join("|") + ")(s?)\\b", "gi");

            // Get text nodes within the whitelist/blacklist scope
            const nodes = getTextNodesFromArray(snippetElements, {
                excludeQuery: blacklist,
                includeQuery: whitelist,
            });

            // Replace text content with highlighted snippet targets
            for (let node of nodes) {
                const oldHtml = escapeHTML(node.textContent);
                const newHtml = oldHtml.replace(regex, function (matched, matchedTarget, maybeS) {
                    return `<span class="snippetTarget" tooltip-path="${escapeHTML(pathsByTarget[matchedTarget.toLowerCase()])}">${matchedTarget + maybeS}</span>`;
                });

                if (oldHtml !== newHtml) {
                    replaceTextNodeWithHTML(node, newHtml);
                }
            }
        }
    }
}

SectionReferenceHelpers.pathEncoder = new Encoder(SectionReferenceHelpers.pathEncoding);
SectionReferenceHelpers.debouncedUpdateSnippets = debounce(SectionReferenceHelpers.updateSnippets);