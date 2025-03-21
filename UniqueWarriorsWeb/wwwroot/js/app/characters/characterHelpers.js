class CharacterHelpers {
    static defaultName = "New Character";
    static scalingStatNames = new Set(["Level", "Rank", "Tier", "Attribute Increases", "Attribute Maximum", "Attribute Boosts", "Skill Increases", "Skill Maximum", "Max Energy"]);
    static attributeStatNames = new Set(["Max Health", "Base Shield", "Regeneration", "Speed", "Power", "Evasion", "Accuracy", "Consistency", "Agility", "Potential", "Luck", "Reflex", "Initiative", "Genius", "Multitasking", "Range"]);
    static staticStatNames = new Set(["Graze Range", "Crit Range", "Reach", "Size", "Actions", "Move Actions", "Quick Actions", "Max Attunements"]);
    static allStatNames = new Set();

    static setup() {
        this.allStatNames = new Set([...this.scalingStatNames, ...this.attributeStatNames, ...this.staticStatNames]);
    }

    static getDefaultStats() {
        return {
            level: 1,
        };
    }

    static getBaseStats() {
        return {
            maxHealth: 20,
            baseShield: 16,
            regeneration: 0,
            power: 1,
            speed: 8,
            evasion: 12,
            accuracy: 2,
            consistency: 0,
            agility: 0,
            potential: 0,
            luck: 1,
            reflex: 0,
            initiative: 2,
            genius: 0,
            multitasking: 2,
            range: 24,
            grazeRange: 5,
            critRange: 1,
            reach: 2,
            size: 2,
            actions: 2,
            moveActions: 1,
            quickActions: 1,
            maxAttunements: 3,
        };
    }

    static getEmptyAttributes() {
        return {
            maxHealth: 0,
            baseShield: 0,
            regeneration: 0,
            power: 0,
            speed: 0,
            evasion: 0,
            accuracy: 0,
            consistency: 0,
            agility: 0,
            potential: 0,
            luck: 0,
            reflex: 0,
            genius: 0,
            multitasking: 0,
            range: 0,
        };
    }

    static getStatName(stat) {
        return toTextCase(stat);
    }

    static getSkillsByBranch(branch) {
        return Registries.skills.getAllByTag(branch);
    }

    static getSkillNamesByBranch(branch) {
        return this.getSkillsByBranch(branch).map(s => s.title);
    }

    static getSkillsByField(field) {
        return Registries.skills.getAllByTag(field);
    }

    static getSkillNamesByField(field) {
        return this.getSkillsByField(field).map(s => s.title);
    }

    static getSkillBranchesByField(field) {
        return Registries.skillBranches.getAllByTag(field);
    }

    static getSkillBranchNamesByField(field) {
        return this.getSkillBranchesByField(field).map(s => s.title);
    }

    static getSkillFields() {
        return Registries.skillFields.getAll();
    }

    static getSkillFieldNames() {
        return this.getSkillFields().map(s => s.title);
    }

    static loadCharacters() {
        let characters = [];
        try {
            let charactersJson = JSON.parse(localStorage.getItem("Characters"));
            if (!charactersJson) return;
            for (let [id, character] of Object.entries(charactersJson)) {
                characters.push(Character.fromJSON(character));
            }
        } catch (e) {
            console.log(`Failed to load characters:\n`, e);
            return;
        }

        Registries.characters.clear();
        for (let character of characters) {
            Registries.characters.register(character);
        }
    }

    static storeCharacters() {
        try {
            let charactersArray = Registries.characters.getAll();
            let charactersJson = {};
            for (let character of charactersArray) {
                charactersJson[character.id] = character;
            }
            localStorage.setItem("Characters", JSON.stringify(charactersJson));
        } catch (e) {
            console.error("Failed to store all characters:", e);
        }
    }

    static createCharacter(openInPage = true) {
        let character = new Character();
        Registries.characters.register(character);
        this.saveCharacter(character);
        if (openInPage) CharacterHelpers.openCharacterCreator(character);
        return character;
    }

    static openCharacter(character) {
        Pages.goToPath(`${Pages.character.link}?id=${encodeURIComponent(character.id)}`);
    }

    static openCharacterCreator(character, tab = null) {
        Pages.goToPath(`${Pages.characterCreator.link}?id=${encodeURIComponent(character.id)}${tab ? `#?tab=${tab}` : ''}`);
    }

    static saveCharacter(character) {
        try {
            let charactersJson = JSON.parse(localStorage.getItem("Characters")) || {};
            charactersJson[character.id] = character;
            localStorage.setItem("Characters", JSON.stringify(charactersJson));
        } catch (e) {
            console.error("Failed to save character:", e);
        }
    }

    static deleteCharacter(character) {
        try {
            let charactersJson = JSON.parse(localStorage.getItem("Characters")) || {};
            delete charactersJson[character.id];
            localStorage.setItem("Characters", JSON.stringify(charactersJson));
        } catch (e) {
            console.error("Failed to delete character:", e);
        }

        Registries.characters.unregister(character);
        SectionSearch.removeFiltersFromLocalStorage(character.id);
    }

    static downloadCharacter(character) {
        this.createCharacterFile(character).download();
    }

    static createCharacterFile(character) {
        let wrapper = App.getJsonPrototype("Character", character);;
        return FakeFile.createJson(character.name, wrapper);
    }

    static downloadAllCharacters() {
        downloadZip("Archived_Characters", Registries.characters.map(c => this.createCharacterFile(c)));
    }

    static async parseCharacterFromFile(file) {
        let character;
        try {
            let json = await App.parseExternalFileContent(file, "Character");
            character = Character.fromJSON(json);
        } catch (e) {
            console.warn("Failed to parse character from file:", file, "With error:", e);
            return;
        }

        return character;
    }

    static importCharacter(character) {
        if (Registries.characters.has(character)) character.id = generateUniqueId();
        Registries.characters.register(character);
        this.saveCharacter(character);
    }

    static getDefaultAbilities() {
        let abilities = Registries.defaultAbilities.getAll();
        return SectionHelpers.modify(abilities, {clone: true, height: 0});
    }

    static generateStructuredHtmlForCharacter(character, settings = null) {
        settings ??= {};
        let element = fromHTML(`<div class="character divList">`);
        let structuredCharacter = new StructuredCharacterHtml(character, element, settings);

        if (!settings.noTitle) {
            let actionBarElement = null;
            if (!settings.embedded) {
                let deleteDialog = DialogHelpers.create(dialog => {
                    let dialogElement = fromHTML(`<div class="divList">`);
                    let dialogTitleElement = fromHTML(`<h1>`);
                    dialogElement.appendChild(dialogTitleElement);
                    dialogTitleElement.textContent = `Confirm Deletion of: ${character.name}`;
                    let dialogContentElement = fromHTML(`<div>Are you sure you want to permanently delete the character?<div class="hb-1"></div><b>Warning:</b> This is an irreversible operation. Please <b>download</b> the character first before deletion.<div class="hb-4"></div><i>To confirm deletion enter "delete" below and press delete.</i>`);
                    dialogElement.appendChild(dialogContentElement);
                    dialogElement.appendChild(hb(2));
                    let dialogConfirmInput = fromHTML(`<input type="text" class="largeElement" placeholder="delete">`);
                    dialogElement.appendChild(dialogConfirmInput);
                    dialogElement.appendChild(hb(2));
                    let dialogButtonList = fromHTML(`<div class="listHorizontal">`);
                    dialogElement.appendChild(dialogButtonList);
                    let dialogCancelButton = fromHTML(`<button class="largeElement bordered hoverable flexFill w-100">Cancel`);
                    dialogButtonList.appendChild(dialogCancelButton);
                    dialog.addCloseButton(dialogCancelButton);
                    let dialogConfirmDeleteButton = fromHTML(`<button class="largeElement bordered hoverable flexFill w-100 danger-text" disabled>Delete`);
                    dialogButtonList.appendChild(dialogConfirmDeleteButton);
                    dialogConfirmInput.addEventListener('input', () => {
                        if (dialogConfirmInput.value == "delete") dialogConfirmDeleteButton.removeAttribute('disabled');
                        else dialogConfirmDeleteButton.setAttribute('disabled', '');
                    });
                    dialogConfirmDeleteButton.addEventListener('click', () => {
                        CharacterHelpers.deleteCharacter(character);
                        dialog.close();
                        Pages.goTo(Pages.characters);
                    });

                    return dialogElement;
                });
                element.addEventListener('removed', () => deleteDialog.container.remove());

                actionBarElement = fromHTML(`<div class="character-actionBar listHorizontal centerContentHorizontally hide">`);
                element.appendChild(actionBarElement);
                let editButton = fromHTML(`<button class="listHorizontal largeElement bordered hoverable gap-1" tooltip="Open in editor"><div>Edit`);
                actionBarElement.appendChild(editButton);
                editButton.addEventListener('click', () => CharacterHelpers.openCharacterCreator(character));
                let editIcon = icons.edit();
                editButton.appendChild(editIcon);
                editIcon.classList.add("minimalIcon");
                let downloadButton = fromHTML(`<button class="listHorizontal largeElement bordered hoverable gap-1" tooltip="Download as json file"><div>Download`);
                actionBarElement.appendChild(downloadButton);
                downloadButton.addEventListener('click', () => CharacterHelpers.downloadCharacter(character));
                let downloadIcon = icons.download();
                downloadButton.appendChild(downloadIcon);
                downloadIcon.classList.add("minimalIcon");
                let deleteButton = fromHTML(`<button class="listHorizontal largeElement bordered hoverable gap-1" tooltip="Open delete character dialog"><div>Delete`);
                actionBarElement.appendChild(deleteButton);
                deleteButton.addEventListener('click', () => deleteDialog.open());
                let deleteIcon = icons.delete();
                deleteButton.appendChild(deleteIcon);
                deleteIcon.classList.add("minimalIcon");
            }

            const titleBarElement = fromHTML(`<div class="character-titleBar listContainerHorizontal nowrap">`);
            element.appendChild(titleBarElement);
            let titleElement = fromHTML(`<h1 class="character-title">`);
            titleBarElement.appendChild(titleElement);
            titleElement.textContent = character.name;
            if (!settings.embedded) {
                let openMenuElement = fromHTML(`<div class="character-menu listHorizontal">`);
                titleBarElement.appendChild(openMenuElement);
                let openMenuButton = fromHTML(`<button class="listHorizontal gap-1 element hoverable" tooltip="Open menu">`);
                openMenuElement.appendChild(openMenuButton);
                let closeMenuButton = fromHTML(`<button class="listHorizontal gap-1 element hoverable hide" tooltip="Close menu">`);
                openMenuElement.appendChild(closeMenuButton);
                openMenuButton.addEventListener('click', () => {
                    openMenuButton.classList.add('hide');
                    closeMenuButton.classList.remove('hide');
                    actionBarElement.classList.remove('hide');
                });
                closeMenuButton.addEventListener('click', () => {
                    openMenuButton.classList.remove('hide');
                    closeMenuButton.classList.add('hide');
                    actionBarElement.classList.add('hide');
                });
                let menuIcon = icons.menu();
                openMenuButton.appendChild(menuIcon);
                let closeMenuIcon = icons.menuClose();
                closeMenuButton.appendChild(closeMenuIcon);
            }
        }

        if (!settings.embedded || !settings.simple) {
            const section = CharacterHelpers.getCharacterSection(character);
            section.title = null;
            const structuredSection = SectionHelpers.generateStructuredHtmlForSection(section, { ...settings, tooltips: "tagsOnly" });

            element.appendChild(structuredSection.element);
            structuredSection.element.classList.add("character-summary");
            element.appendChild(hb(4));
        } else if (!settings.noTitle) {
            element.appendChild(hb(2));
        }

        let statsContainer = this.generateStatsHtml(character, settings);
        element.appendChild(statsContainer);

        if (character instanceof Character) {
            element.appendChild(hb(1));
            let validationContainer = this.generateValidationHtml(character, settings);
            element.appendChild(validationContainer);
        }

        if (settings.embedded) {
            element.appendChild(hb(1));
            let abilitiesSubPageElement = this.generateAbilitiesSubPageHtml(character, settings);
            element.appendChild(abilitiesSubPageElement);
        } else {
            element.appendChild(hb(4));
            let menuElement = fromHTML(`<div class="character-menu divList">`);
            element.appendChild(menuElement);
            let tabBar = fromHTML(`<div class="character-menu-tabs listHorizontal">`);
            menuElement.appendChild(tabBar);

            let pages = [
                { name: "Abilities", provider: page => this.generateAbilitiesSubPageHtml(character, settings), },
                { name: "Items", provider: page => this.generateItemsSubPageHtml(character, settings), },
                { name: "Skills", provider: page => this.generateSkillsSubPageHtml(character, settings), },
                { name: "Flavor", provider: page => this.generateFlavorSubPageHtml(character, settings), },
                { name: "Misc", provider: page => this.generateMiscSubPageHtml(character, settings), },
            ];
            let currentPage = null;
            function updatePages() {
                for (let page of pages) {
                    if (page == currentPage) {
                        page.tabElement.classList.add('raised');
                        page.tabElement.classList.add('bordered-inset');
                        page.tabElement.classList.remove('hoverable');
                        page.tabElement.setAttribute('disabled', '');
                    } else {
                        page.tabElement.classList.remove('raised');
                        page.tabElement.classList.remove('bordered-inset');
                        page.tabElement.classList.add('hoverable');
                        page.tabElement.removeAttribute('disabled');
                    }
                }
            }
            for (let page of pages) {
                let element = page.tabElement = fromHTML(`<button class="character-tab largeElement raised bordered-inset hoverable hideDisabled">`);
                tabBar.appendChild(element);
                element.textContent = page.name;
                element.addEventListener('click', () => {
                    openPage(page)
                });
            }

            menuElement.appendChild(hb(2));
            let subPageElement = fromHTML(`<div class="character-menu-subPage">`);
            menuElement.appendChild(subPageElement);

            function openPage(page) {
                if (currentPage == page) return;
                currentPage = page;
                updatePages();

                subPageElement.innerHTML = '';
                let element = page.element = page.provider(page);
                subPageElement.appendChild(element);
            }
            openPage(pages[0]);
        }

        return structuredCharacter;
    }

    static generateStatsHtml(character, settings = null) {
        settings ??= {};
        let statsContainer = fromHTML(`<div class="character-stats divList gap-2">`);
        let attributeStatsBar = fromHTML(`<div class="character-attributeStats listHorizontal gap-2">`);
        statsContainer.appendChild(attributeStatsBar);
        let staticStatsBar = fromHTML(`<div class="character-staticStats listHorizontal gap-2 hide">`);
        statsContainer.appendChild(staticStatsBar);
        let scalingStatsBar = fromHTML(`<div class="character-scalingStats listHorizontal gap-2 hide">`);
        statsContainer.appendChild(scalingStatsBar);
        let attributeStats = character.getAttributeStats();
        let staticStats = character.getStaticStats();
        let scalingStats = character.getScalingStats();

        if (!settings.keepEnergy) {
            attributeStats.maxEnergy = scalingStats.maxEnergy;
            delete scalingStats.maxEnergy;
        }

        if (character.isSummon?.()) {
            let badAttributes = new Set(["Regeneration", "Consistency", "Agility", "Potential", "Luck", "Reflex", "Initiative", "Genius", "Multitasking", "Max Energy"]);
            attributeStats = ObjectHelpers.filterProperties(attributeStats, key => !badAttributes.has(toTextCase(key)));
        }
        if (character.isImmobile?.()) {
            let badAttributes = new Set(["Speed", "Move Actions"]);
            attributeStats = ObjectHelpers.filterProperties(attributeStats, key => !badAttributes.has(toTextCase(key)));
            staticStats = ObjectHelpers.filterProperties(staticStats, key => !badAttributes.has(toTextCase(key)));
        }

        function addStats(stats, element) {
            for (let [name, value] of Object.entries(stats)) {
                let displayName = CharacterHelpers.getStatName(name);
                if (settings.variables?.has(displayName)) value = settings.variables.get(displayName);
                let statElement = fromHTML(`<div class="character-stat divList bordered rounded-xl">`);
                element.appendChild(statElement);
                statElement._stat = { name, value };
                let stateNameElement = fromHTML(`<div class="character-stat-name mediumElement applySnippets markTooltips">`);
                statElement.appendChild(stateNameElement);
                stateNameElement.textContent = displayName;
                SectionReferenceHelpers.addSnippets(stateNameElement);
                statElement.appendChild(fromHTML(`<hr class="">`)); // potentially add raised-border
                let stateValueElement = fromHTML(`<div class="character-stat-value mediumElement">`); /*listHorizontal centerContentHorizontally*/
                statElement.appendChild(stateValueElement);
                stateValueElement.textContent = value;
            }
        }
        addStats(attributeStats, attributeStatsBar);
        addStats(staticStats, staticStatsBar);
        addStats(scalingStats, scalingStatsBar);
        let showAllStatsButton = fromHTML(`<button class="divList largeElement hoverable gap-1 s-font">`);
        attributeStatsBar.appendChild(showAllStatsButton);
        showAllStatsButton.appendChild(fromHTML(`<div>Show`));
        showAllStatsButton.appendChild(fromHTML(`<div>All...`));
        let showLessStatsButton = fromHTML(`<button class="divList largeElement hoverable gap-1 s-font hide">`);
        scalingStatsBar.appendChild(showLessStatsButton);
        showLessStatsButton.appendChild(fromHTML(`<div>Show`));
        showLessStatsButton.appendChild(fromHTML(`<div>Less`));

        showAllStatsButton.addEventListener('click', () => {
            showAllStatsButton.classList.add('hide');
            showLessStatsButton.classList.remove('hide');
            staticStatsBar.classList.remove('hide');
            scalingStatsBar.classList.remove('hide');
            HtmlHelpers.getClosestProperty(statsContainer, "_masonry")?.resize();
        });
        showLessStatsButton.addEventListener('click', () => {
            showAllStatsButton.classList.remove('hide');
            showLessStatsButton.classList.add('hide');
            staticStatsBar.classList.add('hide');
            scalingStatsBar.classList.add('hide');
            HtmlHelpers.getClosestProperty(statsContainer, "_masonry")?.resize();
        });
        return statsContainer;
    }

    static getValidationMessages(character) {
        function tryS(list) {
            let length = isNumber(list) ? list : list.length;
            return length == 1 ? "" : "s";
        }
        function tryY(list) {
            let length = isNumber(list) ? list : list.length;
            return length == 1 ? "y" : "ies";
        }
        let validationMessages = [];
        let stats = character.getStats();

        let remainingTechniques = CharacterCreatorHelpers.getRemainingOtherTechniques(character);
        if (remainingTechniques < 0) validationMessages.push(`${-remainingTechniques} too many techniques`);
        let variantWithTooManyTechniques = character.summons.filter(s => AbilitySectionHelpers.isVariant(s) && CharacterCreatorHelpers.getTooManyThingsCountInVariant(character, s) > CharacterCreatorHelpers.getMaxThingsInVariant(character));
        if (variantWithTooManyTechniques.length > 0) validationMessages.push(`${variantWithTooManyTechniques.length} summon variant${tryS(variantWithTooManyTechniques)} with too many techniques (${variantWithTooManyTechniques.map(t => t.title).join(", ")})`);
        if (!character.canHaveFreeMutation()) {
            let count = character.techniques.filter(t => AbilitySectionHelpers.isMutation(t)).length;
            if (count != 0) {
                validationMessages.push(`${count} mutation${tryS(count)} which only become available at level 5`);
            }
            let variantsWithTooMany = character.summons.filter(s => AbilitySectionHelpers.isVariant(s)).filter(s => SummonHelpers.getTechniquesNotInOriginal(character, s).some(t => AbilitySectionHelpers.isMutation(t)));
            if (variantsWithTooMany.length != 0) {
                validationMessages.push(`${variantsWithTooMany.length} summon variant${tryS(variantsWithTooMany)} with original mutations which only become available at level 5 (${variantsWithTooMany.map(t => t.title).join(", ")})`);
            }
        }

        let unconnectedTechniques = character.techniques.filter(t => !CharacterCreatorHelpers.canConnectToAbility(character.techniques, t));
        if (unconnectedTechniques.length != 0) validationMessages.push(`${unconnectedTechniques.length} unconnected technique${tryS(unconnectedTechniques)} (${unconnectedTechniques.map(t => t.title).join(", ")})`);
        let unconnectedSummons = character.summons.filter(t => !CharacterCreatorHelpers.canConnectToAbility(character.summons, t, character.techniques));
        if (unconnectedSummons.length != 0) validationMessages.push(`${unconnectedSummons.length} unconnected summon${tryS(unconnectedSummons)} (${unconnectedSummons.map(t => t.title).join(", ")})`);
        let unconnectedTechniquesInVariants = character.summons.filter(s => AbilitySectionHelpers.isVariant(s)).flatMap(s => SummonHelpers.getTechniquesNotInOriginal(character, s).filter(t => !CharacterCreatorHelpers.canConnectToAbility(s.npc.techniques, t)));
        if (unconnectedTechniquesInVariants.length != 0) validationMessages.push(`${unconnectedTechniquesInVariants.length} unconnected technique${tryS(unconnectedTechniquesInVariants)} in summon variant${tryS(unconnectedTechniquesInVariants)} (${unconnectedTechniquesInVariants.map(t => t.title).join(", ")})`);
        let unconnectedSummonsInVariants = character.summons.filter(s => AbilitySectionHelpers.isVariant(s)).flatMap(s => SummonHelpers.getSummonsNotInOriginal(character, s).filter(t => !CharacterCreatorHelpers.canConnectToAbility(s.npc.summons, t, s.npc.techniques)));
        if (unconnectedSummonsInVariants.length != 0) validationMessages.push(`${unconnectedSummonsInVariants.length} unconnected summon${tryS(unconnectedSummonsInVariants)} in summon variant${tryS(unconnectedSummonsInVariants)} (${unconnectedSummonsInVariants.map(t => t.title).join(", ")})`);

        let remainingMasteries = CharacterCreatorHelpers.getRemainingMasteries(character);
        if (remainingMasteries < 0) validationMessages.push(`${-remainingMasteries} too many masteries`);
        let remainingEvolutions = CharacterCreatorHelpers.getRemainingEvolutions(character);
        if (remainingEvolutions < 0) validationMessages.push(`${-remainingEvolutions} too many evolutions`);
        let remainingAscendancies = CharacterCreatorHelpers.getRemainingAscendancies(character);
        if (remainingAscendancies < 0) validationMessages.push(`${-remainingAscendancies} too many ascendancies`);

        let remainingAttributeIncreases = character.getRemainingAttributeIncreases();
        if (remainingAttributeIncreases < 0) validationMessages.push(`${-remainingAttributeIncreases} too many attribute increases used`);
        let remainingAttributeBoosts = character.getRemainingAttributeBoosts();
        if (remainingAttributeBoosts < 0) validationMessages.push(`${-remainingAttributeBoosts} too many attribute boosts used`);

        //let { attributeMaximum } = character.getScalingStats();
        //for (let [key, value] of Object.entries(character.attributes)) {
        //    if (value > attributeMaximum) validationMessages.push(`Attribute "${toTextCase(key)}" is above the maximum of ${attributeMaximum}`);
        //}

        let remainingSkills = CharacterCreatorHelpers.getRemainingMasteries(character);
        if (remainingSkills < 0) validationMessages.push(`${-remainingSkills} too many skill increases used`);
        let tooHighSkills = Object.entries(character.skills).filter(e => e[1] > stats.skillMaximum).map(e => e[0]);
        if (tooHighSkills.length != 0) validationMessages.push(`${tooHighSkills.length} skills above the maximum (${tooHighSkills.join(", ")})`);

        return validationMessages;
    }

    static generateValidationHtml(character, settings) {
        let validationMessages = this.getValidationMessages(character);
        let needsUpdate = CharacterUpdater.checkForAbilityUpdates(character).needsUpdate;

        let element = fromHTML(`<div class="character-validation-container listContainerHorizontal alignItemsStart gap-2">`);
        if (validationMessages.length == 0 && !needsUpdate) {
            element.classList.add('hide');
            return element;
        }

        let toggleMoreButton = fromHTML(`<button class="element rounded-xl hoverable">`);
        element.appendChild(toggleMoreButton);
        let expandMoreIcon = icons.expandMore();
        toggleMoreButton.appendChild(expandMoreIcon);
        let expandLessIcon = icons.expandLess();
        toggleMoreButton.appendChild(expandLessIcon);
        expandLessIcon.classList.add('hide');

        let contentContainer = fromHTML(`<div class="divList flexFill">`);
        element.appendChild(contentContainer);
        let summaryElement = fromHTML(`<div class="listHorizontal" style="margin-top: 3px;">`);
        contentContainer.appendChild(summaryElement);

        let messageElement = fromHTML(`<i class="danger-text">Warning: Invalid Character`);
        summaryElement.appendChild(messageElement);

        let expandedArea = fromHTML(`<div class="character-validation-messages divList hide">`);
        contentContainer.appendChild(expandedArea);

        if (needsUpdate) {
            let element = fromHTML(`<div class="listHorizontal">`);
            element.appendChild(fromHTML(`<i>Outdated character. Update? (Warning: Some abilities may be deleted or replaced!)`));
            let updateButton = fromHTML(`<button class="listHorizontal largeElement bordered hoverable gap-1">Update`);
            element.appendChild(updateButton);
            updateButton.addEventListener('click', () => {
                CharacterUpdater.update(character);
                Pages.reload();
            });
            expandedArea.appendChild(element);
        }
        for (let message of validationMessages) {
            let element = fromHTML(`<i class="character-validation-message">`);
            expandedArea.appendChild(element);
            element.textContent = message;
        }

        let isExpanded = false;
        toggleMoreButton.addEventListener('click', () => {
            isExpanded = !isExpanded;
            if (isExpanded) {
                expandMoreIcon.classList.add('hide');
                expandLessIcon.classList.remove('hide');
                expandedArea.classList.remove('hide');
            } else {
                expandMoreIcon.classList.remove('hide');
                expandLessIcon.classList.add('hide');
                expandedArea.classList.add('hide');
            }
            HtmlHelpers.getClosestProperty(toggleMoreButton, "_masonry")?.resize();
        });

        return element;
    }

    static generateAbilitiesSubPageHtml(character, settings = null) {
        settings ??= {};

        let element = fromHTML(`<div class="character-subPage-abilities divList">`);
        let searchContainer = fromHTML(`<div class="sticky">`);
        element.appendChild(searchContainer);
        let abilitiesContainer = fromHTML(`<div class="divList gap-2">`);
        element.appendChild(abilitiesContainer);

        let variables = null;
        if (!settings.noVariables) variables = settings.variables ??= character.getVariables();

        let summons = character.summons.getAll();
        if (settings.simple) {
            let abilities = character.techniques.getAll().concat(character.masteries.getAll());
            let combinedAbilityList = this.generateAbilityListHtml(character, [...abilities, ...summons], { ...settings, variables, hideIfEmpty: true, });
            abilitiesContainer.appendChild(combinedAbilityList.container);
        } else {
            let stats = character.getStats();
            let abilities = character.techniques.getAll();
            let defaultAbilities = this.getDefaultAbilities().filter(ability => {
                if (ability.title == "Dodge" && stats.agility <= 0) return false;
                if (ability.title == "Self Correction" && stats.consistency <= 0) return false;
                if (ability.title == "Overexert" && stats.potential <= 0) return false;
                if (ability.title == "Spend Luck" && stats.luck <= 0) return false;
                if (ability.title == "Subconscious Impulse" && stats.reflex <= 0) return false;

                return true;
            });
            let masteries = character.masteries.getAll();
            let attuned = character.attunedItems.getAll();
            let specialTriggeredAbilities = [];
            let triggeredAbilities = [];
            let moveActionAbilities = [];
            let actionAbilities = [];
            let quickActionAbilities = [];
            let otherAbilities = [];
            for (let ability of abilities) {
                let title = ability.title;
                if (AbilitySectionHelpers.isTrigger(ability)) {
                    triggeredAbilities.push(ability);
                    continue;
                }

                let map = AbilitySectionHelpers.getActionCost(ability);
                if (map.has('Move Action')) {
                    moveActionAbilities.push(ability);
                } else if (map.has('Action')) {
                    actionAbilities.push(ability);
                } else if (map.has('Quick Action')) {
                    quickActionAbilities.push(ability);
                } else {
                    otherAbilities.push(ability);
                }
            }
            for (let ability of defaultAbilities) {
                let title = ability.title;
                let isSpecial = false;
                if (AbilitySectionHelpers.isTrigger(ability)) {
                    isSpecial = true;
                    if (title == "Revive") isSpecial = false;
                }

                if (isSpecial) {
                    specialTriggeredAbilities.push(ability);
                } else {
                    let map = AbilitySectionHelpers.getActionCost(ability);
                    if (map.has('Move Action')) {
                        moveActionAbilities.push(ability);
                    } else if (map.has('Action')) {
                        actionAbilities.push(ability);
                    } else if (map.has('Quick Action')) {
                        quickActionAbilities.push(ability);
                    } else {
                        otherAbilities.push(ability);
                    }
                }
            }


            let masteriesList;
            let attunedList;
            let specialTriggeredAbilityList;
            let triggeredAbilityList;
            let moveActionAbilityList;
            let actionAbilityList;
            let quickActionAbilityList;
            let otherAbilityList;
            let summonsList;

            if (settings.masonry) {
                let commonSettings = {
                    variables, hideIfEmpty: true,
                }
                masteriesList = SectionHelpers.generateStructuredHtmlForSectionOverview(masteries, SectionHelpers.MasonryType, { ...settings, title: "Masteries", ...commonSettings, });
                attunedList = SectionHelpers.generateStructuredHtmlForSectionOverview(attuned, SectionHelpers.MasonryType, { ...settings, title: "Attuned", ...commonSettings, });
                specialTriggeredAbilityList = SectionHelpers.generateStructuredHtmlForSectionOverview(specialTriggeredAbilities, SectionHelpers.MasonryType, { ...settings, title: "Special Triggered", ...commonSettings, });
                triggeredAbilityList = SectionHelpers.generateStructuredHtmlForSectionOverview(triggeredAbilities, SectionHelpers.MasonryType, { ...settings, title: "Triggered", ...commonSettings, });
                moveActionAbilityList = SectionHelpers.generateStructuredHtmlForSectionOverview(moveActionAbilities, SectionHelpers.MasonryType, { ...settings, title: "Move Actions", ...commonSettings, });
                actionAbilityList = SectionHelpers.generateStructuredHtmlForSectionOverview(actionAbilities, SectionHelpers.MasonryType, { ...settings, title: "Actions", ...commonSettings, });
                quickActionAbilityList = SectionHelpers.generateStructuredHtmlForSectionOverview(quickActionAbilities, SectionHelpers.MasonryType, { ...settings, title: "Quick Actions", ...commonSettings, });
                otherAbilityList = SectionHelpers.generateStructuredHtmlForSectionOverview(otherAbilities, SectionHelpers.MasonryType, { ...settings, title: "Other", ...commonSettings, });
                summonsList = SectionHelpers.generateStructuredHtmlForSectionOverview(summons, SectionHelpers.MasonryType, { ...settings, title: "Summons", ...commonSettings, });

                if (!settings.simple) for (let list of [masteriesList, triggeredAbilityList, moveActionAbilityList, actionAbilityList, quickActionAbilityList, otherAbilityList, summonsList]) list.listElement.setAttribute('placeholder', "No matching abilities found...");
            } else {
                let commonSettings = {
                    variables, hideIfEmpty: true,
                }
                masteriesList = this.generateAbilityListHtml(character, masteries, { ...settings, title: "Masteries", ...commonSettings, });
                attunedList = this.generateAbilityListHtml(character, attuned, { ...settings, title: "Attuned", ...commonSettings, });
                specialTriggeredAbilityList = this.generateAbilityListHtml(character, specialTriggeredAbilities, { ...settings, title: "Special Triggered", ...commonSettings, });
                triggeredAbilityList = this.generateAbilityListHtml(character, triggeredAbilities, { ...settings, title: "Triggered", ...commonSettings, });
                moveActionAbilityList = this.generateAbilityListHtml(character, moveActionAbilities, { ...settings, title: "Move Actions", ...commonSettings, });
                actionAbilityList = this.generateAbilityListHtml(character, actionAbilities, { ...settings, title: "Actions", ...commonSettings, });
                quickActionAbilityList = this.generateAbilityListHtml(character, quickActionAbilities, { ...settings, title: "Quick Actions", ...commonSettings, });
                otherAbilityList = this.generateAbilityListHtml(character, otherAbilities, { ...settings, title: "Other", ...commonSettings, });
                summonsList = this.generateAbilityListHtml(character, summons, { ...settings, title: "Summons", ...commonSettings, });
            }

            abilitiesContainer.appendChild(masteriesList.container);
            abilitiesContainer.appendChild(attunedList.container);
            abilitiesContainer.appendChild(specialTriggeredAbilityList.container);
            abilitiesContainer.appendChild(triggeredAbilityList.container);
            abilitiesContainer.appendChild(moveActionAbilityList.container);
            abilitiesContainer.appendChild(actionAbilityList.container);
            abilitiesContainer.appendChild(quickActionAbilityList.container);
            abilitiesContainer.appendChild(otherAbilityList.container);
            abilitiesContainer.appendChild(summonsList.container);


            function consumeItem(item) {
                character.unattuneItem(item);
                character.removeItem(item);
                CharacterHelpers.saveCharacter(character);

                if (character.getAttunedItemAmount(item) == 0) attunedList.removeSection(item);
                else {
                    SectionHelpers.regenerateHtmlForStructuredSection(attunedList.sections.get(item));
                }
            }

            for (let structuredSection of attunedList.sections) {
                addConsumeButton(structuredSection);
                structuredSection.settings.onRegenerated = () => addConsumeButton(structuredSection);
            }

            function addConsumeButton(structuredSection) {
                let item = structuredSection.section;
                if (!AbilitySectionHelpers.isConsumable(item)) return;

                let container = structuredSection.consumeButtonContainer = fromHTML(`<div>`);
                container.appendChild(hb(2));
                let wrapper = fromHTML(`<div class="listHorizontal centerContentHorizontally">`);
                container.appendChild(wrapper);
                let button = structuredSection.consumeButton = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered brand-border-color hoverable centerContentHorizontally w-100">Consume`);
                button.setAttribute('tooltip-path', 'rules/Items/Consumables');
                wrapper.appendChild(button);

                button.addEventListener('click', () => consumeItem(item));
                structuredSection.element.appendChild(container);
            }

            if (!settings.noSearch) new SectionSearch(searchContainer, [masteriesList, attunedList, specialTriggeredAbilityList, triggeredAbilityList, moveActionAbilityList, actionAbilityList, quickActionAbilityList, otherAbilityList, summonsList], { filterKey: character.id });
        }

        return element;
    }

    static generateAbilityListHtml(character, abilities, settings = null) {
        settings ??= {};
        let container = fromHTML(`<div class="divList">`);    
        if (settings.title) {
            let titleElement = fromHTML(`<h1>`);
            container.appendChild(titleElement);
            titleElement.textContent = settings.title;
        }
        let searchContainer = null;
        if (settings.addSearchbar) {
            searchContainer = fromHTML(`<div class="sticky">`);
            container.appendChild(searchContainer);
        }
        let listElement = fromHTML(`<div class="divList">`);
        container.appendChild(listElement);
        if (!settings.simple) listElement.setAttribute('placeholder', "No matching abilities found...");

        let abilityList = new StructuredAbilityListHtml(character, container, listElement, searchContainer, settings);
        abilities.forEach(ability => abilityList.addAbility(ability));
        return abilityList;
    }

    static wrapAbilitySectionForList(character, ability, settings = null) {
        settings ??= {};
        if (!settings.noVariables) settings.variables ??= character.getVariables();

        let element = fromHTML(`<div class="listContainerHorizontal alignItemsStart gap-2">`);
        let toggleMoreButton = fromHTML(`<button class="element rounded-xl hoverable">`);
        element.appendChild(toggleMoreButton);
        let expandMoreIcon = icons.expandMore();
        toggleMoreButton.appendChild(expandMoreIcon);
        let expandLessIcon = icons.expandLess();
        toggleMoreButton.appendChild(expandLessIcon);
        expandLessIcon.classList.add('hide');

        let contentContainer = fromHTML(`<div class="divList flexFill">`);
        element.appendChild(contentContainer);
        let summaryElement = fromHTML(`<div class="listHorizontal" style="margin-top: 3px;">`);
        contentContainer.appendChild(summaryElement);

        let nameElement = fromHTML(`<div>`);
        summaryElement.appendChild(nameElement);
        nameElement.textContent = ability.title;
        let parts = [];
        if (!settings.simple) {
            let actionCost = AbilitySectionHelpers.getActionCostTag(ability);
            if (actionCost) parts.push(actionCost);
            let trigger = AbilitySectionHelpers.getTrigger(ability);
            if (trigger) {
                parts.push("Trigger: " + trigger);
            }
        }

        for (let part of parts) {
            let verticalRuler = fromHTML(`<div>|`);
            summaryElement.appendChild(verticalRuler);
            let partElement = fromHTML(`<div>`);
            summaryElement.appendChild(partElement);
            partElement.textContent = part;
        }

        let expandedArea = fromHTML(`<div class="hide">`);
        contentContainer.appendChild(expandedArea);
        let structuredSection = SectionHelpers.generateStructuredHtmlForSection(ability, {variables: settings.variables, wrapperElement: element});
        expandedArea.appendChild(structuredSection.element);

        let isExpanded = false;
        toggleMoreButton.addEventListener('click', () => {
            isExpanded = !isExpanded;
            if (isExpanded) {
                expandMoreIcon.classList.add('hide');
                expandLessIcon.classList.remove('hide');
                expandedArea.classList.remove('hide');
            } else {
                expandMoreIcon.classList.remove('hide');
                expandLessIcon.classList.add('hide');
                expandedArea.classList.add('hide');
            }
            HtmlHelpers.getClosestProperty(toggleMoreButton, "_masonry")?.resize();
        });
        expandedArea.appendChild(hb(4));

        return structuredSection;
    }

    static generateItemsSubPageHtml(character, settings = null) {
        settings ??= {};

        let element = fromHTML(`<div class="character-subPage-items divList">`);
        let searchContainer = fromHTML(`<div class="sticky">`);
        element.appendChild(searchContainer);
        let abilitiesContainer = fromHTML(`<div class="divList gap-2">`);
        element.appendChild(abilitiesContainer);

        let variables = null;
        if (!settings.noVariables) variables = settings.variables ??= character.getVariables();

        let attuned = SectionHelpers.generateStructuredHtmlForSectionOverview(character.attunedItems.getAll(), SectionHelpers.MasonryType, { ...settings, title: "Attuned", placeholder: "No items attuned...", variables, draggable: true, afterdrag: CharacterCreatorHelpers.getAfterdragForCharacterRegistry(character, character.attunedItems), });
        let overview = SectionHelpers.generateStructuredHtmlForSectionOverview(character.items.getAll(), SectionHelpers.MasonryType, { ...settings, title: "Other", placeholder: "No other items found...", variables, draggable: true, afterdrag: CharacterCreatorHelpers.getAfterdragForCharacterRegistry(character, character.items), });
        abilitiesContainer.appendChild(attuned.container);
        abilitiesContainer.appendChild(overview.container);

        function attuneItem(item) {
            character.attuneItem(item);
            CharacterHelpers.saveCharacter(character);

            if (character.getItemAmount(item) == 0) overview.removeSection(item);
            else SectionHelpers.regenerateHtmlForStructuredSection(overview.sections.get(item));

            if (attuned.sections.has(item)) SectionHelpers.regenerateHtmlForStructuredSection(attuned.sections.get(item));
            else {
                let structuredSection = attuned.addSection(character.attunedItems.get(item));
                addUnattuneButton(structuredSection);
                structuredSection.settings.onRegenerated = () => addUnattuneButton(structuredSection);
            }
 
            updateAll();
        }

        function unattuneItem(item) {
            character.unattuneItem(item);
            CharacterHelpers.saveCharacter(character);

            if (character.getAttunedItemAmount(item) == 0) attuned.removeSection(item);
            else SectionHelpers.regenerateHtmlForStructuredSection(attuned.sections.get(item));

            if (overview.sections.has(item)) SectionHelpers.regenerateHtmlForStructuredSection(overview.sections.get(item));
            else {
                let structuredSection = overview.addSection(character.items.get(item));
                addAttuneButton(structuredSection);
                structuredSection.settings.onRegenerated = () => addAttuneButton(structuredSection);
            }

            updateAll();
        }

        for (let structuredSection of attuned.sections) {
            addUnattuneButton(structuredSection);
            structuredSection.settings.onRegenerated = () => addUnattuneButton(structuredSection);
        }
        for (let structuredSection of overview.sections) {
            addAttuneButton(structuredSection);
            structuredSection.settings.onRegenerated = () => addAttuneButton(structuredSection);
        }

        function updateAll() {
            for (let structuredSection of overview.sections) {
                if (character.getRemainingAttunementSlots() <= 0) structuredSection.attuneButton.setAttribute('disabled', '');
                else structuredSection.attuneButton.removeAttribute('disabled');
            }
        }
        updateAll();

        function addAttuneButton(structuredSection) {
            let item = structuredSection.section;

            let container = structuredSection.attuneButtonContainer = fromHTML(`<div>`);
            container.appendChild(hb(2));
            let wrapper = fromHTML(`<div class="listHorizontal centerContentHorizontally">`);
            container.appendChild(wrapper);
            let button = structuredSection.attuneButton = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered brand-border-color hoverable centerContentHorizontally w-100">Attune`);
            button.setAttribute('tooltip-path', 'rules/Items/Attunements');
            wrapper.appendChild(button);

            button.addEventListener('click', () => attuneItem(item));
            structuredSection.element.appendChild(container);
        }

        function addUnattuneButton(structuredSection) {
            let item = structuredSection.section;

            let container = structuredSection.unattuneButtonContainer = fromHTML(`<div>`);
            container.appendChild(hb(2));
            let wrapper = fromHTML(`<div class="listHorizontal centerContentHorizontally">`);
            container.appendChild(wrapper);
            let button = structuredSection.unattuneButton = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered brand-border-color hoverable centerContentHorizontally w-100">Unattune`);
            button.setAttribute('tooltip-path', 'rules/Items/Attunements');
            wrapper.appendChild(button);

            button.addEventListener('click', () => unattuneItem(item));
            structuredSection.element.appendChild(container);
        }


        if (!settings.noSearch) new SectionSearch(searchContainer, [attuned, overview], { filterKey: "___ITEMS___" + character.id });

        return element;
    }

    static generateSkillsSubPageHtml(character, settings) {
        settings ??= {};

        let element = fromHTML(`<div class="character-subPage-skills" placeholder="No skills unlocked.">`);

        let skillFieldsContainer = fromHTML(`<div class="character-skillFields divList gap-6 markTooltips">`);

        let hasSkillAbove0 = false;
        let fields = CharacterHelpers.getSkillFieldNames();
        for (let field of fields) {
            let branches = CharacterHelpers.getSkillBranchNamesByField(field);
            let baseFieldLevel = character.getBaseSkillFieldLevel(field);

            let skillFieldContainer = fromHTML(`<div class="character-skillField-container divList gap-0">`);
            skillFieldContainer._skillField = field;

            let fieldElement = fromHTML(`<div class="character-skillField listHorizontal gap-4">`);
            skillFieldContainer.appendChild(fieldElement);
            let fieldNameElement = fromHTML(`<h1 class="character-skillField-name">`);
            fieldElement.appendChild(fieldNameElement);
            fieldNameElement.textContent = field;
            let fieldValueElement = fromHTML(`<div class="character-skillField-value">`);
            fieldElement.appendChild(fieldValueElement);
            fieldValueElement.textContent = baseFieldLevel;

            let branchesContainer = fromHTML(`<div class="character-branches-container divList gap-4">`);
            skillFieldContainer.appendChild(branchesContainer);

            let fieldHasSkillAbove0 = false;
            for (let branch of branches) {
                let skills = CharacterHelpers.getSkillNamesByBranch(branch);
                let branchLevel = character.getSkillBranchLevel(branch);

                let skillBranchContainer = fromHTML(`<div class="character-skillBranch-container divList gap-0">`);
                skillBranchContainer._skillBranch = branch;

                let branchElement = fromHTML(`<div class="character-skillBranch listHorizontal gap-4">`);
                skillBranchContainer.appendChild(branchElement);
                let branchNameElement = fromHTML(`<h2 class="character-skillBranch-name">`);
                branchElement.appendChild(branchNameElement);
                branchNameElement.textContent = branch;
                let branchValueElement = fromHTML(`<div class="character-skillBranch-value">`);
                branchElement.appendChild(branchValueElement);
                branchValueElement.textContent = branchLevel;

                let skillsContainer = fromHTML(`<div class="character-skills-container divList">`);
                skillBranchContainer.appendChild(skillsContainer);

                let branchHasSkillAbove0 = false;
                for (let skill of skills) {
                    let skillLevel = character.getSkillLevel(skill);
                    if (skillLevel == 0) continue;
                    branchHasSkillAbove0 = true;
                    let description = Registries.skills.get(skill).content;

                    let skillElement = fromHTML(`<div class="character-skill listHorizontal gap-4">`);
                    skillsContainer.appendChild(skillElement);
                    let skillNameElement = fromHTML(`<div class="character-skill-name">`);
                    skillElement.appendChild(skillNameElement);
                    skillNameElement.textContent = skill;
                    skillNameElement.setAttribute('tooltip', description);
                    let skillValueElement = fromHTML(`<div class="character-skill-value">`);
                    skillElement.appendChild(skillValueElement);
                    skillValueElement.textContent = skillLevel;
                }
                if (branchHasSkillAbove0) {
                    fieldHasSkillAbove0 = true;
                    branchesContainer.appendChild(skillBranchContainer);
                }
            }
            if (fieldHasSkillAbove0) {
                hasSkillAbove0 = true;
                skillFieldsContainer.appendChild(skillFieldContainer);
            }
        }
        if (hasSkillAbove0) {
            element.appendChild(skillFieldsContainer);
        }

        return element;
    }

    static generateFlavorSubPageHtml(character, settings) {
        let element = fromHTML(`<div class="character-subPage-flavor">`);

        let appearanceContainer = fromHTML(`<div class="character-details-backstory-container"><h1>Appearance`);
        element.appendChild(appearanceContainer);
        let appearanceElement = fromHTML(`<div class="character-details-appearance">`);
        appearanceContainer.appendChild(appearanceElement);
        appearanceElement.textContent = character.details.appearance ?? "No appearance details specified...";

        element.appendChild(hb(4));
        let whyContainer = fromHTML(`<div class="character-details-why-container"><h1>Why?`);
        element.appendChild(whyContainer);
        let whyElement = fromHTML(`<div class="character-details-why">`);
        whyContainer.appendChild(whyElement);
        whyElement.textContent = character.details.why ?? "No reasons written yet...";

        element.appendChild(hb(4));
        let backstoryContainer = fromHTML(`<div class="character-details-backstory-container"><h1>Backstory`);
        element.appendChild(backstoryContainer);
        let backstoryElement = fromHTML(`<div class="character-details-backstory">`);
        backstoryContainer.appendChild(backstoryElement);
        backstoryElement.textContent = character.details.backstory ?? "No backstory written yet...";

        return element;
    }

    static generateMiscSubPageHtml(character, settings) {
        let element = fromHTML(`<div class="character-subPage-misc">`);

        element.appendChild(fromHTML(`<h1>Money`));
        let moneyInputContainer = fromHTML(`<div class="listHorizontal gap-4">`);
        element.appendChild(moneyInputContainer);
        moneyInputContainer.appendChild(fromHTML(`<div>Remaining money (consult GM before changing):`));
        let moneyInput = fromHTML(`<input type="number" class="largeElement rounded largeNumberInput">`);
        moneyInputContainer.appendChild(moneyInput);
        moneyInputContainer.appendChild(fromHTML(`<div>\u25EC`));
        moneyInput.value = character.money;
        moneyInput.addEventListener('input', () => {
            if (moneyInput.value == '') return;
            let newValue = InputHelpers.fixNumberInput(moneyInput);
            if (character.settings.validate) newValue = InputHelpers.constrainInput(moneyInput, value => Math.max(value, 0));
            if (character.money == newValue) return;
            character.money = newValue;
            CharacterHelpers.saveCharacter(character);
        });
        moneyInput.addEventListener('focusout', () => {
            if (moneyInput.value == '') moneyInput.value = character.money;
        });

        element.appendChild(hb(4));
        element.appendChild(fromHTML(`<h1>Belongings`));
        let belongingsInputContainer = fromHTML(`<div class="contenteditableContainer">`);
        element.appendChild(belongingsInputContainer);
        const belongingsInput = fromHTML(`<div contenteditable-type="plainTextOnly" contenteditable="true" class="w-100 fixText maxHeight-6">`);
        belongingsInputContainer.appendChild(belongingsInput);
        belongingsInput.textContent = character.details.belongings;
        belongingsInput.addEventListener('input', e => {
            let text = belongingsInput.innerText;
            if (ContentEditableHelpers.textNeedsFixing(text)) belongingsInput.textContent = text = ContentEditableHelpers.fixText(text);
            character.details.belongings = text;
            CharacterHelpers.saveCharacter(character);
        });
        belongingsInput.addEventListener('keydown', e => {
            ContentEditableHelpers.checkForTab(e);
        });

        element.appendChild(hb(4));
        element.appendChild(fromHTML(`<h1>Notes`));
        let notesInputContainer = fromHTML(`<div class="contenteditableContainer">`);
        element.appendChild(notesInputContainer);
        const notesInput = fromHTML(`<div contenteditable-type="plainTextOnly" contenteditable="true" class="w-100 fixText maxHeight-6">`);
        notesInputContainer.appendChild(notesInput);
        notesInput.textContent = character.details.notes;
        notesInput.addEventListener('input', e => {
            let text = notesInput.innerText;
            if (ContentEditableHelpers.textNeedsFixing(text)) notesInput.textContent = text = ContentEditableHelpers.fixText(text);
            character.details.notes = text;
            CharacterHelpers.saveCharacter(character);
        });
        notesInput.addEventListener('keydown', e => {
            ContentEditableHelpers.checkForTab(e);
        });


        return element;
    }

    static generateSkillsOverviewHtml(settings) {
        settings ??= {};

        let element = fromHTML(`<div class="skillsOverview" placeholder="No skills found.">`);

        let skillFieldsContainer = fromHTML(`<div class="skillsOverview-skillFields divList gap-6 markTooltips">`);
        element.appendChild(skillFieldsContainer);

        let fields = CharacterHelpers.getSkillFieldNames();
        for (let field of fields) {
            let branches = CharacterHelpers.getSkillBranchNamesByField(field);

            let skillFieldContainer = fromHTML(`<div class="skillsOverview-skillField-container divList gap-0">`);
            skillFieldsContainer.appendChild(skillFieldContainer);
            skillFieldContainer._skillField = field;

            let fieldElement = fromHTML(`<div class="skillsOverview-skillField listHorizontal gap-4">`);
            skillFieldContainer.appendChild(fieldElement);
            let fieldNameElement = fromHTML(`<h1 class="skillsOverview-skillField-name">`);
            fieldElement.appendChild(fieldNameElement);
            fieldNameElement.textContent = field;

            let branchesContainer = fromHTML(`<div class="skillsOverview-branches-container divList gap-4">`); // listHorizontal gap-6 alignItemsStart :vs: divList gap-4
            skillFieldContainer.appendChild(branchesContainer);

            for (let branch of branches) {
                let skills = CharacterHelpers.getSkillNamesByBranch(branch);

                let skillBranchContainer = fromHTML(`<div class="skillsOverview-skillBranch-container divList gap-0">`);
                branchesContainer.appendChild(skillBranchContainer);
                skillBranchContainer._skillBranch = branch;

                let branchElement = fromHTML(`<div class="skillsOverview-skillBranch listHorizontal gap-4">`);
                skillBranchContainer.appendChild(branchElement);
                let branchNameElement = fromHTML(`<h2 class="skillsOverview-skillBranch-name">`);
                branchElement.appendChild(branchNameElement);
                branchNameElement.textContent = branch;

                let skillsContainer = fromHTML(`<div class="skillsOverview-skills-container divList">`);
                skillBranchContainer.appendChild(skillsContainer);

                for (let skill of skills) {
                    let description = Registries.skills.get(skill).content;

                    let skillElement = fromHTML(`<div class="skillsOverview-skill listHorizontal gap-4">`);
                    skillsContainer.appendChild(skillElement);
                    let skillNameElement = fromHTML(`<div class="skillsOverview-skill-name">`);
                    skillElement.appendChild(skillNameElement);
                    skillNameElement.textContent = skill;
                    skillNameElement.setAttribute('tooltip', description);
                }
            }
        }

        return element;
    }

    static getCharacterSection(character) {
        let attributes = [];
        let firstLine = [];
        firstLine.push(new HeadValue("Level", character.stats.level));
        if (character.ancestry != null) firstLine.push(new HeadValue("Ancestry", character.ancestry));
        if (character.weapons.size != 0) firstLine.push(new HeadValue("Weapons", character.weapons.getAll().join(' + ')));
        if (character.paths.size != 0) firstLine.push(new HeadValue("Path", character.paths.getAll().join(' + ')));
        if (character.characteristics.size != 0) firstLine.push(new HeadValue("Characteristics", character.characteristics.getAll().join(' + ')));
        if (character.passions.size != 0) firstLine.push(new HeadValue("Passions", character.passions.getAll().join(' + ')));
        attributes.push(firstLine);

        return new Section({
            title: character.name,
            attributes: attributes,
            anchor: "characters",
        });
    }

    static generateStructuredHtmlForCharacterSectionOverview(characters, settings = null) {
        settings ??= {};
        let container = fromHTML(`<div class="section-overview listContainerVertical children-w-100">`);

        let searchContainer;
        if (settings.addSearch) {
            searchContainer = fromHTML(`<div class="sticky">`);
            container.appendChild(searchContainer);
        }

        let listElement = fromHTML(`<div class="masonryGrid" gap-x="20" gap-y="20" min-width="400">`);
        listElement.setAttribute('placeholder', "Loading...");
        container.appendChild(listElement);

        const overview = new StructuredCharacterSectionOverviewHtml(container, listElement, searchContainer, settings);
        characters.forEach(character => overview.addCharacter(character));
        if (!settings.dontInitSearch) overview.initSearch();

        return overview;
    }
}
CharacterHelpers.setup();
App.onAppLoaded(() => CharacterHelpers.loadCharacters());

class StructuredCharacterHtml {
    constructor(character, element, settings = null) {
        settings ??= {};
        this.element = element;
        this.character = character;
        element._character = character;
        element._structuredCharacter = this;
        element._variables = settings.variables ??= character.getVariables();
    }
}

class StructuredAbilityListHtml {
    constructor(character, container, listElement, searchContainer, settings = null) {
        this.container = container;
        this.listElement = listElement;
        this.character = character;

        this.searchContainer = searchContainer;
        if (!settings.noVariables) settings.variables ??= character.getVariables();
        this.settings = settings;
        this.sections = new Registry(); // Structured abilities
        this.didSearchInit = false;

        container._structuredAbilityList = this;
        listElement._structuredAbilityList = this;

        if (this.settings.hideIfEmpty) this.container.classList.add("hide");
    }

    initSearch() {
        if (!this.searchContainer || this.didSearchInit || this.sections.size == 0) return;
        this.didSearchInit = true;
        this.search = new SectionSearch(this.searchContainer, [this]);
        this.searchContainer._search = this.search;
    }

    addAbility(ability, insertSettings) {
        insertSettings ??= {};
        const structuredSection = CharacterHelpers.wrapAbilitySectionForList(this.character, ability, { ...this.insertSettings, variables: this.settings.variables, simple: this.settings.simple, noVariables: this.settings.noVariables });

        this.sections.register(structuredSection, { ...insertSettings, id: ability.id });
        HtmlHelpers.insertAt(this.listElement, this.sections.getIndex(structuredSection), structuredSection.wrapperElement);
        if (!this.settings.dontInitSearch) this.initSearch();

        if (this.settings.hideIfEmpty && this.sections.size != 0) this.container.classList.remove("hide");

        return structuredSection;
    }

    removeAbility(ability) {
        const structuredSection = this.sections.get(ability?.id);
        if (!structuredSection) return;
        structuredSection.wrapperElement.remove();
        this.sections.unregister(structuredSection);

        if (this.settings.hideIfEmpty && this.sections.size == 0) this.container.classList.add("hide");
    }
}

class StructuredCharacterSectionOverviewHtml {
    constructor(container, listElement, searchContainer, settings = null) {
        this.type = SectionHelpers.MasonryType;
        this.container = container;
        this.listElement = listElement;
        this.searchContainer = searchContainer;
        this.settings = settings;
        this.sections = new Registry(); // Structured sections
        this.didSearchInit = false;

        container._sectionOverview = this;
        listElement._sectionOverview = this;
    }

    initSearch() {
        if (!this.searchContainer || this.didSearchInit || this.sections.size == 0) return;
        this.didSearchInit = true;
        this.search = new SectionSearch(this.searchContainer, [this]);
        this.searchContainer._search = this.search;
    }

    addCharacter(character, insertSettings) {
        insertSettings ??= {};
        const section = CharacterHelpers.getCharacterSection(character);
        const structuredSection = SectionHelpers.wrapSectionForOverview(section, this.type, { ...this.insertSettings, link: `/app/character?id=${character.id}`, tooltips: "tagsOnly" });
        structuredSection.element._character = character;

        this.sections.register(structuredSection, { ...insertSettings, id: structuredSection.section.id });
        HtmlHelpers.insertAt(this.listElement, this.sections.getIndex(structuredSection), structuredSection.wrapperElement);
        if (!this.settings.dontInitSearch) this.initSearch();

        return structuredSection;
    }

    removeCharacter(character) {
        const structuredSection = this.sections.get(character?.id);
        if (!structuredSection) return;
        structuredSection.wrapperElement.remove();
        this.sections.unregister(structuredSection);
    }
}