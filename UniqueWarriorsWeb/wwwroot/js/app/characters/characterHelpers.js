class CharacterHelpers {
    static defaultName = "New Character";
    static scalingStatNames = new Set(["Level", "Rank", "Tier", "Max Runes", "Attribute Increases", "Max Runes"]);
    static attributeStatNames = new Set(["Max Health", "Speed", "Power", "Evasion", "Accuracy", "Initiative", "Luck", "Range"]);
    static staticStatNames = new Set(["Graze Range", "Crit Range", "Reach", "Size", "Actions", "Move Actions", "Quick Actions"]);
    static allStatNames = new Set();

    static setup() {
        this.allStatNames = new Set([...this.scalingStatNames, ...this.attributeStatNames, ...this.staticStatNames]);
    }

    static getDefaultStats() {
        return {
            level: 1,
            maxHealth: 40,
            power: 1,
            speed: 8,
            evasion: 12,
            accuracy: 2,
            luck: 1,
            initiative: 2,
            range: 24,
            grazeRange: 5,
            critRange: 1,
            reach: 2,
            size: 2,
            actions: 2,
            moveActions: 1,
            quickActions: 3,
        };
    }

    static getDefaultAttributes() {
        return {
            maxHealth: 0,
            power: 0,
            speed: 0,
            evasion: 0,
            accuracy: 0,
            luck: 0,
            initiative: 0,
            range: 0,
        };
    }

    static getStatName(stat) {
        return toTextCase(stat);
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

    static downloadCharacter(character) {
        let json = JSON.stringify(character);
        downloadJson(character.name, json);
    }

    static createCharacter(openInPage = true) {
        let character = new Character();
        Registries.characters.register(character);
        this.saveCharacter(character);
        if (openInPage) CharacterHelpers.openCharacter(character);
        return character;
    }

    static openCharacter(character) {
        Pages.goToPath(`/app/character?id=${encodeURIComponent(character.id)}`);
    }

    static openCharacterCreator(character) {
        Pages.goToPath(`/app/character/creator?id=${encodeURIComponent(character.id)}`);
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

    static getDefaultAbilities() {
        let abilities = Registries.rules.get('PC Sheet').subSections.get('Basic Abilities').subSections.getAll();
        return SectionHelpers.modify(abilities, {clone: true, height: 0});
    }

    static generateStructuredHtmlForCharacter(character, settings = null) {
        settings ??= {};
        let element = fromHTML(`<div class="character divList">`);
        let structuredCharacter = new StructuredCharacterHtml(character, element);

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

        const actionBarElement = fromHTML(`<div class="character-actionBar listHorizontal centerContentHorizontally hide">`);
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

        const titleBarElement = fromHTML(`<div class="character-titleBar listContainerHorizontal nowrap">`);
        element.appendChild(titleBarElement);
        let titleElement = fromHTML(`<h1 class="character-title">`);
        titleBarElement.appendChild(titleElement);
        titleElement.textContent = character.name;
        let openMenuElement = fromHTML(`<div class="character-menu listHorizontal">`);
        titleBarElement.appendChild(openMenuElement);
        let openMenuButton = fromHTML(`<button class="listHorizontal gap-1" tooltip="Open menu">`);
        openMenuElement.appendChild(openMenuButton);
        let closeMenuButton = fromHTML(`<button class="listHorizontal gap-1 hide" tooltip="Close menu">`);
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

        const section = CharacterHelpers.getCharacterSection(character);
        section.title = null;
        const structuredSection = SectionHelpers.generateStructuredHtmlForSection(section, SectionHelpers.TextType, settings);
        element.appendChild(structuredSection.element);
        structuredSection.element.classList.add("character-summary");

        element.appendChild(hb(4));
        let statsContainer = fromHTML(`<div class="character-stats listHorizontal gap-2">`);
        element.appendChild(statsContainer);
        let attributeStatsBar = fromHTML(`<div class="character-attributeStats listHorizontal gap-2">`);
        statsContainer.appendChild(attributeStatsBar);
        let staticStatsBar = fromHTML(`<div class="character-staticStats listHorizontal gap-2 hide">`);
        statsContainer.appendChild(staticStatsBar);
        let scalingStatsBar = fromHTML(`<div class="character-scalingStats listHorizontal gap-2 hide">`);
        statsContainer.appendChild(scalingStatsBar);
        let attributeStats = character.getAttributeStats();
        let staticStats = character.getStaticStats();
        let scalingStats = character.getScalingStats();
        function addStats(stats, element) {
            for (let [name, value] of Object.entries(stats)) {
                let statElement = fromHTML(`<div class="character-stat divList bordered rounded-xl">`);
                element.appendChild(statElement);
                statElement._stat = { name, value };
                let stateNameElement = fromHTML(`<div class="character-stat-name mediumElement">`);
                statElement.appendChild(stateNameElement);
                stateNameElement.textContent = CharacterHelpers.getStatName(name);
                statElement.appendChild(hr());
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
        });
        showLessStatsButton.addEventListener('click', () => {
            showAllStatsButton.classList.remove('hide');
            showLessStatsButton.classList.add('hide');
            staticStatsBar.classList.add('hide');
            scalingStatsBar.classList.add('hide');
        });

        element.appendChild(hb(4));
        let menuElement = fromHTML(`<div class="character-menu divList">`);
        element.appendChild(menuElement);
        let tabsBar = fromHTML(`<div class="character-menu-tabs listHorizontal">`);
        menuElement.appendChild(tabsBar);
        let abilitiesTabElement = fromHTML(`<button class="character-menu-tab largeElement bordered-inset raised hideDisabled" disabled>Abilities`);
        tabsBar.appendChild(abilitiesTabElement);
        let flavorTabElement = fromHTML(`<button class="character-menu-tab largeElement hoverable hideDisabled">Flavor`);
        tabsBar.appendChild(flavorTabElement);

        menuElement.appendChild(hb(2));
        let subPageElement = fromHTML(`<div class="character-menu-subPage">`);
        menuElement.appendChild(subPageElement);
        let abilitiesSubPageElement = this.generateAbilitiesSubPageHtml(character);
        subPageElement.appendChild(abilitiesSubPageElement);
        let flavorSubPageElement = this.generateFlavorSubPageHtml(character);
        subPageElement.appendChild(flavorSubPageElement);
        flavorSubPageElement.classList.add('hide');

        abilitiesTabElement.addEventListener('click', () => {
            abilitiesTabElement.setAttribute('disabled', '');
            flavorTabElement.removeAttribute('disabled');

            abilitiesTabElement.classList.add('raised');
            abilitiesTabElement.classList.add('bordered-inset');
            abilitiesTabElement.classList.remove('hoverable');
            flavorTabElement.classList.remove('raised');
            flavorTabElement.classList.remove('bordered-inset');
            flavorTabElement.classList.add('hoverable');

            // Pages
            abilitiesSubPageElement.classList.remove('hide');
            flavorSubPageElement.classList.add('hide');
        });
        flavorTabElement.addEventListener('click', () => {
            abilitiesTabElement.removeAttribute('disabled');
            flavorTabElement.setAttribute('disabled', '');

            abilitiesTabElement.classList.remove('raised');
            abilitiesTabElement.classList.remove('bordered-inset');
            abilitiesTabElement.classList.add('hoverable');
            flavorTabElement.classList.add('raised');
            flavorTabElement.classList.add('bordered-inset');
            flavorTabElement.classList.remove('hoverable');

            // Pages
            abilitiesSubPageElement.classList.add('hide');
            flavorSubPageElement.classList.remove('hide');
        });

        return structuredCharacter;
    }

    static generateAbilitiesSubPageHtml(character) {
        let element = fromHTML(`<div class="character-subPage-abilities divList">`);
        let searchContainer = fromHTML(`<div class="sticky">`);
        element.appendChild(searchContainer);
        let abilitiesContainer = fromHTML(`<div class="divList gap-2">`);
        element.appendChild(abilitiesContainer);

        let abilities = character.techniques.getAll().concat(character.masteries.getAll()).concat(this.getDefaultAbilities());

        let triggeredAbilities = [];
        let moveActionAbilities = [];
        let actionAbilities = [];
        let quickActionAbilities = [];
        let otherAbilities = [];
        for (let ability of abilities) {
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

        let variables = character.getVariables();
        let triggeredAbilityList = this.generateAbilityListHtml(character, triggeredAbilities, { title: "Triggered", variables });
        abilitiesContainer.appendChild(triggeredAbilityList.container);
        let moveActionAbilityList = this.generateAbilityListHtml(character, moveActionAbilities, { title: "Move Actions", variables });
        abilitiesContainer.appendChild(moveActionAbilityList.container);
        let actionAbilityList = this.generateAbilityListHtml(character, actionAbilities, { title: "Actions", variables });
        abilitiesContainer.appendChild(actionAbilityList.container);
        let quickActionAbilityList = this.generateAbilityListHtml(character, quickActionAbilities, { title: "Quick Actions", variables });
        abilitiesContainer.appendChild(quickActionAbilityList.container);
        let otherAbilityList = this.generateAbilityListHtml(character, otherAbilities, { title: "Other", variables });
        abilitiesContainer.appendChild(otherAbilityList.container);

        new SectionSearch(searchContainer, [triggeredAbilityList, moveActionAbilityList, actionAbilityList, quickActionAbilityList, otherAbilityList], { filterKey: character.id });

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
        let listElement = fromHTML(`<div class="divList" placeholder="No matching abilities found...">`);
        container.appendChild(listElement);

        let abilityList = new StructuredAbilityListHtml(character, container, listElement, searchContainer, settings);
        abilities.forEach(ability => abilityList.addAbility(ability));
        return abilityList;
    }

    static wrapAbilitySectionForList(character, ability, settings = null) {
        settings ??= {};
        settings.variables ??= character.getVariables();

        let element = fromHTML(`<div class="divList gap-2">`);

        let summaryElement = fromHTML(`<div class="listHorizontal">`);
        element.appendChild(summaryElement);
        let toggleMoreButton = fromHTML(`<button class="element rounded-xl hoverable">`);
        summaryElement.appendChild(toggleMoreButton);
        let expandMoreIcon = icons.expandMore();
        toggleMoreButton.appendChild(expandMoreIcon);
        let expandLessIcon = icons.expandLess();
        toggleMoreButton.appendChild(expandLessIcon);
        expandLessIcon.classList.add('hide');

        let nameElement = fromHTML(`<div>`);
        summaryElement.appendChild(nameElement);
        nameElement.textContent = ability.title;
        let parts = [];
        let actionCost = AbilitySectionHelpers.getActionCostTag(ability);
        if (actionCost) parts.push(actionCost);
        let trigger = AbilitySectionHelpers.getTrigger(ability);
        if (trigger) parts.push("Trigger: " + trigger);

        for (let part of parts) {
            let verticalRuler = fromHTML(`<div>|`);
            summaryElement.appendChild(verticalRuler);
            let partElement = fromHTML(`<div>`);
            summaryElement.appendChild(partElement);
            partElement.textContent = part;
        }

        let expandedArea = fromHTML(`<div class="hide" style="margin-left: 40px;">`);
        element.appendChild(expandedArea);
        let structuredSection = SectionHelpers.generateStructuredHtmlForSection(ability, SectionHelpers.TextType, {variables: settings.variables, wrapperElement: element});
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
        });
        expandedArea.appendChild(hb(4));

        return structuredSection;
    }

    static generateFlavorSubPageHtml(character) {
        let element = fromHTML(`<div class="character-subPage-flavor">`);
        let backStoryContainer = fromHTML(`<div class="character-backstory-container"><h1>Backstory`);
        element.appendChild(backStoryContainer);
        let backstoryElement = fromHTML(`<div class="character-backstory">`);
        backStoryContainer.appendChild(backstoryElement);
        backstoryElement.textContent = character.backstory ?? "No backstory written yet...";
        return element;
    }

    static getCharacterSection(character) {
        let attributes = [];
        let firstLine = [new HeadValue("Level", character.stats.level), new HeadValue("Ancestry", character.ancestry ?? "?"), new HeadValue("Weapons", character.weapons.size == 0 ? '?' : character.weapons.getAll().join(', ').concat('.')), new HeadValue("Paths", character.paths.size == 0 ? '?' : character.paths.getAll().join(', ').concat('.')), new HeadValue("Characteristics", character.characteristics.size == 0 ? '?' : character.characteristics.getAll().join(', ').concat('.')), new HeadValue("Passions", character.passions.size == 0 ? '?' : character.passions.getAll().join(', ').concat('.'))];
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
    constructor(character, element) {
        this.element = element;
        this.character = character;
        element._character = character;
        element._structuredCharacter = this;
    }
}

class StructuredAbilityListHtml {
    constructor(character, container, listElement, searchContainer, settings = null) {
        this.container = container;
        this.listElement = listElement;
        this.character = character;

        this.searchContainer = searchContainer;
        settings.variables ??= character.getVariables();
        this.settings = settings;
        this.sections = new Registry(); // Structured abilities
        this.didSearchInit = false;

        container._structuredAbilityList = this;
        listElement._structuredAbilityList = this;
    }

    initSearch() {
        if (!this.searchContainer || this.didSearchInit || this.sections.size == 0) return;
        this.didSearchInit = true;
        this.search = new SectionSearch(this.searchContainer, [this]);
        this.searchContainer._search = this.search;
    }

    addAbility(ability, insertSettings) {
        insertSettings ??= {};
        const structuredSection = CharacterHelpers.wrapAbilitySectionForList(this.character, ability, this.settings);

        let index = this.sections.getInsertIndex(insertSettings.insertBefore, insertSettings.insertAfter);
        if (index !== null) {
            HtmlHelpers.insertAt(this.listElement, index, structuredSection.wrapperElement);
        } else {
            this.listElement.appendChild(structuredSection.wrapperElement);
        }

        this.sections.register(structuredSection, { ...insertSettings, id: ability.title });

        if (!this.settings.dontInitSearch) this.initSearch();
    }

    removeAbility(ability) {
        const structuredSection = this.sections.get(ability?.title);
        if (!structuredSection) return;
        structuredSection.wrapperElement.remove();
        this.sections.unregister(structuredSection);
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
        const structuredSection = SectionHelpers.wrapSectionForOverview(section, this.type, { ...this.settings, link: `/app/character?id=${character.id}` });
        structuredSection.element._character = character;

        let index = this.sections.getInsertIndex(insertSettings.insertBefore, insertSettings.insertAfter);
        if (index !== null) {
            HtmlHelpers.insertAt(this.listElement, index, structuredSection.wrapperElement);
        } else {
            this.listElement.appendChild(structuredSection.wrapperElement);
        }

        this.sections.register(structuredSection, { ...insertSettings, id: structuredSection.section.title });

        if (!this.settings.dontInitSearch) this.initSearch();
    }

    removeCharacter(character) {
        const structuredSection = this.sections.get(character?.name);
        if (!structuredSection) return;
        structuredSection.wrapperElement.remove();
        this.sections.unregister(structuredSection);
    }
}