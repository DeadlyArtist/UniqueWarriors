class CharacterCreatorHelpers {
    static generateStructuredHtmlForCharacterCreator(character) {
        let element = fromHTML(`<div class="characterCreator divList gap-2">`);
        let structuredCharacterCreator = new StructuredCharacterCreatorHtml(character, element);

        let topBar = fromHTML(`<div class="listContainerHorizontal">`);
        element.appendChild(topBar);
        topBar.appendChild(fromHTML(`<div>`));
        let tabBar = fromHTML(`<div class="listHorizontal">`);
        topBar.appendChild(tabBar);
        let pages = structuredCharacterCreator.pages = [
            { name: "Settings", provider: page => this.generateSettingsPageHtml(character, page), },
            { name: "Weapons", provider: page => this.generateWeaponsPageHtml(character, page), },
            { name: "Path", provider: page => this.generatePathPageHtml(character, page), },
            { name: "Flavor", provider: page => this.generateFlavorPageHtml(character, page), },
        ];
        structuredCharacterCreator.currentTab = pages[0];
        for (let page of pages) {
            let element = page.tabElement = fromHTML(`<button class="characterCreator-tab largeElement raised bordered-inset hoverable hideDisabled">`);
            tabBar.appendChild(element);
            element.textContent = page.name;
            element.addEventListener('click', () => structuredCharacterCreator.openPage(page));
        }
        let rightOfTopBar = fromHTML(`<div class="listHorizontal">`);
        topBar.appendChild(rightOfTopBar);
        let finishButton = fromHTML(`<button class="largeElement bordered hoverable" tooltip="Exit the character creator. You can return at any time to continue editing your character.">Finish`);
        rightOfTopBar.appendChild(finishButton);
        finishButton.addEventListener('click', () => CharacterHelpers.openCharacter(character));

        let pagesContainer = fromHTML(`<div class="divList">`);
        element.appendChild(pagesContainer);
        for (let page of pages) {
            let element = page.element = page.provider(page);
            pagesContainer.appendChild(element);
        }

        structuredCharacterCreator.updatePages();

        return structuredCharacterCreator;
    }

    static generateSettingsPageHtml(character, page) {
        let element = fromHTML(`<div class="characterCreator-page divList children-w-max">`);

        element.appendChild(fromHTML(`<h1>Name`));
        let nameInputContainer = fromHTML(`<div class="listHorizontal gap-4">`);
        element.appendChild(nameInputContainer);
        let nameInput = fromHTML(`<input type="text" class="largeElement xl-font" style="width: 400px;">`);
        nameInputContainer.appendChild(nameInput);
        nameInput.value = character.name;
        nameInput.addEventListener('input', () => {
            if (character.name == nameInput.value) return;
            character.name = nameInput.value;
            CharacterHelpers.saveCharacter(character);
        });

        element.appendChild(hb(3));
        element.appendChild(fromHTML(`<h1>Level`));
        let levelInputContainer = fromHTML(`<div class="listHorizontal gap-4">`);
        element.appendChild(levelInputContainer);
        let levelInput = fromHTML(`<input type="number" class="largeElement rounded">`);
        levelInputContainer.appendChild(levelInput);
        levelInput.value = character.stats.level;
        levelInput.addEventListener('input', () => {
            if (levelInput.value == '') return;
            InputHelpers.fixNumberInput(levelInput);
            let newValue = InputHelpers.constrainInput(levelInput, value => clamp(value, 1, 30));
            if (character.stats.level == newValue) return;
            character.stats.level = newValue;
            //CharacterHelpers.saveCharacter(character);
        });
        levelInput.addEventListener('focusout', () => {
            if (levelInput.value == '') levelInput.value = character.stats.level;
        });

        element.appendChild(hb(8));
        let settingsTitle = fromHTML(`<h1>Other`);
        element.appendChild(settingsTitle);

        let validateInputContainer = fromHTML(`<div class="listHorizontal gap-4" tooltip="Whether to constrain the character to the rules or to allow illegal configurations.">`);
        element.appendChild(validateInputContainer);
        validateInputContainer.appendChild(fromHTML(`<div>Validate:`));
        let validateInput = fromHTML(`<input type="checkbox">`);
        validateInputContainer.appendChild(validateInput);
        validateInput.checked = character.settings.validate;
        validateInput.addEventListener('input', () => {
            if (character.stats.validate == validateInput.checked) return;
            character.stats.validate = validateInput.checked;
            CharacterHelpers.saveCharacter(character);
        });

        return element;
    }

    static generateWeaponsPageHtml(character, page) {
        let element = fromHTML(`<div class="characterCreator-page divList">`);

        let lastLevel = character.level;
        page.onLoad = () => {
            if (lastLevel != character.level) {

            }
        };

        return element;
    }

    static generatePathPageHtml(character, page) {
        let element = fromHTML(`<div class="characterCreator-page divList">`);

        return element;
    }

    static generateFlavorPageHtml(character, page) {
        let element = fromHTML(`<div class="characterCreator-page divList">`);

        return element;
    }
}

class StructuredCharacterCreatorHtml {
    constructor(character, element) {
        this.element = element;
        this.character = character;

        element._character = character;
    }

    updatePages() {
        for (let page of this.pages) {
            if (page == this.currentTab) {
                page.tabElement.classList.add('raised');
                page.tabElement.classList.add('bordered-inset');
                page.tabElement.classList.remove('hoverable');
                page.tabElement.setAttribute('disabled', '');

                page.element.classList.remove('hide');
            } else {
                page.tabElement.classList.remove('raised');
                page.tabElement.classList.remove('bordered-inset');
                page.tabElement.classList.add('hoverable');
                page.tabElement.removeAttribute('disabled');

                page.element.classList.add('hide');
            }
        }
    }

    openPage(page) {
        this.currentTab = page;
        this.updatePages();
        if (page.onLoad) page.onLoad();
    }
}