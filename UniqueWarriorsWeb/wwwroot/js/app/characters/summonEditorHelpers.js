class SummonEditorHelpers {
    static generateStructuredHtmlForSummonEditor(character, summon, settings = null) {
        settings ??= {};
        let original = SummonHelpers.getVariantOriginal(character, summon);

        let element = fromHTML(`<div class="summonEditor divList gap-2">`);
        let structuredSummonEditor = new StructuredCharacterCreatorHtml(character, element, settings);

        let topBar = fromHTML(`<div class="listContainerHorizontal">`);
        element.appendChild(topBar);
        topBar.appendChild(fromHTML(`<div>`));
        let tabBar = fromHTML(`<div class="listHorizontal">`);
        topBar.appendChild(tabBar);
        let pages = structuredSummonEditor.pages = [
            { name: "Settings", provider: page => this.generateSettingsPageHtml(character, summon, original, page), },
            { name: "Techniques", provider: page => this.generateTechniquesPageHtml(character, summon, original, page), },
        ];
        for (let page of pages) {
            let element = page.tabElement = fromHTML(`<button class="summonEditor-tab largeElement raised bordered-inset hoverable hideDisabled">`);
            tabBar.appendChild(element);
            element.textContent = page.name;
            element.addEventListener('click', () => structuredSummonEditor.openPage(page));
        }
        let rightOfTopBar = fromHTML(`<div class="listHorizontal">`);
        topBar.appendChild(rightOfTopBar);
        let finishButton = fromHTML(`<button class="largeElement bordered hoverable" tooltip="Exit the summon editor. You can return at any time to continue editing your summon.">Finish`);
        rightOfTopBar.appendChild(finishButton);
        finishButton.addEventListener('click', () => CharacterHelpers.openCharacterCreator(character, "Techniques"));

        let pagesContainer = fromHTML(`<div class="divList" placeholder="Loading...">`);
        element.appendChild(pagesContainer);
        structuredSummonEditor.pagesContainer = pagesContainer;

        structuredSummonEditor.openTab(settings.startTab ?? pages[0]);

        return structuredSummonEditor;
    }

    static generateSettingsPageHtml(character, summon, original, page) {
        let summonVariables = summon.npc.getVariables();
        let element = fromHTML(`<div class="characterCreator-page divList children-w-fit">`);

        element.appendChild(fromHTML(`<h1>Name`));
        let nameInputContainer = fromHTML(`<div class="listHorizontal gap-4">`);
        element.appendChild(nameInputContainer);
        let nameInput = fromHTML(`<input type="text" class="largeElement xl-font" style="width: 400px;">`);
        nameInputContainer.appendChild(nameInput);
        nameInput.value = summon.npc.name;
        nameInput.addEventListener('input', () => {
            if (summon.npc.name == nameInput.value) return;
            summon.npc.name = nameInput.value;
            CharacterHelpers.saveCharacter(character);
        });

        element.appendChild(hb(4));
        element.appendChild(SectionHelpers.generateStructuredHtmlForSection(SectionHelpers.resolveSectionExpression('rules/Character Creation/Choose Weapons*noChildren'), { variables: summonVariables }).element);

        element.appendChild(hb(4));
        let chosenWeaponsBar = fromHTML(`<div class="listHorizontal gap-2">`);
        element.appendChild(chosenWeaponsBar);
        element.appendChild(hb(4));
        let unchosenWeaponsBar = fromHTML(`<div class="listHorizontal gap-2">`);
        element.appendChild(unchosenWeaponsBar);
        let weapons = new Set(CategoryHelpers.getWeaponNames());
        let chosenWeapons = summon.npc.weapons; // Registry
        let originalWeapons = original.npc.weapons;

        function chooseWeapon(weapon) {
            if (chosenWeapons.has(weapon)) return;
            chosenWeapons.register(weapon);
            CharacterHelpers.saveCharacter(character);
            updateWeapons();
        }

        function unchooseWeapon(weapon) {
            if (!chosenWeapons.has(weapon)) return;
            chosenWeapons.unregister(weapon);
            CharacterHelpers.saveCharacter(character);
            updateWeapons();
        }

        function updateWeapons() {
            chosenWeaponsBar.innerHTML = '';
            unchosenWeaponsBar.innerHTML = '';
            for (let weapon of weapons) {
                let hasWeapon = chosenWeapons.has(weapon);
                let originalHasWeapon = originalWeapons.has(weapon);
                let element = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered hoverable">`);
                (hasWeapon ? chosenWeaponsBar : unchosenWeaponsBar).appendChild(element);
                if (originalHasWeapon) {
                    element.setAttribute('disabled', '');
                    element.setAttribute('tooltip', 'Default weapons cannot be removed.');
                    element.classList.add('hideDisabled');
                }
                if (hasWeapon) element.classList.add('brand-border-color');
                if (!originalHasWeapon) element.addEventListener('click', () => hasWeapon ? unchooseWeapon(weapon) : chooseWeapon(weapon));
                let nameElement = fromHTML(`<div>`);
                element.appendChild(nameElement);
                nameElement.textContent = weapon;
                if (originalHasWeapon) continue;
                let icon = hasWeapon ? icons.close() : icons.add();
                element.appendChild(icon);
                icon.classList.add('minimalIcon');
            }
        }
        updateWeapons();

        return element;
    }

    static generateTechniquesPageHtml(character, summon, original, page) {
        let summonVariables = summon.npc.getVariables();
        let element = fromHTML(`<div class="characterCreator-page divList">`);

        let chosenWeapons = summon.npc.weapons;
        if (chosenWeapons.size == 0) {
            element.setAttribute('tooltip', "No weapons chosen...");
            return element;
        }

        let chosenTechniques = summon.npc.techniques;
        let originalTechniques = original.npc.techniques;
        let chosenSummons = summon.npc.summons;
        let originalSummons = original.npc.summons;

        function getMaxSummonUnlocks() {
            return CharacterCreatorHelpers.getMaxSummonUnlocksInVariant(character, summon);
        }
        let maxSummonUnlocks = getMaxSummonUnlocks();
        let availableSummons = Registries.summons.getAll();
        function getRemainingSummonUnlocks() {
            return CharacterCreatorHelpers.getRemainingSummonUnlocksInVariant(character, summon, { maxSummonUnlocks });
        }
        let remainingSummonUnlocks = getRemainingSummonUnlocks();
        function getMutations() {
            return CharacterCreatorHelpers.getMutations(summon.npc);
        }
        let chosenMutations = getMutations();
        function getRemainingFreeMutations() {
            return CharacterCreatorHelpers.getRemainingFreeMutationsInVariant(character, summon, { chosenMutations });
        }
        let remainingFreeMutations = getRemainingFreeMutations();
        function getRemainingOtherTechniques() {
            return CharacterCreatorHelpers.getRemainingOtherTechniquesInVariant(character, summon, { maxSummonUnlocks, chosenMutations, remainingFreeMutations });
        }
        let remainingOtherTechniques = getRemainingOtherTechniques();

        function getAllowedMutations(techniqueLike) {
            return CharacterCreatorHelpers.getAllowedMutationsInVariant(character, summon, techniqueLike, { maxSummonUnlocks, chosenMutations, remainingFreeMutations, remainingOtherTechniques });
        }

        let mutationDialog = DialogHelpers.create(dialog => {
            let dialogElement = fromHTML(`<div class="divList">`);
            let dialogTitleElement = dialog.dialogTitleElement = fromHTML(`<h1>`);
            dialogElement.appendChild(dialogTitleElement);

            let dialogMutationInputContainer = fromHTML(`<div class="listHorizontal">`);
            dialogElement.appendChild(dialogMutationInputContainer);
            dialogMutationInputContainer.appendChild(fromHTML(`<div>Mutation:`));
            let dialogMutationInput = dialog.dialogMutationInput = fromHTML(`<select class="largeElement w-max">`);
            dialogMutationInputContainer.appendChild(dialogMutationInput);

            dialogElement.appendChild(hb(2));
            let dialogNameContainer = fromHTML(`<div class="listHorizontal">`);
            dialogElement.appendChild(dialogNameContainer);
            dialogNameContainer.appendChild(fromHTML(`<div>Name:`));
            let dialogNameInput = dialog.dialogNameInput = fromHTML(`<input type="text" class="largeElement" placeholder="Enter mutation name..." style="width: 400px;">`);
            dialogNameContainer.appendChild(dialogNameInput);

            dialogElement.appendChild(hb(4));
            let dialogMutationPreviewContainer = dialog.dialogMutationPreviewContainer = fromHTML(`<div class="w-100">`);
            dialogElement.appendChild(dialogMutationPreviewContainer);

            dialogElement.appendChild(hb(6));
            let dialogButtonList = fromHTML(`<div class="listHorizontal">`);
            dialogElement.appendChild(dialogButtonList);
            let dialogCancelButton = fromHTML(`<button class="largeElement bordered hoverable flexFill w-100">Cancel`);
            dialogButtonList.appendChild(dialogCancelButton);
            dialog.addCloseButton(dialogCancelButton);
            let dialogLearnButton = fromHTML(`<button class="largeElement bordered hoverable flexFill w-100">Learn`);
            dialogButtonList.appendChild(dialogLearnButton);

            dialog.onMutationChange = () => {
                let mutation = dialogMutationInput.value;
                let section = SectionHelpers.getMutated(dialog._originalSection, mutation);
                let structuredSection = dialog._structuredSection = SectionHelpers.generateStructuredHtmlForSection(section, { summonVariables });
                dialogNameInput.value = section.title;
                dialogMutationPreviewContainer.innerHTML = "";
                dialogMutationPreviewContainer.appendChild(structuredSection.wrapperElement);
            }
            dialogMutationInput.addEventListener('change', () => {
                dialog.onMutationChange();
            });
            dialogNameInput.addEventListener('input', () => {
                let value = dialogNameInput.value;
                if (!value) value = dialog._structuredSection.section.title;
                dialog._structuredSection.titleElement.textContent = value;
            });
            dialogLearnButton.addEventListener('click', () => {
                dialog._structuredSection.section.title = dialogNameInput.value;
                learn(dialog._structuredSection.section);
                dialog.close();
            });

            return dialogElement;
        });

        function openMutationDialog(techniqueLike) {
            mutationDialog.dialogTitleElement.textContent = `Mutate: ${techniqueLike.title}`;

            let mutations = getAllowedMutations(techniqueLike);
            mutationDialog._originalSection = techniqueLike;
            mutationDialog.dialogMutationInput.innerHTML = "";
            mutations.forEach(mutation => mutationDialog.dialogMutationInput.appendChild(fromHTML(`<option>${escapeHTML(mutation.title)}`)));
            mutationDialog.dialogMutationInput.value = mutations[0].title;
            mutationDialog.onMutationChange();
            mutationDialog.open();
        }

        element.appendChild(fromHTML(`<h1>Choose Techniques`));
        let descriptionElement = fromHTML(`<div>`);
        element.appendChild(descriptionElement);
        function updateDescription() {
            let other = [];
            remainingFreeMutations.forEach((amount, mutation) => {
                other.push(`${amount}/1 ${mutation.title.toLowerCase()}`);
            });
            remainingSummonUnlocks.forEach((amount, category) => {
                other.push(`${amount}/${maxSummonUnlocks.get(category)} ${category.toLowerCase()} summon`);
            });
            let content = null;

            let remainingCharacterTechniquesData = CharacterCreatorHelpers.getRemainingOtherTechniquesData(character);
            content = `Choose up to ${remainingOtherTechniques} techniques. Every 2 techniques you spend on more summon techniques, you can spend 1 technique less on your character (which has currently ${remainingCharacterTechniquesData.count} available). Note: Choosing 1 technique on a summon means you have 1 more technique that you can spend only on summons (current overflow: ${remainingCharacterTechniquesData.divisionOverflow}).`;
            if (other.length != 0) {
                content += `\n\nAdditionally, choose ${other.join(", ")}.`;
            }
            let structuredSection = SectionHelpers.generateStructuredHtmlForSection(new Section({
                content,
            }));
            descriptionElement.replaceWith(structuredSection.wrapperElement);
            descriptionElement = structuredSection.wrapperElement;
        }

        element.appendChild(hb(4));
        element.appendChild(fromHTML(`<h1>Learned Techniques`));
        let chosenOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(chosenTechniques.getAll(), SectionHelpers.MasonryType, { addSearch: true, summonVariables });
        element.appendChild(chosenOverview.container);
        chosenOverview.listElement.setAttribute('placeholder', 'No techniques learned yet...');

        function updateChosenOverview() {
            for (let structuredSection of chosenOverview.sections) {
                let element = structuredSection.wrapperElement;
                let technique = structuredSection.section;
                let allowedMutations = getAllowedMutations(technique);
                if (!AbilitySectionHelpers.isMutated(technique) && !AbilitySectionHelpers.isMutation(technique) && allowedMutations.length != 0) {
                    if (!structuredSection.mutateButton) {
                        addMutateButton(structuredSection);
                    }
                } else {
                    if (structuredSection.mutateButton) {
                        structuredSection.mutateButtonContainer.remove();
                        structuredSection.mutateButton = null;
                    }
                }
            }

            chosenOverview.listElement._masonry?.resize();
        }

        element.appendChild(hb(4));
        element.appendChild(fromHTML(`<h1>Available Techniques`));
        let availableTechniques = Registries.techniques.filter(t => chosenWeapons.has(AbilitySectionHelpers.getMainCategory(t)));
        let availableOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(availableTechniques, SectionHelpers.MasonryType, { addSearch: true, summonVariables });
        element.appendChild(availableOverview.container);
        let noTechniquesElement = fromHTML(`<div class="hide" placeholder="No more techniques available...">`);
        element.appendChild(noTechniquesElement);
        function updateAvailableOverview() {
            let somethingAvailable = false;
            for (let structuredSection of availableOverview.sections) {
                let element = structuredSection.wrapperElement;
                let technique = structuredSection.section;
                let isAvailable = true;
                if (chosenTechniques.has(technique)) isAvailable = false;
                else if (character.settings.validate) {
                    if (remainingOtherTechniques <= 0) isAvailable = false;
                    else if (!CharacterCreatorHelpers.canConnectToAbility(chosenTechniques, technique, chosenTechniques)) isAvailable = false;
                }

                if (isAvailable) {
                    somethingAvailable = true;
                    element.classList.remove('hide');
                }
                else element.classList.add('hide');
            }

            if (somethingAvailable) {
                noTechniquesElement.classList.add('hide');
                availableOverview.searchContainer.classList.remove('hide');
            }
            else {
                noTechniquesElement.classList.remove('hide');
                availableOverview.searchContainer.classList.add('hide');
            }

            availableOverview.listElement._masonry?.resize();
        }


        let summonsContainer = fromHTML(`<div class="w-100">`);
        element.appendChild(summonsContainer);
        summonsContainer.appendChild(hb(4));
        summonsContainer.appendChild(fromHTML(`<h1>Learned Summons`));
        let chosenSummonsOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(chosenSummons.getAll(), SectionHelpers.MasonryType, { addSearch: true, summonVariables });
        summonsContainer.appendChild(chosenSummonsOverview.container);
        chosenSummonsOverview.listElement.setAttribute('placeholder', 'No summons learned yet...');

        function updateChosenSummonsOverview() {
            chosenSummonsOverview.listElement._masonry?.resize();
        }

        summonsContainer.appendChild(hb(4));
        summonsContainer.appendChild(fromHTML(`<h1>Available Summons`));
        let availableSummonsOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(availableSummons, SectionHelpers.MasonryType, { addSearch: true, summonVariables });
        summonsContainer.appendChild(availableSummonsOverview.container);
        let noSummonsElement = fromHTML(`<div class="hide" placeholder="No more summons available...">`);
        summonsContainer.appendChild(noSummonsElement);

        function updateAvailableSummonsOverview() {
            let somethingAvailable = false;
            for (let structuredSection of availableSummonsOverview.sections) {
                let element = structuredSection.wrapperElement;
                let summon = structuredSection.section;
                let isAvailable = true;
                if (chosenSummons.has(summon)) isAvailable = false;
                else if (character.settings.validate) {
                    let category = AbilitySectionHelpers.getMainCategory(summon);
                    if (!maxSummonUnlocks.has(category)) isAvailable = false;
                    else if (remainingOtherTechniques <= 0 && remainingSummonUnlocks.get(category) <= 0) isAvailable = false;
                    else if (!CharacterCreatorHelpers.canConnectToAbility(chosenSummons, summon, chosenTechniques)) isAvailable = false;
                }

                if (isAvailable) {
                    somethingAvailable = true;
                    element.classList.remove('hide');
                }
                else element.classList.add('hide');
            }

            if (somethingAvailable) {
                noSummonsElement.classList.add('hide');
                availableSummonsOverview.searchContainer.classList.remove('hide');
            }
            else {
                noSummonsElement.classList.remove('hide');
                availableSummonsOverview.searchContainer.classList.add('hide');
            }

            availableSummonsOverview.listElement._masonry?.resize();
        }

        function learn(techniqueLike, update = true) {
            let isSummon = NPCSectionHelpers.isSummon(techniqueLike);
            let chosen = chosenTechniques;
            let overview = chosenOverview;
            if (isSummon) {
                chosen = chosenSummons;
                overview = chosenSummonsOverview;
            }

            if (chosen.has(techniqueLike)) return;
            chosen.register(techniqueLike);
            let structuredSection = overview.addSection(techniqueLike);
            addUnlearnButton(structuredSection);

            if (update) {
                updateAll();
                CharacterHelpers.saveCharacter(character);
            }
        }

        function unlearn(techniqueLike, update = true) {
            let isSummon = NPCSectionHelpers.isSummon(techniqueLike);
            let chosen = chosenTechniques;
            let overview = chosenOverview;
            if (isSummon) {
                chosen = chosenSummons;
                overview = chosenSummonsOverview;
            }

            if (!chosen.has(techniqueLike)) return;
            chosen.unregister(techniqueLike);
            overview.removeSection(techniqueLike);
            if (character.settings.validate) {
                let repeat = update;
                while (repeat) {
                    repeat = false;
                    for (let techniqueLike of chosen) {
                        if (!CharacterCreatorHelpers.canConnectToAbility(chosen, techniqueLike, chosenTechniques)) {
                            unlearn(techniqueLike, false);
                            repeat = true;
                        }
                    }
                }
            }

            if (update) {
                updateAll();
                CharacterHelpers.saveCharacter(character);
            }
        }

        function mutate(techniqueLike) {
            openMutationDialog(techniqueLike)
        }

        function addUnlearnButton(structuredSection) {
            let technique = structuredSection.section;
            let container = structuredSection.learnButtonContainer = fromHTML(`<div>`);
            container.appendChild(hb(2));
            let wrapper = fromHTML(`<div class="listHorizontal centerContentHorizontally">`);
            container.appendChild(wrapper);
            let button = structuredSection.learnButton = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered brand-border-color hoverable centerContentHorizontally w-100">Unlearn`);
            wrapper.appendChild(button);
            if (character.settings.validate) button.setAttribute('tooltip', "Warning: If other techniques depend on this, you will unlearn them as well.");
            button.addEventListener('click', () => unlearn(technique));
            structuredSection.element.appendChild(container);
        }

        for (let structuredSection of chosenOverview.sections) {
            if (!originalTechniques.has(structuredSection.section)) addUnlearnButton(structuredSection);
        }

        for (let structuredSection of chosenSummonsOverview.sections) {
            if (!originalSummons.has(structuredSection.section)) addUnlearnButton(structuredSection);
        }

        function addLearnButton(structuredSection) {
            let technique = structuredSection.section;
            let container = structuredSection.learnButtonContainer = fromHTML(`<div>`);
            container.appendChild(hb(2));
            let wrapper = fromHTML(`<div class="listHorizontal centerContentHorizontally">`);
            container.appendChild(wrapper);
            let button = structuredSection.learnButton = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered brand-border-color hoverable centerContentHorizontally w-100">Learn`);
            wrapper.appendChild(button);
            button.addEventListener('click', () => learn(technique));
            structuredSection.element.appendChild(container);
        }

        for (let structuredSection of availableOverview.sections) {
            addLearnButton(structuredSection);
        }

        for (let structuredSection of availableSummonsOverview.sections) {
            addLearnButton(structuredSection);
        }

        function addMutateButton(structuredSection) {
            let technique = structuredSection.section;
            let container = structuredSection.mutateButtonContainer = fromHTML(`<div>`);
            container.appendChild(hb(2));
            let wrapper = fromHTML(`<div class="listHorizontal centerContentHorizontally">`);
            container.appendChild(wrapper);
            let button = structuredSection.mutateButton = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered brand-border-color hoverable centerContentHorizontally w-100">Mutate`);
            wrapper.appendChild(button);
            button.addEventListener('click', () => mutate(technique));
            if (structuredSection.learnButtonContainer) structuredSection.learnButtonContainer.before(container);
            else structuredSection.element.appendChild(container);
        }

        function refreshData() {
            chosenMutations = getMutations();
            remainingFreeMutations = getRemainingFreeMutations();
            maxSummonUnlocks = getMaxSummonUnlocks();

            let summonsWithoutUnlocks = chosenSummons.filter(s => !maxSummonUnlocks.has(AbilitySectionHelpers.getMainCategory(s)));
            summonsWithoutUnlocks.forEach(s => chosenSummons.unregister(s));

            remainingSummonUnlocks = getRemainingSummonUnlocks();
            remainingOtherTechniques = getRemainingOtherTechniques();
        }

        function updateAll(refresh = true) {
            if (refresh) refreshData();

            updateDescription();
            updateChosenOverview();
            updateAvailableOverview();
            if (maxSummonUnlocks.size != 0) {
                summonsContainer.classList.remove('hide');
                updateChosenSummonsOverview();
                updateAvailableSummonsOverview();
            } else {
                summonsContainer.classList.add('hide');
            }
        }
        updateAll(false);

        return element;
    }
}

class StructuredSummonEditorHtml {
    pagesContainer;
    pages;
    currentTab;

    constructor(character, summon, element, settings = null) {
        settings ??= {};
        this.element = element;
        this.character = character;
        this.summon = summon;
        this.updateHash = settings.updateHash ?? false;

        element._character = character;
        element._summon = summon;
    }

    updatePages() {
        for (let page of this.pages) {
            if (page == this.currentTab) {
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

    openPage(page, fromHash = false) {
        page ??= this.pages[0];

        if (this.updateHash && !fromHash) {
            changeHash(getHashWithChangedParam("tab", page.name == this.pages[0].name ? undefined : page.name));
            return;
        }

        if (this.currentTab) this.currentTab.element = null;

        this.currentTab = page;
        this.updatePages();

        this.pagesContainer.innerHTML = '';
        let element = page.element = page.provider(page);
        this.pagesContainer.appendChild(element);
        if (page.onLoad) page.onLoad();
    }

    openTab(tab) {
        let page = null;
        if (tab) page = this.pages.find(p => p.name == tab);
        this.openPage(page, true);
    }

    openPageFromHash() {
        this.openTab(this.getTabFromHash());
    }

    getTabFromHash() {
        return getHashQueryVariable('tab');
    }
}