class SectionReferenceHelpers {
    static invalidFormulaTooltip = "Invalid Formula";
    static pathEncoding = {
        "\\": "back",
        "/": "for",
        "&": "and",
        "*": "mul",
    }

    static parseFormula(formula, variables, specialLetters = null, specialLetterRegex = null) {
        specialLetters ??= this.getSpecialLetters(variables);
        specialLetterRegex ??= this.getSpecialLetterRegex(specialLetters);
        if (specialLetterRegex) formula = this.replaceSpecialLettersInFormula(formula, specialLetters, specialLetterRegex);

        let settings = CustomMath.getDefaultSettings();
        for (let [key, value] of variables.entries()) {
            settings.variables[key] = value;
        }

        let result = CustomMath.parse(formula, settings);
        return result;
    }

    static addTooltips(element, variables = null) {
        if (!element) return;

        this.addIncreaseDecreaseTooltips(element);
        this.addSectionReferenceTooltip(element);
        if (variables && variables.size != 0) {
            this.addSpecialWithinVariableTooltips(element, variables);
            this.addVariableTooltips(element, variables);
        }
        this.addSnippets(element);
    }

    static updateVariableTooltips(element, variables) {
        if (!element) return;

        element.querySelectorAll(".section-increaseDecrease").forEach(e => e.outerHTML = e.innerHTML);
        element.querySelectorAll(".section-specialVariable").forEach(e => e.outerHTML = e.innerHTML);
        element.querySelectorAll(".section-formula").forEach(e => e.outerHTML = escapeHTML(e.getAttribute('tooltip')));

        this.addIncreaseDecreaseTooltips(element);
        this.addSpecialWithinVariableTooltips(element, variables);
        this.addVariableTooltips(element, variables);

        HtmlHelpers.getClosestProperty(element, "_masonry")?.resize();
    }

    static addTooltipsToStructuredSection(structuredSection) {
        if (structuredSection.settings.noTooltips) return;
        SectionReferenceHelpers.addTooltips(structuredSection.attributesElement, structuredSection.settings.variables);
        SectionReferenceHelpers.addTooltips(structuredSection.contentElement, structuredSection.settings.variables);
        SectionReferenceHelpers.addTooltips(structuredSection.tableElement, structuredSection.settings.variables);
    }

    static updateTooltipsOfStructuredSection(structuredSection) {
        if (structuredSection.settings.noTooltips) return;
        SectionReferenceHelpers.updateVariableTooltips(structuredSection.attributesElement, structuredSection.settings.variables);
        SectionReferenceHelpers.updateVariableTooltips(structuredSection.contentElement, structuredSection.settings.variables);
        SectionReferenceHelpers.updateVariableTooltips(structuredSection.tableElement, structuredSection.settings.variables);
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
            let html = `<span class="section-increaseDecrease" tooltip="${escapeHTML(tooltip)}">${operator}</span>` + value.substring(operator.length);
            replaceTextNodeWithHTML(node, html);
        }
    }

    static addSpecialWithinVariableTooltips(element, variables) {
        let textNodes = getTextNodes(element);
        let special = {};
        if (variables.has('Range')) special['within range'] = 'Range';
        if (variables.has('Reach')) special['within reach'] = 'Reach';
        if (Object.keys(special).length == 0) return;

        const regex = new RegExp("\\b(" + Object.keys(special).map(k => escapeRegex(k)).join("|") + ")\\b", "gi");
        for (let node of textNodes) {
            let value = node.nodeValue;
            let html = value.replace(regex, (matched, group1) => {
                return `<span class="section-specialVariable" tooltip="within ${escapeHTML(variables.get(special[group1.toLowerCase()]))} meters">${matched}</span>`;
            });
            replaceTextNodeWithHTML(node, html);
        }
    }

    static getSpecialLetters(variables) {
        let specialLetters = {};
        if (variables.has('Level')) specialLetters['L'] = 'Level';
        if (variables.has('Rank')) specialLetters['R'] = 'Rank';
        if (variables.has('Tier')) specialLetters['T'] = 'Tier';
        if (variables.has('Importance')) specialLetters['M'] = 'Importance';
        if (variables.has('Severity')) specialLetters['S'] = 'Severity';
        return specialLetters;
    }

    static allSpecialLetters = ['L', 'R', 'T', 'M', 'S'];
    static getSpecialLetterRegex(specialLetters) {
        if (!specialLetters || Object.keys(specialLetters).length == 0) return null;
        return new RegExp("\\b([" + this.allSpecialLetters.map(k => escapeRegex(k)).join("") + "]+)(\\d+)", "g"); // Boundary doesn't appear in matched
    }

    static replaceSpecialLettersWithFormulas(html, variables, specialLetters, specialLetterRegex) {
        if (Object.keys(specialLetters).length == 0) return html;
        html = html.replace(specialLetterRegex, (formula, fullLetters, number) => {
            const validLetters = Array.from(fullLetters).filter(letter => specialLetters.hasOwnProperty(letter)).join('');
            const invalidLetters = Array.from(fullLetters).filter(letter => !specialLetters.hasOwnProperty(letter)).join('');

            if (validLetters.length != 0) {
                const parsedFormula = `${validLetters}${number}`;
                const result = this.parseFormula(parsedFormula, variables, specialLetters, specialLetterRegex);
                if (result != null) {
                    return `${invalidLetters}<span class="section-formula" tooltip="[${escapeHTML(formula)}]">${escapeHTML(result)}</span>`;
                }
            }

            return formula;
        });
        return html;
    }

    static replaceSpecialLettersInFormula(formula, specialLetters, specialLetterRegex) {
        if (Object.keys(specialLetters).length == 0) return html;
        formula = formula.replace(specialLetterRegex, (matched, fullLetters, number) => {
            // Separate valid letters (part of specialLetters) from invalid ones
            const validLetters = Array.from(fullLetters).filter(letter => specialLetters.hasOwnProperty(letter));
            const invalidLetters = Array.from(fullLetters).filter(letter => !specialLetters.hasOwnProperty(letter));

            if (invalidLetters.length == 0 && validLetters.length != 0) {
                const parsedFormula = `(${validLetters.map(letter => specialLetters[letter]).join(' * ')} * ${number})`;
                return parsedFormula;
            }

            return matched;
        });
        return formula;
    }

    static getFormulaTooltip(formula, variables, specialLetters, specialLetterRegex) {
        let html;
        const result = this.parseFormula(formula, variables, specialLetters, specialLetterRegex);
        if (result != null) html = `<span class="section-formula" tooltip="[${escapeHTML(formula)}]">${escapeHTML(result)}</span>`;
        else html = `[${this.replaceSpecialLettersWithFormulas(escapeHTML(formula), variables, specialLetters, specialLetterRegex) }]`;
        return html;
    }

    static addVariableTooltips(element, variables) {
        const specialLetters = this.getSpecialLetters(variables);
        const specialLetterRegex = this.getSpecialLetterRegex(specialLetters);

        let textNodes = getTextNodes(element);
        for (let node of textNodes) {
            let value = node.nodeValue;
            let html = "";
            let start = -1, end = -1;

            for (let i = 0; i < value.length; i++) {
                if (value[i] === '[') {
                    if (i > start + 1) {
                        html += this.replaceSpecialLettersWithFormulas(escapeHTML(value.substring(end + 1, i)), variables, specialLetters, specialLetterRegex);
                    }
                    start = i;
                } else if (value[i] === ']') {
                    end = i;
                    const formula = value.substring(start + 1, end);
                    html += this.getFormulaTooltip(formula, variables, specialLetters, specialLetterRegex);
                }
            }
            if (end < value.length - 1) {
                html += this.replaceSpecialLettersWithFormulas(escapeHTML(value.substring(end + 1)), variables, specialLetters, specialLetterRegex);
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
            let parentSectionElement = HtmlHelpers.getClosestWithProperty(node, "_section");
            let parentSection = parentSectionElement._section;
            let isHeadValue = HtmlHelpers.getClosestWithProperty(node, "_headValue");

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
                    if (start == -1) continue;
                    end = i;
                    let parsed = this.parseReference(value.substring(start + 1, end));
                    reference = parsed.reference;
                    name = parsed.name;
                    mutation = parsed.mutation;
                    reference = parsed.reference;
                    let display = parsed.display;

                    isLine = start == 0 && end == value.length - 1;
                    path = isLine ? 'techniques/' + reference : this.findPathFromReference(parentSection, reference);
                    html += `<span tooltip-path="${escapeHTML(path)}" section-formula>${escapeHTML(isLine && !isHeadValue ? "<" + display + ">" : display)}</span>`;
                }
            }

            if (isLine && !isHeadValue) {
                let section = SectionHelpers.resolveSectionExpression(path);
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

    static parseReference(text) {
        let mutation = null;
        let name = null;
        const parts = text.trim().replace(/^</, "").replace(/>$/, "").split('|');
        let reference = parts.shift();
        for (let part of parts) {
            if (!mutation && part.endsWith('Mutation')) mutation = part;
            else name = part;
        }
        if (mutation) reference += `*mutation=${mutation}`;
        if (name) reference += `*name=${name}`;
        let display = name ?? reference;
        return { reference, name, mutation, display };
    }

    static findPathFromReference(section, reference) {
        section = section.parent;
        let anchor = 'techniques';
        while (section) {
            if (section.anchor) {
                anchor = section.anchor;
                break;
            }
            section = section.parent;
        }
        return anchor + '/' + reference;
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
                    let targetPath = pathsByTarget[matchedTarget.toLowerCase()];
                    let section = HtmlHelpers.getClosestProperty(node, '_section');
                    let sectionPath = section.getPath();
                    if (sectionPath.split('*')[0] == SectionReferenceHelpers.pathEncoder.encode(targetPath.split('*')[0])) return matched;
                    return `<span class="snippetTarget" tooltip-path="${escapeHTML(targetPath)}">${matchedTarget + maybeS}</span>`;
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