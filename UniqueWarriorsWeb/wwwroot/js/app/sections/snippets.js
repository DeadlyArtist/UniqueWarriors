class Snippets {
    static snippetQuery = ".applySnippets";

    static defaultSnippets = [
        new Snippet("Action", "rules/Actions/Action*parent"),
        new Snippet("Move Action", "rules/Actions/Move Action*parent"),
        new Snippet("Quick Action", "rules/Actions/Quick Action*parent"),
        new Snippet("Free Action", "rules/Actions/Free Action*parent"),
        new Snippet("Difficult Terrain", "rules/Keywords/Difficult Terrain"),
        new Snippet("close to", "rules/Keywords/Close To"),
        new Snippet("reserve", "rules/Keywords/Reserve Health"),
        new Snippet("Inverse", "rules/Conditions/Inverse"),
        new Snippet("Severity", "rules/Conditions/Severity"),
        new Snippet("Stackable", "rules/Conditions/Stackable"),
        new Snippet("Unstackable", "rules/Conditions/Unstackable"),
        new Snippet("Summon", "rules/Restriction Modifiers/Summons And Terrain (Upkeep)"),
        new Snippet("Terrain", "rules/Restriction Modifiers/Summons And Terrain (Upkeep)*noChildren"),
        new Snippet("Healthy", "rules/States Of Health/Healthy"),
        new Snippet("Bruised", "rules/States Of Health/Bruised"),
        new Snippet("Injured", "rules/States Of Health/Injured"),
        new Snippet("Dying", "rules/States Of Health/Dying"),
        new Snippet("Weapon", "rules/Weapons"),
        new Snippet("Weapon Core", "rules/Weapons"),
        new Snippet("Technique", "rules/Techniques*noChildren"),
        new Snippet("Path", "rules/Paths"),
        new Snippet("Path Core", "rules/Path/Path Core"),
        new Snippet("Mastery", "rules/Masteries"),
        new Snippet("Masteries", "rules/Masteries"),
        new Snippet("Mutation", "rules/Techniques/Mutations"),
        new Snippet("learn summon", "rules/Techniques/Summons"),
        new Snippet("attribute increase", "rules/Attributes"),

        // Tag only
        new Snippet("Connections", "rules/Connections", { whitelist: "tags" }),
        new Snippet("Trigger", "rules/Restriction Modifiers/Trigger", { whitelist: "tags" }),
        new Snippet("Limit", "rules/Restriction Modifiers/Limit", { whitelist: "tags" }),
        new Snippet("Cooldown", "rules/Restriction Modifiers/Cooldown", { whitelist: "tags" }),
        new Snippet("Max", "rules/Restriction Modifiers/Max", { whitelist: "tags" }),
        new Snippet("Initial Lock", "rules/Restriction Modifiers/Initial Lock", { whitelist: "tags" }),
        new Snippet("Channel", "rules/Restriction Modifiers/Channel", { whitelist: "tags" }),
        new Snippet("Multitrigger", "rules/Restriction Modifiers/Multitrigger", { whitelist: "tags" }),
        new Snippet("Immobile", "rules/Restriction Modifiers/Immobile", { whitelist: "tags" }),
        new Snippet("Object", "rules/Restriction Modifiers/Object", { whitelist: "tags" }),
        new Snippet("Mobile", "rules/Restriction Modifiers/Mobile", { whitelist: "tags" }),
        new Snippet("Importance", "rules/Restriction Modifiers/Importance", { whitelist: "tags" }),
        new Snippet("Attack", "rules/Descriptive Tags/Attack", { whitelist: "tags" }),
        new Snippet("Basic", "rules/Descriptive Tags/Basic", { whitelist: "tags" }),
        new Snippet("Simple", "rules/Descriptive Tags/Simple", { whitelist: "tags" }),
        new Snippet("Melee", "rules/Descriptive Tags/Melee", { whitelist: "tags" }),
        new Snippet("Ranged", "rules/Descriptive Tags/Ranged", { whitelist: "tags" }),
        new Snippet("Area", "rules/Descriptive Tags/Area", { whitelist: "tags" }),
        new Snippet("Multitarget", "rules/Descriptive Tags/Multitarget", { whitelist: "tags" }),
        new Snippet("Movement", "rules/Descriptive Tags/Movement", { whitelist: "tags" }),
        new Snippet("Teleportation", "rules/Descriptive Tags/Teleportation", { whitelist: "tags" }),
    ];

    static onAppLoadedSetup() {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.updateSnippets(node);
                        }
                    });
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        this.registerAllSnippets();
    }

    static registerSnippet(snippet) {
        Registries.snippets.register(snippet);
    }

    static unregisterSnippet(snippet) {
        Registries.snippets.unregister(snippet);
    }

    static registerAllSnippets() {
        for (let snippet of this.defaultSnippets) {
            Registries.snippets.register(snippet);
        }

        Registries.conditions.stream(event => {
            let condition = event.obj;
            if (event.registered) Snippets.registerSnippet(new Snippet(condition.title, `conditions/${condition.title}`));
            else Snippets.unregisterSnippet(condition.title);
        });

        Registries.snippets.streamBatch(event => {
            Snippets.updateSnippets();
        });
    }

    static updateSnippets(element = document.documentElement) {
        const snippetElements = [...element.querySelectorAll(Snippets.snippetQuery)];
        if (element.matches(Snippets.snippetQuery)) snippetElements.push(element);

        for (let snippetElement of snippetElements) {
            let existingTargets = [...snippetElement.querySelectorAll('.snippetTarget')];
            for (let target of existingTargets) {
                target.outerHTML = escapeHTML(target.textContent);
            }
        }

        let snippets = Registries.snippets.getAll().sort((a, b) => b.target.length - a.target.length);
        for (let snippet of snippets) {
            let blacklist = snippet.blacklist ? snippet.blacklist + ', ' : '';
            blacklist += '.snippetTarget';
            let nodes = getTextNodesFromArray(snippetElements, { includeQuery: snippet.whitelist, excludeQuery: blacklist });
            let target = escapeRegex(escapeHTML(snippet.target));
            const regex = new RegExp("\\b(" + target + "s?)\\b", "gi");
            for (let node of nodes) {
                const oldHtml = escapeHTML(node.textContent);
                const newHtml = oldHtml.replace(regex, function (matched, matchedTarget) {
                    return `<span class="snippetTarget" tooltip-path="${escapeHTML(snippet.path)}">${matchedTarget}</span>`;
                });
                if (oldHtml != newHtml) replaceTextNodeWithHTML(node, newHtml);
            }
        }
    }
}

App.onAppLoaded(() => Snippets.onAppLoadedSetup());