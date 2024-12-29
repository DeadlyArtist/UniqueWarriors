class CharacterCreatorHelpers {
    static generateStructuredHtmlForCharacterCreator(character, settings = null) {
        settings ??= {};

        let element = fromHTML(`<div class="characterCreator divList gap-2">`);
        let structuredCharacterCreator = new StructuredCharacterCreatorHtml(character, element, settings);

        let topBar = fromHTML(`<div class="listContainerHorizontal">`);
        element.appendChild(topBar);
        topBar.appendChild(fromHTML(`<div>`));
        let tabBar = fromHTML(`<div class="listHorizontal">`);
        topBar.appendChild(tabBar);
        let pages = structuredCharacterCreator.pages = [
            { name: "Settings", provider: page => this.generateSettingsPageHtml(character, page), },
            { name: "Weapons", provider: page => this.generateWeaponsPageHtml(character, page), },
            { name: "Techniques", provider: page => this.generateTechniquesPageHtml(character, page), },
            { name: "Path", provider: page => this.generatePathsPageHtml(character, page), },
            { name: "Masteries", provider: page => this.generateMasteriesPageHtml(character, page), },
            { name: "Attributes", provider: page => this.generateAttributesPageHtml(character, page), },
            { name: "Flavor", provider: page => this.generateFlavorPageHtml(character, page), },
        ];
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

        let pagesContainer = fromHTML(`<div class="divList" placeholder="Loading...">`);
        element.appendChild(pagesContainer);
        structuredCharacterCreator.pagesContainer = pagesContainer;

        structuredCharacterCreator.openTab(settings.startTab ?? pages[0]);

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
            let newValue = InputHelpers.fixNumberInput(levelInput);
            if (character.settings.validate) newValue = InputHelpers.constrainInput(levelInput, value => clamp(value, 1, 30));
            if (character.stats.level == newValue) return;
            character.stats.level = newValue;
            CharacterHelpers.saveCharacter(character);
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
        let variables = character.getVariables();
        let element = fromHTML(`<div class="characterCreator-page divList">`);
        element.appendChild(SectionHelpers.generateStructuredHtmlForSection(SectionHelpers.resolveSectionExpression('rules/Character Creation/Choose Weapons*noChildren'), {variables}).element);

        element.appendChild(hb(4));
        let chosenWeaponsBar = fromHTML(`<div class="listHorizontal gap-2">`);
        element.appendChild(chosenWeaponsBar);
        element.appendChild(hb(4));
        let unchosenWeaponsBar = fromHTML(`<div class="listHorizontal gap-2">`);
        element.appendChild(unchosenWeaponsBar);
        let weapons = new Set(CategoryHelpers.getWeaponNames());
        let chosenWeapons = character.weapons; // Registry

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
                let element = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered hoverable">`);
                (hasWeapon ? chosenWeaponsBar : unchosenWeaponsBar).appendChild(element);
                if (hasWeapon) element.classList.add('brand-border-color');
                element.addEventListener('click', () => hasWeapon ? unchooseWeapon(weapon) : chooseWeapon(weapon));
                let nameElement = fromHTML(`<div>`);
                element.appendChild(nameElement);
                nameElement.textContent = weapon;
                let icon = hasWeapon ? icons.close() : icons.add();
                element.appendChild(icon);
                icon.classList.add('minimalIcon');
            }
        }
        updateWeapons();

        return element;
    }

    static generateTechniquesPageHtml(character, page) {
        let variables = character.getVariables();
        let element = fromHTML(`<div class="characterCreator-page divList">`);

        let chosenWeapons = character.weapons;
        if (chosenWeapons.size == 0) {
            element.setAttribute('tooltip', "No weapons chosen...");
            return element;
        }

        let maxTechniques = character.getMaxTechniques(); // one of which is a weapon core technique
        let maxOtherTechniques = maxTechniques - 1;
        let chosenTechniques = character.techniques;
        let chosenSummons = character.summons;
        function getHasWeaponCore() {
            return chosenTechniques.some(t => AbilitySectionHelpers.isWeaponCore(t));
        }
        let hasWeaponCore = getHasWeaponCore();
        function getRemainingOtherTechniques(hasWeaponCore = null) {
            hasWeaponCore ??= getHasWeaponCore();
            return maxOtherTechniques - (hasWeaponCore ? chosenTechniques.size - 1 : chosenTechniques.size);
        }

        function getMutations() {
            return character.techniques.filter(t => AbilitySectionHelpers.isMutation(t));
        }
        function getRemainingFreeMutations(mutations = null) {
            mutations ??= getMutations();
            let remaining = new Map();
            for (let mutation of mutations) {
                remaining.set(mutation, 1);
                for (let chosen of [chosenTechniques, chosenSummons]) {
                    for (let techniqueLike of chosen) {
                        let mutatedMutation = AbilitySectionHelpers.getMutatedMutation(techniqueLike);
                        if (mutatedMutation == mutation.title) remaining.set(mutation, 0);
                    }
                }
            }
            return remaining;
        }

        let chosenMutations = getMutations();
        let remainingOtherTechniques = getRemainingOtherTechniques(hasWeaponCore);
        let remainingFreeMutations = getRemainingFreeMutations(chosenMutations);

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
                let structuredSection = dialog._structuredSection = SectionHelpers.generateStructuredHtmlForSection(section, {variables});
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

        function getAllowedMutations(techniqueLike, mutations, remainingOtherTechniques, remainingFreeMutations) {
            let isSummon = SummonHelpers.isSummon(techniqueLike);
            let chosen = chosenTechniques;
            if (isSummon) chosen = chosenSummons;
            let category = AbilitySectionHelpers.getMainCategory(techniqueLike);
            return mutations.filter(mutation =>
                !chosen.has(SectionHelpers.getMutationId(techniqueLike, mutation)) &&
                AbilitySectionHelpers.getMainCategory(mutation) != category &&
                (remainingOtherTechniques > 0 || remainingFreeMutations.get(mutation) != 0)
            );
        }

        function openMutationDialog(techniqueLike, mutations, remainingOtherTechniques, remainingFreeMutations) {
            let isSummon = SummonHelpers.isSummon(techniqueLike);
            mutationDialog.dialogTitleElement.textContent = `Mutate: ${techniqueLike.title}`;

            mutations = getAllowedMutations(techniqueLike, mutations, remainingOtherTechniques, remainingFreeMutations);
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
        function updateDescription(hasWeaponCore = null, remainingOtherTechniques = null, mutations = null, remainingFreeMutations = null, maxSummonUnlocks = null, remainingSummonUnlocks = null) {
            hasWeaponCore ??= getHasWeaponCore();
            remainingOtherTechniques ??= getRemainingOtherTechniques(hasWeaponCore);
            mutations ??= getMutations();
            remainingFreeMutations ??= getRemainingFreeMutations(mutations);
            maxSummonUnlocks ??= getMaxSummonUnlocks();
            remainingSummonUnlocks ??= getRemainingSummonUnlocks(maxSummonUnlocks);
            let other = '';
            remainingFreeMutations.forEach((amount, mutation) => {
                other += `, ${amount}/1 ${mutation.title.toLowerCase()}`;
            });
            remainingSummonUnlocks.forEach((amount, category) => {
                other += `, ${amount}/${maxSummonUnlocks.get(category)} ${category.toLowerCase()} summon`;
            });
            if (other.length != 0) other += ',';
            let structuredSection = SectionHelpers.generateStructuredHtmlForSection(new Section({
                content: `Choose ${hasWeaponCore ? 0 : 1}/1 weapon core${other} and ${remainingOtherTechniques}/${maxOtherTechniques} other techniques.`
            }));
            descriptionElement.replaceWith(structuredSection.wrapperElement);
            descriptionElement = structuredSection.wrapperElement;
        }

        element.appendChild(hb(4));
        element.appendChild(fromHTML(`<h1>Learned Techniques`));
        let chosenOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(chosenTechniques.getAll(), SectionHelpers.MasonryType, { addSearch: true, variables });
        element.appendChild(chosenOverview.container);
        chosenOverview.listElement.setAttribute('placeholder', 'No techniques learned yet...');

        function updateChosenOverview(hasWeaponCore = null, remainingOtherTechniques = null, mutations = null, remainingFreeMutations = null) {
            hasWeaponCore ??= getHasWeaponCore();
            remainingOtherTechniques ??= getRemainingOtherTechniques(hasWeaponCore);
            mutations ??= getMutations();
            remainingFreeMutations ??= getRemainingFreeMutations(mutations);

            for (let structuredSection of chosenOverview.sections) {
                let element = structuredSection.wrapperElement;
                let technique = structuredSection.section;
                let allowedMutations = getAllowedMutations(technique, mutations, remainingOtherTechniques, remainingFreeMutations);
                if (!AbilitySectionHelpers.isMutated(technique) && !AbilitySectionHelpers.isMutation(technique) && allowedMutations.length != 0) {
                    if (!structuredSection.mutateButton) {
                        addMutateButton(structuredSection);
                    }
                    if (remainingOtherTechniques <= 0 && !allowedMutations.some(am => remainingFreeMutations.get())) {

                    }
                } else {
                    if (structuredSection.mutateButton) {
                        structuredSection.mutateButton.remove();
                        structuredSection.mutateButton = null;
                    }
                }
            }

            chosenOverview.listElement._masonry?.resize();
        }

        element.appendChild(hb(4));
        element.appendChild(fromHTML(`<h1>Available Techniques`));
        let availableTechniques = Registries.techniques.filter(t => chosenWeapons.has(AbilitySectionHelpers.getMainCategory(t)));
        let availableOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(availableTechniques, SectionHelpers.MasonryType, { addSearch: true, variables });
        element.appendChild(availableOverview.container);
        let noTechniquesElement = fromHTML(`<div class="hide" placeholder="No more techniques available...">`);
        element.appendChild(noTechniquesElement);
        function updateAvailableOverview(hasWeaponCore = null, remainingOtherTechniques = null) {
            hasWeaponCore ??= getHasWeaponCore();
            remainingOtherTechniques ??= getRemainingOtherTechniques(hasWeaponCore);

            let somethingAvailable = false;
            for (let structuredSection of availableOverview.sections) {
                let element = structuredSection.wrapperElement;
                let technique = structuredSection.section;
                let isAvailable = true;
                if (chosenTechniques.has(technique)) isAvailable = false;
                else if (character.settings.validate) {
                    if (hasWeaponCore && remainingOtherTechniques <= 0) isAvailable = false;
                    else if (!hasWeaponCore && !AbilitySectionHelpers.isWeaponCore(technique)) isAvailable = false;
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
        let chosenSummonsOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(chosenSummons.getAll(), SectionHelpers.MasonryType, { addSearch: true, variables });
        summonsContainer.appendChild(chosenSummonsOverview.container);
        chosenSummonsOverview.listElement.setAttribute('placeholder', 'No summons learned yet...');

        function updateChosenSummonsOverview(hasWeaponCore = null, remainingOtherTechniques = null, mutations = null, remainingFreeMutations = null) {
            hasWeaponCore ??= getHasWeaponCore();
            remainingOtherTechniques ??= getRemainingOtherTechniques(hasWeaponCore);
            mutations ??= getMutations();
            remainingFreeMutations ??= getRemainingFreeMutations(mutations);

            for (let structuredSection of chosenSummonsOverview.sections) {
                let element = structuredSection.wrapperElement;
                let summon = structuredSection.section;
                let allowedMutations = getAllowedMutations(summon, mutations, remainingOtherTechniques, remainingFreeMutations);
                if (!AbilitySectionHelpers.isMutated(summon) && !AbilitySectionHelpers.isMutation(summon) && allowedMutations.length != 0) {
                    if (!structuredSection.mutateButton) {
                        addMutateButton(structuredSection);
                    }
                } else {
                    if (structuredSection.mutateButton) {
                        structuredSection.mutateButton.remove();
                        structuredSection.mutateButton = null;
                    }
                }
            }

            chosenSummonsOverview.listElement._masonry?.resize();
        }

        function getMaxSummonUnlocks() {
            let unlocks = new Map();
            chosenTechniques.filter(t => AbilitySectionHelpers.hasUnlocks(t)).map(s => AbilitySectionHelpers.getUnlocks(s)).forEach(unlocksList => {
                unlocksList.filter(u => u.type == "Summon").forEach(unlock => {
                    let oldAmount = unlocks.get(unlock.target) ?? 0;
                    unlocks.set(unlock.target, oldAmount + unlock.amount);
                });
            });
            return unlocks;
        }
        let maxSummonUnlocks = getMaxSummonUnlocks();
        let availableSummons = Registries.summons.getAll();
        function getRemainingSummonUnlocks(maxSummonUnlocks = null) {
            maxSummonUnlocks ??= getMaxSummonUnlocks();
            let remaining = new Map();
            for (let [category, maxAmount] of maxSummonUnlocks.entries()) {
                let hasAmount = chosenSummons.filter(s => AbilitySectionHelpers.getMainCategory(s) == category).length;
                remaining.set(category, clamp(maxAmount - hasAmount, 0, maxAmount));
            }
            return remaining;
        }
        let remainingSummonUnlocks = getRemainingSummonUnlocks();

        summonsContainer.appendChild(hb(4));
        summonsContainer.appendChild(fromHTML(`<h1>Available Summons`));
        let availableSummonsOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(availableSummons, SectionHelpers.MasonryType, { addSearch: true, variables });
        summonsContainer.appendChild(availableSummonsOverview.container);
        let noSummonsElement = fromHTML(`<div class="hide" placeholder="No more summons available...">`);
        summonsContainer.appendChild(noSummonsElement);

        function updateAvailableSummonsOverview(hasWeaponCore = null, remainingOtherTechniques = null, maxSummonUnlocks = null, remainingSummonUnlocks = null) {
            hasWeaponCore ??= getHasWeaponCore();
            remainingOtherTechniques ??= getRemainingOtherTechniques(hasWeaponCore);
            maxSummonUnlocks ??= getMaxSummonUnlocks();
            remainingSummonUnlocks ??= getRemainingSummonUnlocks();

            let somethingAvailable = false;
            for (let structuredSection of availableSummonsOverview.sections) {
                let element = structuredSection.wrapperElement;
                let summon = structuredSection.section;
                let isAvailable = true;
                if (chosenSummons.has(summon)) isAvailable = false;
                else if (character.settings.validate) {
                    let category = AbilitySectionHelpers.getMainCategory(summon);
                    if (!maxSummonUnlocks.has(category)) isAvailable = false;
                    else if (remainingOtherTechniques <= 0 && maxSummonUnlocks.get(category) <= 0) isAvailable = false;
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
            let isSummon = SummonHelpers.isSummon(techniqueLike);
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
            let isSummon = SummonHelpers.isSummon(techniqueLike);
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
            let mutations = getMutations();
            let remainingOtherTechniques = getRemainingOtherTechniques();
            let remainingFreeMutations = getRemainingFreeMutations(mutations);
            openMutationDialog(techniqueLike, mutations, remainingOtherTechniques, remainingFreeMutations)
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
            structuredSection.subSectionContainer.after(container);
        }

        for (let structuredSection of chosenOverview.sections) {
            addUnlearnButton(structuredSection);
        }

        for (let structuredSection of chosenSummonsOverview.sections) {
            addUnlearnButton(structuredSection);
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
            structuredSection.subSectionContainer.after(container);
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
            structuredSection.subSectionContainer.after(container);
        }

        function updateAll(hasWeaponCore = null, remainingOtherTechniques = null, mutations = null, maxSummonUnlocks = null, remainingSummonUnlocks = null, remainingFreeMutations = null) {
            hasWeaponCore ??= getHasWeaponCore();
            remainingOtherTechniques ??= getRemainingOtherTechniques(hasWeaponCore);
            mutations ??= getMutations();
            maxSummonUnlocks ??= getMaxSummonUnlocks();
            remainingFreeMutations ??= getRemainingFreeMutations(mutations);

            if (character.settings.validate) {
                let summonsWithoutUnlocks = chosenSummons.filter(s => !maxSummonUnlocks.has(AbilitySectionHelpers.getMainCategory(s)));
                if (summonsWithoutUnlocks.length != 0) {
                    summonsWithoutUnlocks.forEach(s => chosenSummons.unregister(s));
                    maxSummonUnlocks = getMaxSummonUnlocks();
                    remainingSummonUnlocks = getRemainingSummonUnlocks();
                }
            }

            remainingSummonUnlocks ??= getRemainingSummonUnlocks();

            updateDescription(hasWeaponCore, remainingOtherTechniques, mutations, remainingFreeMutations, maxSummonUnlocks, remainingSummonUnlocks);
            updateChosenOverview(hasWeaponCore, remainingOtherTechniques, mutations, remainingFreeMutations);
            updateAvailableOverview(hasWeaponCore, remainingOtherTechniques);
            if (maxSummonUnlocks.size != 0) {
                summonsContainer.classList.remove('hide');
                updateChosenSummonsOverview(hasWeaponCore, remainingOtherTechniques, mutations, remainingFreeMutations);
                updateAvailableSummonsOverview(hasWeaponCore, remainingOtherTechniques, maxSummonUnlocks, remainingSummonUnlocks);
            } else {
                summonsContainer.classList.add('hide');
            }
        }
        updateAll(hasWeaponCore, remainingOtherTechniques, chosenMutations, maxSummonUnlocks, remainingSummonUnlocks, remainingFreeMutations);

        return element;
    }

    static generatePathsPageHtml(character, page) {
        let variables = character.getVariables();
        let element = fromHTML(`<div class="characterCreator-page divList">`);
        element.appendChild(SectionHelpers.generateStructuredHtmlForSection(SectionHelpers.resolveSectionExpression('rules/Character Creation/Choose Path*noChildren'), { variables }).element);

        element.appendChild(hb(4));
        let chosenPathsBar = fromHTML(`<div class="listHorizontal gap-2">`);
        element.appendChild(chosenPathsBar);
        element.appendChild(hb(4));
        let unchosenPathsBar = fromHTML(`<div class="listHorizontal gap-2">`);
        element.appendChild(unchosenPathsBar);
        let paths = new Set(CategoryHelpers.getPathNames());
        let chosenPaths = character.paths; // Registry

        function choosePath(path) {
            if (chosenPaths.has(path)) return;
            chosenPaths.register(path);
            CharacterHelpers.saveCharacter(character);
            updatePaths();
        }

        function unchoosePath(path) {
            if (!chosenPaths.has(path)) return;
            chosenPaths.unregister(path);
            CharacterHelpers.saveCharacter(character);
            updatePaths();
        }

        function updatePaths() {
            chosenPathsBar.innerHTML = '';
            unchosenPathsBar.innerHTML = '';
            for (let path of paths) {
                let hasPath = chosenPaths.has(path);
                let element = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered hoverable">`);
                (hasPath ? chosenPathsBar : unchosenPathsBar).appendChild(element);
                if (hasPath) element.classList.add('brand-border-color');
                element.addEventListener('click', () => hasPath ? unchoosePath(path) : choosePath(path));
                let nameElement = fromHTML(`<div>`);
                element.appendChild(nameElement);
                nameElement.textContent = path;
                let icon = hasPath ? icons.close() : icons.add();
                element.appendChild(icon);
                icon.classList.add('minimalIcon');
            }
        }
        updatePaths();

        return element;
    }

    static generateMasteriesPageHtml(character, page) {
        let variables = character.getVariables();
        let element = fromHTML(`<div class="characterCreator-page divList">`);

        let chosenPaths = character.paths;
        if (chosenPaths.size == 0) {
            element.setAttribute('tooltip', "No path chosen...");
            return element;
        }

        let maxMasteries = character.getMaxMasteries(); // Can also be upgrades, or 2 for 1 path core
        let maxEvolutions = character.getMaxEvolutions();
        let maxAscendancies = character.getMaxAscendancies();
        let chosenMasteries = character.masteries;
        function getHasPathCore() {
            return chosenMasteries.some(t => AbilitySectionHelpers.isPathCore(t));
        }
        let hasPathCore = getHasPathCore();
        function getRemainingMasteries() {
            let upgrades = character.upgrades.size;
            let pathCores = chosenMasteries.filter(m => AbilitySectionHelpers.isPathCore(m)).length - 1;
            if (pathCores < 0) pathCores = 0;
            else pathCores -= 1; // If a path core exists, the cost of the first is removed
            return maxMasteries - chosenMasteries.size - upgrades - pathCores; // Path cores are subtracted to gain double effect, as they are also included in the masteries
        }
        let remainingMasteries = getRemainingMasteries();
        function getRemainingEvolutions() {
            return maxEvolutions - character.evolutions.size;
        }
        let remainingEvolutions = getRemainingEvolutions();
        function getRemainingAscendancies() {
            return maxAscendancies - character.ascendancies.size;
        }
        let remainingAscendancies = getRemainingAscendancies();

        element.appendChild(fromHTML(`<h1>Choose Masteries`));
        let descriptionElement = fromHTML(`<div>`);
        element.appendChild(descriptionElement);
        function updateDescription(hasPathCore = null, remainingMasteries = null, remainingEvolutions = null, remainingAscendancies = null) {
            hasPathCore ??= getHasPathCore();
            remainingMasteries ??= getRemainingMasteries();
            remainingEvolutions ??= getRemainingEvolutions();
            remainingAscendancies ??= getRemainingAscendancies();
            let other = '';
            if (maxEvolutions != 0) other += `, ${remainingEvolutions}/${maxEvolutions} evolutions`;
            if (maxAscendancies != 0) other += `, ${remainingAscendancies}/${maxAscendancies} ascendancies`;
            if (other.length != 0) other += ',';
            let structuredSection = SectionHelpers.generateStructuredHtmlForSection(new Section({
                content: `Choose ${hasPathCore ? 0 : 1}/1 path core${other} and ${remainingMasteries}/${maxMasteries} masteries.`
            }));
            descriptionElement.replaceWith(structuredSection.wrapperElement);
            descriptionElement = structuredSection.wrapperElement;
        }

        element.appendChild(hb(4));
        element.appendChild(fromHTML(`<h1>Learned Masteries`));
        let chosenOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(chosenMasteries.getAll().map(mastery => Registries.masteries.get(mastery) ?? mastery), SectionHelpers.MasonryType, { addSearch: true, variables });
        element.appendChild(chosenOverview.container);
        chosenOverview.listElement.setAttribute('placeholder', 'No masteries learned yet...');
        function updateChosenOverview(hasPathCore = null, remainingMasteries = null, remainingEvolutions = null, remainingAscendancies = null) {
            hasPathCore ??= getHasPathCore();
            remainingMasteries ??= getRemainingMasteries();
            remainingEvolutions ??= getRemainingEvolutions();
            remainingAscendancies ??= getRemainingAscendancies();

            for (let structuredSection of chosenOverview.sections) {
                let element = structuredSection.wrapperElement;
                let mastery = structuredSection.section;
                let splitMastery = character.splitMasteries.get(mastery);

                for (let structuredSubSection of structuredSection.subSections) {
                    let element = structuredSubSection.wrapperElement;
                    let subSection = structuredSubSection.section;
                    let isAvailable = true;

                    if (AbilitySectionHelpers.isUpgrade(subSection) && remainingMasteries <= 0) isAvailable = false;
                    else if (AbilitySectionHelpers.isEvolution(subSection) && remainingEvolutions <= 0) isAvailable = false;
                    else if (AbilitySectionHelpers.isAscendancy(subSection)) {
                        if (remainingAscendancies <= 0) isAvailable = false;
                        else if (splitMastery.upgrades.size < 2) isAvailable = false;
                    }

                    let isLearned = false;
                    let canLearn = false;
                    if (AbilitySectionHelpers.isUpgrade(subSection)) {
                        canLearn = true;
                        if (splitMastery.upgrades.has(subSection)) isLearned = true;
                    } else if (AbilitySectionHelpers.isEvolution(subSection)) {
                        canLearn = true;
                        if (splitMastery.evolutions.has(subSection)) isLearned = true;
                    } else if (AbilitySectionHelpers.isAscendancy(subSection)) {
                        canLearn = true;
                        if (splitMastery.ascendancies.has(subSection)) isLearned = true;
                    }

                    structuredSubSection.learnButtonContainer?.remove();
                    if (canLearn) {
                        if (isLearned) {
                            addUnlearnButton(structuredSubSection);
                        } else {
                            addLearnButton(structuredSubSection);
                        }
                    }

                    if (isAvailable || isLearned) {
                        structuredSubSection.learnButton?.removeAttribute('disabled');
                    }
                    else structuredSubSection.learnButton?.setAttribute('disabled', '');
                }
            }

            chosenOverview.listElement._masonry?.resize();
        }

        element.appendChild(hb(4));
        element.appendChild(fromHTML(`<h1>Available Masteries`));
        let availableMasteries = Registries.masteries.filter(t => chosenPaths.has(AbilitySectionHelpers.getMainCategory(t)));
        let availableOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(availableMasteries, SectionHelpers.MasonryType, { addSearch: true, variables });
        element.appendChild(availableOverview.container);
        let noMasteriesElement = fromHTML(`<div class="hide" placeholder="No more masteries available...">`);
        element.appendChild(noMasteriesElement);
        function updateAvailableOverview(hasPathCore = null, remainingMasteries = null) {
            hasPathCore ??= getHasPathCore();
            remainingMasteries ??= getRemainingMasteries();

            let somethingAvailable = false;
            for (let structuredSection of availableOverview.sections) {
                let element = structuredSection.wrapperElement;
                let mastery = structuredSection.section;
                let isAvailable = true;
                if (chosenMasteries.has(mastery)) isAvailable = false;
                else if (character.settings.validate) {
                    if (hasPathCore && remainingMasteries <= 0) isAvailable = false;
                    else if (hasPathCore && AbilitySectionHelpers.isPathCore(mastery) && remainingMasteries < 2) isAvailable = false;
                    else if (!hasPathCore && !AbilitySectionHelpers.isPathCore(mastery)) isAvailable = false;
                    else if (!CharacterCreatorHelpers.canConnectToAbility(chosenMasteries, mastery)) isAvailable = false;
                }

                if (isAvailable) {
                    somethingAvailable = true;
                    element.classList.remove('hide');
                }
                else element.classList.add('hide');
            }

            if (somethingAvailable) {
                noMasteriesElement.classList.add('hide');
                availableOverview.searchContainer.classList.remove('hide');
            }
            else {
                noMasteriesElement.classList.remove('hide');
                availableOverview.searchContainer.classList.add('hide');
            }

            availableOverview.listElement._masonry?.resize();
        }

        function learnMasteryLike(masteryLike, update = true) {
            if (AbilitySectionHelpers.isTopMastery(masteryLike)) learnTopMastery(masteryLike, update);
            else learnSubMastery(masteryLike, update);
        }

        function learnTopMastery(topMastery, update = true) {
            if (chosenMasteries.has(topMastery)) return;
            character.masteryManager.learn(topMastery);
            let structuredSection = chosenOverview.addSection(topMastery);
            addUnlearnButton(structuredSection);
            if (update) {
                updateAll();
                CharacterHelpers.saveCharacter(character);
            }
        }

        function learnSubMastery(subMastery, update = true) {
            character.masteryManager.learn(subMastery);
            if (update) {
                updateAll();
                CharacterHelpers.saveCharacter(character);
            }
        }

        function unlearnMasteryLike(masteryLike, update = true) {
            if (AbilitySectionHelpers.isTopMastery(masteryLike)) unlearnTopMastery(masteryLike, update);
            else unlearnSubMastery(masteryLike, update);
        }

        function unlearnTopMastery(topMastery, update = true) {
            if (!chosenMasteries.has(topMastery)) return;
            character.masteryManager.unlearn(topMastery);
            chosenOverview.removeSection(topMastery);
            if (character.settings.validate) {
                let repeat = update;
                while (repeat) {
                    repeat = false;
                    for (let mastery of chosenMasteries) {
                        if (!CharacterCreatorHelpers.canConnectToAbility(chosenMasteries, mastery)) {
                            unlearnTopMastery(mastery, false);
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

        function unlearnSubMastery(subMastery, update = true) {
            character.masteryManager.unlearn(subMastery);

            let splitMastery = character.splitMasteries.get(subMastery.parent);
            if (character.settings.validate) {
                if (AbilitySectionHelpers.isUpgrade(subMastery) && splitMastery.upgrades.size < 2) {
                    splitMastery.ascendancies.forEach(m => character.masteryManager.unlearn(m));
                }
            }
            if (update) {
                updateAll();
                CharacterHelpers.saveCharacter(character);
            }
        }

        for (let structuredSection of chosenOverview.sections) {
            addUnlearnButton(structuredSection);
        }

        function addUnlearnButton(structuredSection) {
            let mastery = structuredSection.section;

            let container = structuredSection.learnButtonContainer = fromHTML(`<div>`);
            container.appendChild(hb(2));
            let wrapper = fromHTML(`<div class="listHorizontal centerContentHorizontally">`);
            container.appendChild(wrapper);
            let button = structuredSection.learnButton = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered brand-border-color hoverable centerContentHorizontally">Unlearn`);
            wrapper.appendChild(button);
            if (AbilitySectionHelpers.isTopMastery(mastery)) {
                button.classList.add('w-100');
                if (character.settings.validate) button.setAttribute('tooltip', "Warning: If other masteries depend on this, you will unlearn them as well.");
            }
            else button.classList.add('w-80');
 
            button.addEventListener('click', () => unlearnMasteryLike(mastery));
            structuredSection.subSectionContainer.after(container);
        }

        for (let structuredSection of availableOverview.sections) {
            addLearnButton(structuredSection);
        }

        function addLearnButton(structuredSection) {
            let mastery = structuredSection.section;

            let container = structuredSection.learnButtonContainer = fromHTML(`<div>`);
            container.appendChild(hb(2));
            let wrapper = fromHTML(`<div class="listHorizontal centerContentHorizontally">`);
            container.appendChild(wrapper);
            let button = structuredSection.learnButton = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered brand-border-color hoverable centerContentHorizontally">Learn`);
            wrapper.appendChild(button);
            if (AbilitySectionHelpers.isTopMastery(mastery)) button.classList.add('w-100');
            else button.classList.add('w-80');
            button.addEventListener('click', () => learnMasteryLike(mastery));
            structuredSection.subSectionContainer.after(container);
        }

        function updateAll(hasPathCore = null, remainingMasteries = null, remainingEvolutions = null, remainingAscendancies = null) {
            hasPathCore ??= getHasPathCore();
            remainingMasteries ??= getRemainingMasteries();
            remainingEvolutions ??= getRemainingEvolutions();
            remainingAscendancies ??= getRemainingAscendancies();

            updateDescription(hasPathCore, remainingMasteries);
            updateChosenOverview(hasPathCore, remainingMasteries, remainingEvolutions, remainingAscendancies);
            updateAvailableOverview(hasPathCore, remainingMasteries);
        }
        updateAll(hasPathCore, remainingMasteries, remainingEvolutions, remainingAscendancies);

        return element;
    }

    static generateAttributesPageHtml(character, page) {
        let variables = character.getVariables();
        let element = fromHTML(`<div class="characterCreator-page divList">`);

        return element;
    }

    static generateFlavorPageHtml(character, page) {
        let variables = character.getVariables();
        let element = fromHTML(`<div class="characterCreator-page divList">`);

        return element;
    }

    static canConnectToAbility(targetRegistry, ability, techniqueRegistry = null) {
        if (AbilitySectionHelpers.isMutated(ability)) {
            let mutationInfo = AbilitySectionHelpers.getMutatedInfo(ability);
            if (!targetRegistry.has(mutationInfo.original) || !(techniqueRegistry ?? targetRegistry).has(mutationInfo.mutation)) return false;
            return true;
        }

        let connections = AbilitySectionHelpers.getConnections(ability);
        if (connections.has('Category')) return true;
        for (let connection of connections) {
            if (targetRegistry.has(connection)) return true;
        }
    }
}

class StructuredCharacterCreatorHtml {
    pagesContainer;
    pages;
    currentTab;

    constructor(character, element, settings = null) {
        settings ??= {};
        this.element = element;
        this.character = character;
        this.updateHash = settings.updateHash ?? false;

        element._character = character;
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