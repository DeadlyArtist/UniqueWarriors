class CharacterCreatorHelpers {
    static getSearchFilterKey(field) {
        return getPath() + "?id=" + getQueryVariable("id") + "#" + field;
    }

    static getAfterdragForCharacterRegistry(character, registry) {
        return (section, beforeSection) => {
            registry.unregister(section);
            registry.register(section, { insertBefore: beforeSection });
            CharacterHelpers.saveCharacter(character);
        }
    }

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
            { name: "Settings", provider: page => this.generateSettingsPageHtml(character, page, structuredCharacterCreator), },
            { name: "Weapons", provider: page => this.generateWeaponsPageHtml(character, page, structuredCharacterCreator), },
            { name: "Techniques", provider: page => this.generateTechniquesPageHtml(character, page, structuredCharacterCreator), },
            { name: "Path", provider: page => this.generatePathsPageHtml(character, page, structuredCharacterCreator), },
            { name: "Masteries", provider: page => this.generateMasteriesPageHtml(character, page, structuredCharacterCreator), },
            { name: "Attributes", provider: page => this.generateAttributesPageHtml(character, page, structuredCharacterCreator), },
            { name: "Skills", provider: page => this.generateSkillsPageHtml(character, page, structuredCharacterCreator), },
            { name: "Shop", provider: page => this.generateShopPageHtml(character, page, structuredCharacterCreator), },
            { name: "Flavor", provider: page => this.generateFlavorPageHtml(character, page, structuredCharacterCreator), },
        ];
        for (let page of pages) {
            let element = page.tabElement = fromHTML(`<button class="characterCreator-tab largeElement raised bordered-inset hoverable hideDisabled">`);
            tabBar.appendChild(element);
            element.textContent = page.name;
            element.addEventListener('click', () => structuredCharacterCreator.openPage(page));
        }
        let rightOfTopBar = fromHTML(`<div class="listHorizontal">`);
        topBar.appendChild(rightOfTopBar);
        let finishButton = fromHTML(`<button class="largeElement bordered hoverable noTextWrap" tooltip="Exit the character creator. You can return at any time to continue editing your character.">Finish`);
        rightOfTopBar.appendChild(finishButton);
        finishButton.addEventListener('click', () => CharacterHelpers.openCharacter(character));

        let pagesContainer = fromHTML(`<div class="divList" placeholder="Loading...">`);
        element.appendChild(pagesContainer);
        structuredCharacterCreator.pagesContainer = pagesContainer;

        structuredCharacterCreator.openTab(settings.startTab ?? pages[0]);

        return structuredCharacterCreator;
    }

    static generateSettingsPageHtml(character, page, structuredCharacterCreator) {
        let element = fromHTML(`<div class="characterCreator-page divList children-w-fit">`);

        element.appendChild(fromHTML(`<h1>Name`));
        let nameInputContainer = fromHTML(`<div class="listHorizontal gap-4">`);
        element.appendChild(nameInputContainer);
        let nameInput = fromHTML(`<input type="text" class="largeElement xl-font smallTextInput">`);
        nameInputContainer.appendChild(nameInput);
        nameInput.value = character.name;
        nameInput.addEventListener('input', () => {
            if (character.name == nameInput.value) return;
            character.name = nameInput.value;
            CharacterHelpers.saveCharacter(character);
            if (structuredCharacterCreator.updateTitle) App.setTitle(`Edit - ${character.name}`);
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
        validateInput.addEventListener('change', () => {
            if (character.settings.validate == validateInput.checked) return;
            character.settings.validate = validateInput.checked;
            CharacterHelpers.saveCharacter(character);
        });

        return element;
    }

    static generateWeaponsPageHtml(character, page, structuredCharacterCreator) {
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
            for (let weapon of chosenWeapons) {
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
            for (let weapon of weapons) {
                let hasWeapon = chosenWeapons.has(weapon);
                if (hasWeapon) continue;
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

    static generateTechniquesPageHtml(character, page, structuredCharacterCreator) {
        let variables = character.getVariables();
        let element = fromHTML(`<div class="characterCreator-page divList">`);

        let chosenWeapons = character.weapons;
        if (chosenWeapons.size == 0) {
            element.setAttribute('placeholder', "No weapons chosen...");
            return element;
        }

        let maxTechniques = character.getMaxTechniques(); // one of which is a weapon core technique
        let maxOtherTechniques = this.getMaxOtherTechniques(character, {maxTechniques});
        let chosenTechniques = character.techniques;
        let chosenSummons = character.summons;

        function getMaxSummonUnlocks() {
            return CharacterCreatorHelpers.getMaxSummonUnlocks(character);
        }
        let maxSummonUnlocks = getMaxSummonUnlocks();
        let availableSummons = Registries.summons.getAll();
        function getRemainingSummonUnlocks() {
            return CharacterCreatorHelpers.getRemainingSummonUnlocks(character, {maxSummonUnlocks});
        }
        let remainingSummonUnlocks = getRemainingSummonUnlocks();
        function getMutations() {
            return CharacterCreatorHelpers.getMutations(character);
        }
        let chosenMutations = getMutations();
        function getRemainingFreeMutations() {
            return CharacterCreatorHelpers.getRemainingFreeMutations(character, { chosenMutations });
        }
        let remainingFreeMutations = getRemainingFreeMutations();
        function getHasMutation() {
            return CharacterCreatorHelpers.getHasMutation(character);
        }
        let hasMutation = getHasMutation();
        function getHasWeaponCore() {
            return CharacterCreatorHelpers.getHasWeaponCore(character);
        }
        let hasWeaponCore = getHasWeaponCore();
        function getRemainingOtherTechniques() {
            return CharacterCreatorHelpers.getRemainingOtherTechniques(character, { hasWeaponCore, hasMutation, maxTechniques, maxOtherTechniques, maxSummonUnlocks, chosenMutations, remainingFreeMutations });
        }
        let remainingOtherTechniques = getRemainingOtherTechniques();

        function getAllowedMutations(techniqueLike) {
            return CharacterCreatorHelpers.getAllowedMutations(character, techniqueLike, { hasWeaponCore, hasMutation, maxTechniques, maxSummonUnlocks, chosenMutations, remainingFreeMutations, remainingOtherTechniques });
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
            let dialogNameInput = dialog.dialogNameInput = fromHTML(`<input type="text" class="largeElement" placeholder="Enter ability name..." style="width: 400px;">`);
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
        element.addEventListener('removed', () => mutationDialog.container.remove());

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

        let editMutatedDialog = DialogHelpers.create(dialog => {
            let dialogElement = fromHTML(`<div class="divList">`);
            let dialogTitleElement = dialog.dialogTitleElement = fromHTML(`<h1>`);
            dialogElement.appendChild(dialogTitleElement);

            let dialogNameContainer = fromHTML(`<div class="listHorizontal">`);
            dialogElement.appendChild(dialogNameContainer);
            dialogNameContainer.appendChild(fromHTML(`<div>Name:`));
            let dialogNameInput = dialog.dialogNameInput = fromHTML(`<input type="text" class="largeElement" placeholder="Enter ability name..." style="width: 400px;">`);
            dialogNameContainer.appendChild(dialogNameInput);

            dialogElement.appendChild(hb(4));
            let dialogMutationPreviewContainer = dialog.dialogMutationPreviewContainer = fromHTML(`<div class="w-100">`);
            dialogElement.appendChild(dialogMutationPreviewContainer);

            dialogElement.appendChild(hb(6));
            let dialogButtonList = fromHTML(`<div class="listHorizontal">`);
            dialogElement.appendChild(dialogButtonList);
            let dialogFinishButton = fromHTML(`<button class="largeElement bordered hoverable flexFill w-100">Finish`);
            dialogButtonList.appendChild(dialogFinishButton);
            dialog.addCloseButton(dialogFinishButton);

            dialogNameInput.addEventListener('input', () => {
                let value = dialogNameInput.value;
                if (!value) value = dialog._structuredSection.section.title;
                dialog._structuredSection.titleElement.textContent = value;
                dialog._structuredSection.section.title = value;
                chosenOverview.sections.get(dialog._section).titleElement.textContent = value;
                CharacterHelpers.saveCharacter(character);
            });

            dialog.onSectionChange = () => {
                let section = dialog._section;
                dialogTitleElement.textContent = `Edit: ${section.title}`;
                let structuredSection = dialog._structuredSection = SectionHelpers.generateStructuredHtmlForSection(section, { variables });
                dialogNameInput.value = section.title;
                dialogMutationPreviewContainer.innerHTML = "";
                dialogMutationPreviewContainer.appendChild(structuredSection.wrapperElement);
            }

            dialog.closeOnOverlayClick = true;

            return dialogElement;
        });
        element.addEventListener('removed', () => editMutatedDialog.container.remove());

        function openEditMutatedDialog(techniqueLike) {
            editMutatedDialog._section = techniqueLike;

            editMutatedDialog.onSectionChange();
            editMutatedDialog.open();
        }

        element.appendChild(fromHTML(`<h1>Choose Techniques`));
        let descriptionElement = fromHTML(`<div>`);
        element.appendChild(descriptionElement);
        function updateDescription() {
            let other = '';
            let canHaveFreeMutation = character.canHaveFreeMutation();
            if (canHaveFreeMutation || hasMutation) other += `, ${(hasMutation ? 0 : 1) - (canHaveFreeMutation ? 0 : 1)}/${canHaveFreeMutation ? 1 : 0} mutation`;
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
        let chosenOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(chosenTechniques.getAll(), SectionHelpers.MasonryType, { addSearch: true, filterKey: this.getSearchFilterKey('learned_techniques'), variables, draggable: true, afterdrag: this.getAfterdragForCharacterRegistry(character, chosenTechniques), });
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
        let availableOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(availableTechniques, SectionHelpers.MasonryType, { addSearch: true, filterKey: this.getSearchFilterKey('available_techniques'), variables });
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
                    if (remainingOtherTechniques <= 0 &&
                        (hasWeaponCore || !AbilitySectionHelpers.isWeaponCore(technique)) &&
                        (hasMutation || !AbilitySectionHelpers.isMutation(technique))) isAvailable = false;
                    else if (!character.canHaveFreeMutation() && AbilitySectionHelpers.isMutation(technique)) isAvailable = false;
                    else if (!CharacterCreatorHelpers.canConnectToAbility(chosenTechniques, technique, chosenTechniques)) isAvailable = false;
                }

                if (isAvailable) {
                    somethingAvailable = true;
                    element.classList.remove('hide');
                } else {
                    element.classList.add('hide');
                }
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

        element.appendChild(hb(4));
        element.appendChild(fromHTML(`<h1>Unavailable Techniques`));
        let unavailableOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(availableTechniques, SectionHelpers.MasonryType, { addSearch: true, filterKey: this.getSearchFilterKey('unavailable_techniques'), variables });
        element.appendChild(unavailableOverview.container);
        let noRemainingTechniquesElement = fromHTML(`<div class="hide" placeholder="No more techniques remaining...">`);
        element.appendChild(noRemainingTechniquesElement);
        function updateUnavailableOverview() {
            let somethingAvailable = false;
            for (let structuredSection of unavailableOverview.sections) {
                let element = structuredSection.wrapperElement;
                let technique = structuredSection.section;
                let isAvailable = true;
                if (character.settings.validate) {
                    if (remainingOtherTechniques <= 0 &&
                        (hasWeaponCore || !AbilitySectionHelpers.isWeaponCore(technique)) &&
                        (hasMutation || !AbilitySectionHelpers.isMutation(technique))) isAvailable = false;
                    else if (!character.canHaveFreeMutation() && AbilitySectionHelpers.isMutation(technique)) isAvailable = false;
                    else if (!CharacterCreatorHelpers.canConnectToAbility(chosenTechniques, technique, chosenTechniques)) isAvailable = false;
                }
                let isUnavailable = !isAvailable && !chosenTechniques.has(technique);

                if (isUnavailable) {
                    somethingAvailable = true;
                    element.classList.remove('hide');
                } else {
                    element.classList.add('hide');
                }
            }

            if (somethingAvailable) {
                noRemainingTechniquesElement.classList.add('hide');
                unavailableOverview.searchContainer.classList.remove('hide');
            }
            else {
                noRemainingTechniquesElement.classList.remove('hide');
                unavailableOverview.searchContainer.classList.add('hide');
            }

            unavailableOverview.listElement._masonry?.resize();
        }


        let summonsContainer = fromHTML(`<div class="w-100">`);
        element.appendChild(summonsContainer);
        summonsContainer.appendChild(hb(4));
        summonsContainer.appendChild(fromHTML(`<h1>Learned Summons`));
        let chosenSummonsOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(chosenSummons.getAll(), SectionHelpers.MasonryType, { addSearch: true, filterKey: this.getSearchFilterKey('learned_summons'), variables, draggable: true, afterdrag: this.getAfterdragForCharacterRegistry(character, chosenSummons) });
        summonsContainer.appendChild(chosenSummonsOverview.container);
        chosenSummonsOverview.listElement.setAttribute('placeholder', 'No summons learned yet...');

        function updateChosenSummonsOverview() {
            let maxVariantsPerSummon = 3;
            let remainingVariantsByOriginal = new Map();
            chosenSummons.filter(s => AbilitySectionHelpers.isVariant(s)).forEach(summon => {
                let original = SummonHelpers.getVariantOriginal(character, summon);
                remainingVariantsByOriginal.set(original, (remainingVariantsByOriginal.get(original) ?? maxVariantsPerSummon) - 1);
            });
            for (let structuredSection of chosenSummonsOverview.sections) {
                let element = structuredSection.wrapperElement;
                let summon = structuredSection.section;
                if (!AbilitySectionHelpers.isVariant(summon)) {
                    let remainingVariants = remainingVariantsByOriginal.get(summon) ?? maxVariantsPerSummon;
                    if (remainingVariants > 0) {
                        if (!structuredSection.variantButton) {
                            addVariantButton(structuredSection);
                        }
                    } else {
                        if (structuredSection.variantButton) {
                            structuredSection.variantButtonContainer.remove();
                            structuredSection.variantButton = null;
                        }
                    }
                }
            }
            chosenSummonsOverview.listElement._masonry?.resize();
        }

        summonsContainer.appendChild(hb(4));
        summonsContainer.appendChild(fromHTML(`<h1>Available Summons`));
        let availableSummonsOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(availableSummons, SectionHelpers.MasonryType, { addSearch: true, filterKey: this.getSearchFilterKey('available_summons'), variables });
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

        summonsContainer.appendChild(hb(4));
        summonsContainer.appendChild(fromHTML(`<h1>Unavailable Summons`));
        let unavailableSummonsOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(availableSummons, SectionHelpers.MasonryType, { addSearch: true, filterKey: this.getSearchFilterKey('unavailable_summons'), variables });
        summonsContainer.appendChild(unavailableSummonsOverview.container);
        let noRemainingSummonsElement = fromHTML(`<div class="hide" placeholder="No more summons remaining...">`);
        summonsContainer.appendChild(noRemainingSummonsElement);

        function updateUnavailableSummonsOverview() {
            let somethingAvailable = false;
            for (let structuredSection of unavailableSummonsOverview.sections) {
                let element = structuredSection.wrapperElement;
                let summon = structuredSection.section;
                let isAvailable = true;
                if (character.settings.validate) {
                    let category = AbilitySectionHelpers.getMainCategory(summon);
                    if (!maxSummonUnlocks.has(category)) isAvailable = false;
                    else if (remainingOtherTechniques <= 0 && remainingSummonUnlocks.get(category) <= 0) isAvailable = false;
                    else if (!CharacterCreatorHelpers.canConnectToAbility(chosenSummons, summon, chosenTechniques)) isAvailable = false;
                }
                let isUnavailable = !isAvailable && !chosenSummons.has(summon);
                if (character.settings.validate) {
                    let category = AbilitySectionHelpers.getMainCategory(summon);
                    if (!maxSummonUnlocks.has(category)) isUnavailable = false;
                }

                if (isUnavailable) {
                    somethingAvailable = true;
                    element.classList.remove('hide');
                }
                else element.classList.add('hide');
            }

            if (somethingAvailable) {
                noRemainingSummonsElement.classList.add('hide');
                unavailableSummonsOverview.searchContainer.classList.remove('hide');
            }
            else {
                noRemainingSummonsElement.classList.remove('hide');
                unavailableSummonsOverview.searchContainer.classList.add('hide');
            }

            unavailableSummonsOverview.listElement._masonry?.resize();
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
            if (isSummon) {
                if (AbilitySectionHelpers.isVariant(structuredSection.section)) addEditVariantButton(structuredSection);
            } else {
                if (AbilitySectionHelpers.isMutated(structuredSection.section)) addEditMutatedButton(structuredSection);
            }

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

        function mutate(technique) {
            openMutationDialog(technique)
        }

        function editMutated(technique) {
            openEditMutatedDialog(technique)
        }

        function createVariant(summon) {
            let variant = SectionHelpers.getVariant(summon);
            variant.id = generateUniqueId();
            learn(variant);
            SummonHelpers.openSummonEditor(character, variant);
        }

        function editVariant(summon) {
            SummonHelpers.openSummonEditor(character, summon);
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

        function addMutateButton(structuredSection) {
            let technique = structuredSection.section;
            let container = structuredSection.mutateButtonContainer = fromHTML(`<div>`);
            container.appendChild(hb(2));
            let wrapper = fromHTML(`<div class="listHorizontal centerContentHorizontally">`);
            container.appendChild(wrapper);
            let button = structuredSection.mutateButton = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered brand-border-color hoverable centerContentHorizontally w-100">Mutate`);
            wrapper.appendChild(button);
            button.addEventListener('click', () => mutate(technique));
            structuredSection.learnButtonContainer.before(container);
        }

        function addEditMutatedButton(structuredSection) {
            let summon = structuredSection.section;
            let container = structuredSection.editButtonContainer = fromHTML(`<div>`);
            container.appendChild(hb(2));
            let wrapper = fromHTML(`<div class="listHorizontal centerContentHorizontally">`);
            container.appendChild(wrapper);
            let button = structuredSection.editButton = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered brand-border-color hoverable centerContentHorizontally w-100">Edit`);
            wrapper.appendChild(button);
            button.addEventListener('click', () => editMutated(summon));
            structuredSection.learnButtonContainer.before(container);
        }

        function addVariantButton(structuredSection) {
            let summon = structuredSection.section;
            let container = structuredSection.variantButtonContainer = fromHTML(`<div>`);
            container.appendChild(hb(2));
            let wrapper = fromHTML(`<div class="listHorizontal centerContentHorizontally">`);
            container.appendChild(wrapper);
            let button = structuredSection.variantButton = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered brand-border-color hoverable centerContentHorizontally w-100">Create Variant`);
            wrapper.appendChild(button);
            button.addEventListener('click', () => createVariant(summon));
            structuredSection.learnButtonContainer.before(container);
        }

        function addEditVariantButton(structuredSection) {
            let summon = structuredSection.section;
            let container = structuredSection.editButtonContainer = fromHTML(`<div>`);
            container.appendChild(hb(2));
            let wrapper = fromHTML(`<div class="listHorizontal centerContentHorizontally">`);
            container.appendChild(wrapper);
            let button = structuredSection.editButton = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered brand-border-color hoverable centerContentHorizontally w-100">Edit`);
            wrapper.appendChild(button);
            button.addEventListener('click', () => editVariant(summon));
            structuredSection.learnButtonContainer.before(container);
        }

        for (let structuredSection of chosenOverview.sections) {
            addUnlearnButton(structuredSection);
            if (AbilitySectionHelpers.isMutated(structuredSection.section)) addEditMutatedButton(structuredSection);
        }

        for (let structuredSection of chosenSummonsOverview.sections) {
            addUnlearnButton(structuredSection);
            if (AbilitySectionHelpers.isVariant(structuredSection.section)) addEditVariantButton(structuredSection);
        }

        for (let structuredSection of availableOverview.sections) {
            addLearnButton(structuredSection);
        }

        for (let structuredSection of availableSummonsOverview.sections) {
            addLearnButton(structuredSection);
        }

        function refreshData() {
            hasWeaponCore = getHasWeaponCore();
            hasMutation = getHasMutation();
            chosenMutations = getMutations();
            remainingFreeMutations = getRemainingFreeMutations();
            maxSummonUnlocks = getMaxSummonUnlocks();

            let summonsWithoutUnlocks = chosenSummons.filter(s => !maxSummonUnlocks.has(AbilitySectionHelpers.getMainCategory(s)));
            if (summonsWithoutUnlocks.length != 0) {
                summonsWithoutUnlocks.forEach(s => chosenSummons.unregister(s));
            }

            remainingSummonUnlocks = getRemainingSummonUnlocks();
            remainingOtherTechniques = getRemainingOtherTechniques();
        }

        function updateAll(refresh = true) {
            if (refresh) refreshData();

            updateDescription();
            updateChosenOverview();
            updateAvailableOverview();
            updateUnavailableOverview();
            if (maxSummonUnlocks.size != 0) {
                summonsContainer.classList.remove('hide');
                updateChosenSummonsOverview();
                updateAvailableSummonsOverview();
                updateUnavailableSummonsOverview();
            } else {
                summonsContainer.classList.add('hide');
            }
        }
        updateAll(false);

        return element;
    }

    static generatePathsPageHtml(character, page, structuredCharacterCreator) {
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
            for (let path of chosenPaths) {
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
            for (let path of paths) {
                let hasPath = chosenPaths.has(path);
                if (hasPath) continue;
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

    static generateMasteriesPageHtml(character, page, structuredCharacterCreator) {
        let variables = character.getVariables();
        let element = fromHTML(`<div class="characterCreator-page divList">`);

        let chosenPaths = character.paths;
        if (chosenPaths.size == 0) {
            element.setAttribute('placeholder', "No path chosen...");
            return element;
        }

        let maxMasteries = character.getMaxMasteries(); // Can also be upgrades, or 2 for 1 path core
        let maxEvolutions = character.getMaxEvolutions();
        let maxAscendancies = character.getMaxAscendancies();
        let chosenMasteries = character.masteries;
        function getHasPathCore() {
            return CharacterCreatorHelpers.getHasPathCore(character);
        }
        let hasPathCore = getHasPathCore();
        function getRemainingMasteries() {
            return CharacterCreatorHelpers.getRemainingMasteries(character, {maxMasteries});
        }
        let remainingMasteries = getRemainingMasteries();
        function getRemainingEvolutions() {
            return CharacterCreatorHelpers.getRemainingEvolutions(character, {maxEvolutions});
        }
        let remainingEvolutions = getRemainingEvolutions();
        function getRemainingAscendancies() {
            return CharacterCreatorHelpers.getRemainingAscendancies(character, { maxAscendancies });
        }
        let remainingAscendancies = getRemainingAscendancies();

        element.appendChild(fromHTML(`<h1>Choose Masteries`));
        let descriptionElement = fromHTML(`<div>`);
        element.appendChild(descriptionElement);
        function updateDescription() {
            let other = '';
            if (maxEvolutions != 0 || remainingEvolutions < 0) other += `, ${remainingEvolutions}/${maxEvolutions} evolutions`;
            if (maxAscendancies != 0 || remainingAscendancies < 0) other += `, ${remainingAscendancies}/${maxAscendancies} ascendancies`;
            if (other.length != 0) other += ',';
            let structuredSection = SectionHelpers.generateStructuredHtmlForSection(new Section({
                content: `Choose ${hasPathCore ? 0 : 1}/1 path core${other} and ${remainingMasteries}/${maxMasteries} masteries.`
            }));
            descriptionElement.replaceWith(structuredSection.wrapperElement);
            descriptionElement = structuredSection.wrapperElement;
        }

        element.appendChild(hb(4));
        element.appendChild(fromHTML(`<h1>Learned Masteries`));
        let chosenOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(chosenMasteries.getAll().map(mastery => Registries.masteries.get(mastery) ?? mastery), SectionHelpers.MasonryType, { addSearch: true, filterKey: this.getSearchFilterKey('learned_masteries'), variables, draggable: true, afterdrag: this.getAfterdragForCharacterRegistry(character, chosenMasteries) });
        element.appendChild(chosenOverview.container);
        chosenOverview.listElement.setAttribute('placeholder', 'No masteries learned yet...');
        function updateChosenOverview() {
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
        let availableOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(availableMasteries, SectionHelpers.MasonryType, { addSearch: true, filterKey: this.getSearchFilterKey('available_masteries'), variables });
        element.appendChild(availableOverview.container);
        let noMasteriesElement = fromHTML(`<div class="hide" placeholder="No more masteries available...">`);
        element.appendChild(noMasteriesElement);
        function updateAvailableOverview() {
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


        element.appendChild(hb(4));
        element.appendChild(fromHTML(`<h1>Unavailable Masteries`));
        let unavailableOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(availableMasteries, SectionHelpers.MasonryType, { addSearch: true, filterKey: this.getSearchFilterKey('unavailable_masteries'), variables });
        element.appendChild(unavailableOverview.container);
        let noRemainingMasteriesElement = fromHTML(`<div class="hide" placeholder="No more masteries remaining...">`);
        element.appendChild(noRemainingMasteriesElement);
        function updateUnavailableOverview() {
            let somethingAvailable = false;
            for (let structuredSection of unavailableOverview.sections) {
                let element = structuredSection.wrapperElement;
                let mastery = structuredSection.section;
                let isAvailable = true;
                if (character.settings.validate) {
                    if (hasPathCore && remainingMasteries <= 0) isAvailable = false;
                    else if (hasPathCore && AbilitySectionHelpers.isPathCore(mastery) && remainingMasteries < 2) isAvailable = false;
                    else if (!hasPathCore && !AbilitySectionHelpers.isPathCore(mastery)) isAvailable = false;
                    else if (!CharacterCreatorHelpers.canConnectToAbility(chosenMasteries, mastery)) isAvailable = false;
                }
                let isUnavailable = !isAvailable && !chosenMasteries.has(mastery);

                if (isUnavailable) {
                    somethingAvailable = true;
                    element.classList.remove('hide');
                }
                else element.classList.add('hide');
            }

            if (somethingAvailable) {
                noRemainingMasteriesElement.classList.add('hide');
                unavailableOverview.searchContainer.classList.remove('hide');
            }
            else {
                noRemainingMasteriesElement.classList.remove('hide');
                unavailableOverview.searchContainer.classList.add('hide');
            }

            unavailableOverview.listElement._masonry?.resize();
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
            structuredSection.element.appendChild(container);
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
            structuredSection.element.appendChild(container);
        }

        function refreshData() {
            hasPathCore = getHasPathCore();
            remainingMasteries = getRemainingMasteries();
            remainingEvolutions = getRemainingEvolutions();
            remainingAscendancies = getRemainingAscendancies();
        }

        function updateAll(refresh = true) {
            if (refresh) refreshData();

            updateDescription();
            updateChosenOverview();
            updateAvailableOverview();
            updateUnavailableOverview();
        }
        updateAll(false);

        return element;
    }

    static generateAttributesPageHtml(character, page, structuredCharacterCreator) {
        let variables = character.getVariables();
        let element = fromHTML(`<div class="characterCreator-page divList">`);
        let attributes = character.attributes;

        element.appendChild(fromHTML(`<h1>Distribute Attribute Increases`));
        let descriptionContainer = fromHTML(`<div>`);
        element.appendChild(descriptionContainer);
        function updateDescription() {
            let scalingStats = character.getScalingStats();
            let attributeIncreases = scalingStats.attributeIncreases;
            let attributeMaximum = scalingStats.attributeMaximum;
            let attributeBoosts = scalingStats.attributeBoosts;
            let { remainingAttributeIncreases, remainingAttributeBoosts } = character.getRemainingAttributeIncreasesAndBoosts();

            let content = `Distribute ${remainingAttributeIncreases}/${attributeIncreases} attribute increases up to a maximum of ${attributeMaximum} each.`;
            if (attributeBoosts > 0) content += ` Additionally, distribute ${remainingAttributeBoosts}/${attributeBoosts} attribute boosts to go beyond the maximum.`;
            let structuredSection = SectionHelpers.generateStructuredHtmlForSection(new Section({
                content,
            }));

            descriptionContainer.innerHTML = "";
            descriptionContainer.appendChild(structuredSection.wrapperElement);
        }

        element.appendChild(hb(4));
        let attributesContainer = fromHTML(`<div class="characterCreator-attributes listHorizontal gap-2">`);
        element.appendChild(attributesContainer);

        element.appendChild(hb(6));
        element.appendChild(fromHTML(`<h1>View Stats`));
        let statsContainer = fromHTML(`<div>`);
        element.appendChild(statsContainer);

        function updateStats() {
            statsContainer.innerHTML = "";
            statsContainer.appendChild(CharacterHelpers.generateStatsHtml(character, {keepEnergy: true}));
        }

        function updateAll() {
            updateStats();
            updateDescription();
        }

        for (let name of Object.keys(attributes)) {
            let attributeElement = fromHTML(`<div class="character-attribute divList bordered rounded-xl">`);
            attributesContainer.appendChild(attributeElement);
            let attributeNameElement = fromHTML(`<div class="character-attribute-name mediumElement">`);
            attributeElement.appendChild(attributeNameElement);
            attributeNameElement.textContent = CharacterHelpers.getStatName(name);
            attributeElement.appendChild(hr());
            let attributeValueElement = fromHTML(`<div class="character-attribute-value largeElement">`); /*listHorizontal centerContentHorizontally*/
            attributeElement.appendChild(attributeValueElement);
            let attributeInputElement = fromHTML(`<input type="number" class="mediumElement rounded">`);
            attributeValueElement.appendChild(attributeInputElement);
            attributeInputElement.value = character.attributes[name]
            attributeInputElement.addEventListener('input', () => {
                if (attributeInputElement.value == '') return;
                let oldValue = character.attributes[name];
                let newValue = InputHelpers.fixNumberInput(attributeInputElement);

                let scalingStats = character.getScalingStats();
                let { remainingAttributeIncreases, remainingAttributeBoosts } = character.getRemainingAttributeIncreasesAndBoosts();
                let attributeMaximum = scalingStats.attributeMaximum;
                let difference = Math.min(newValue - oldValue, remainingAttributeIncreases + remainingAttributeBoosts);
                if (character.settings.validate) newValue = InputHelpers.constrainInput(attributeInputElement, value => clamp(oldValue + difference, 0, Math.max(oldValue, attributeMaximum) + remainingAttributeBoosts));
                if (oldValue == newValue) return;
                character.attributes[name] = newValue;
                CharacterHelpers.saveCharacter(character);
                updateAll();
            });
            attributeInputElement.addEventListener('focusout', () => {
                if (attributeInputElement.value == '') attributeInputElement.value = character.attributes[name];
            });
        }

        updateAll();

        return element;
    }

    static generateSkillsPageHtml(character, page, structuredCharacterCreator) {
        let variables = character.getVariables();
        let element = fromHTML(`<div class="characterCreator-page divList">`);

        element.appendChild(fromHTML(`<h1>Distribute Skill Increases`));
        let descriptionContainer = fromHTML(`<div class="sticky">`);
        element.appendChild(descriptionContainer);
        function updateDescription() {
            let scalingStats = character.getScalingStats();
            let skillIncreases = scalingStats.skillIncreases;
            let skillMaximum = scalingStats.skillMaximum;
            let remainingSkillIncreases = character.getRemainingSkillIncreases();

            let content = `Distribute ${remainingSkillIncreases}/${skillIncreases} skill increases up to a maximum of ${skillMaximum} each.`;
            let structuredSection = SectionHelpers.generateStructuredHtmlForSection(new Section({
                content,
            }));

            descriptionContainer.innerHTML = "";
            descriptionContainer.appendChild(structuredSection.wrapperElement);
        }
        updateDescription();

        element.appendChild(hb(4));
        let skillFieldsContainer = fromHTML(`<div class="characterCreator-skillFields divList gap-8 markTooltips">`);
        element.appendChild(skillFieldsContainer);

        let updateFunctions = [];

        let fields = CharacterHelpers.getSkillFieldNames();
        for (let field of fields) {
            let branches = CharacterHelpers.getSkillBranchNamesByField(field);
            let baseFieldLevel = character.getBaseSkillFieldLevel(field);


            let skillFieldContainer = fromHTML(`<div class="characterCreator-skillField-container divList gap-2">`);
            skillFieldsContainer.appendChild(skillFieldContainer);
            skillFieldContainer._skillField = field;

            let fieldElement = fromHTML(`<div class="characterCreator-skillField listHorizontal gap-4">`);
            skillFieldContainer.appendChild(fieldElement);
            let fieldNameElement = fromHTML(`<h1 class="characterCreator-skillField-name">`);
            fieldElement.appendChild(fieldNameElement);
            fieldNameElement.textContent = field;
            let fieldValueElement = fromHTML(`<div class="characterCreator-skillField-value">`);
            fieldElement.appendChild(fieldValueElement);
            function updateFieldValue() {
                baseFieldLevel = character.getBaseSkillFieldLevel(field);
                fieldValueElement.textContent = baseFieldLevel;
            }
            updateFieldValue();
            updateFunctions.push(updateFieldValue);

            let branchesContainer = fromHTML(`<div class="characterCreator-branches-container divList gap-2">`);
            skillFieldContainer.appendChild(branchesContainer);

            for (let branch of branches) {
                let skills = CharacterHelpers.getSkillNamesByBranch(branch);
                let baseBranchLevel = character.getBaseSkillBranchLevel(branch);
                let branchLevel = character.getSkillBranchLevel(branch);

                let skillBranchContainer = fromHTML(`<div class="characterCreator-skillBranch-container divList gap-2">`);
                branchesContainer.appendChild(skillBranchContainer);
                skillBranchContainer._skillBranch = branch;

                let branchElement = fromHTML(`<div class="characterCreator-skillBranch listHorizontal gap-4">`);
                skillBranchContainer.appendChild(branchElement);
                let branchNameElement = fromHTML(`<h2 class="characterCreator-skillBranch-name">`);
                branchElement.appendChild(branchNameElement);
                branchNameElement.textContent = branch;
                let branchValueElement = fromHTML(`<div class="characterCreator-skillBranch-value">`);
                branchElement.appendChild(branchValueElement);
                function updateBranchValue() {
                    baseBranchLevel = character.getBaseSkillBranchLevel(branch);
                    branchLevel = character.getSkillBranchLevel(branch);
                    branchValueElement.textContent = `${baseBranchLevel} | ${branchLevel}`;
                }
                updateBranchValue();
                updateFunctions.push(updateBranchValue);

                let skillsContainer = fromHTML(`<div class="characterCreator-skills-container listHorizontal gap-2">`);
                skillBranchContainer.appendChild(skillsContainer);

                for (let skill of skills) {
                    let baseSkillLevel = character.getBaseSkillLevel(skill);
                    let skillLevel = character.getSkillLevel(skill);
                    let description = Registries.skills.get(skill).content;

                    let skillElement = fromHTML(`<div class="character-skill divList bordered rounded-xl">`);
                    skillsContainer.appendChild(skillElement);
                    skillElement._skill = skill;

                    let skillNameElement = fromHTML(`<div class="character-skill-name mediumElement">`);
                    skillNameElement.setAttribute('tooltip', description);
                    skillElement.appendChild(skillNameElement);
                    skillNameElement.textContent = skill;
                    skillElement.appendChild(hr());
                    let skillValueElement = fromHTML(`<div class="character-skill-value largeElement listHorizontal gap-2">`);
                    skillElement.appendChild(skillValueElement);
                    let skillInputElement = fromHTML(`<input type="number" class="character-skill-base-value mediumElement rounded">`);
                    skillValueElement.appendChild(skillInputElement);
                    let skillTotalValueElement = fromHTML(`<div class="character-skill-total-value largeElement">`);
                    skillValueElement.appendChild(skillTotalValueElement);

                    function updateSkillValue() {
                        skillLevel = character.getSkillLevel(skill);
                        skillTotalValueElement.textContent = skillLevel;
                    }
                    updateSkillValue();
                    updateFunctions.push(updateSkillValue);

                    skillInputElement.value = baseSkillLevel;
                    skillInputElement.addEventListener('input', () => {
                        if (skillInputElement.value == '') return;
                        let oldValue = baseSkillLevel;
                        let newValue = InputHelpers.fixNumberInput(skillInputElement);

                        let scalingStats = character.getScalingStats();
                        let remainingSkillIncreases = character.getRemainingSkillIncreases();
                        let skillMaximum = scalingStats.skillMaximum;
                        let difference = Math.min(newValue - oldValue, remainingSkillIncreases);
                        if (character.settings.validate) newValue = InputHelpers.constrainInput(skillInputElement, value => clamp(oldValue + difference, 0, skillMaximum));
                        if (oldValue == newValue) return;

                        baseSkillLevel = newValue;
                        character.setBaseSkillLevel(skill, newValue);
                        CharacterHelpers.saveCharacter(character);
                        updateAll();
                    });
                    skillInputElement.addEventListener('focusout', () => {
                        if (skillInputElement.value == '') skillInputElement.value = baseSkillLevel;
                    });
                }
            }
        }

        function updateAll() {
            updateFunctions.forEach(f => f());
            updateDescription();
        }

        return element;
    }

    static generateShopPageHtml(character, page, structuredCharacterCreator) {
        let variables = character.getVariables();
        let element = fromHTML(`<div class="characterCreator-page divList">`);

        let chosenItems = character.items;

        element.appendChild(fromHTML(`<h1>Buy Items`));
        let descriptionElement = fromHTML(`<div>`);
        element.appendChild(descriptionElement);

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
        function updateDescription() {
            moneyInput.value = character.money;
        }

        let itemDialog = DialogHelpers.create(dialog => {
            let dialogElement = fromHTML(`<div class="divList">`);
            let dialogTitleElement = dialog.dialogTitleElement = fromHTML(`<h1>`);
            dialogElement.appendChild(dialogTitleElement);

            //dialogElement.appendChild(hb(2));
            //let dialogNameContainer = fromHTML(`<div class="listHorizontal">`);
            //dialogElement.appendChild(dialogNameContainer);
            //dialogNameContainer.appendChild(fromHTML(`<div>Name:`));
            //let dialogNameInput = dialog.dialogNameInput = fromHTML(`<input type="text" class="largeElement" placeholder="Enter item name..." style="width: 400px;">`);
            //dialogNameContainer.appendChild(dialogNameInput);

            dialogElement.appendChild(hb(2));
            let dialogScalingInputContainer = dialog.dialogScalingInputContainer = fromHTML(`<div class="listHorizontal">`);
            dialogElement.appendChild(dialogScalingInputContainer);
            dialogScalingInputContainer.appendChild(fromHTML(`<div>Scaling:`));
            let dialogScalingInput = dialog.dialogScalingInput = fromHTML(`<input type="number" class="smallNumberInput">`);
            dialogScalingInputContainer.appendChild(dialogScalingInput);

            dialogElement.appendChild(hb(2));
            let dialogAmountInputContainer = fromHTML(`<div class="listHorizontal">`);
            dialogElement.appendChild(dialogAmountInputContainer);
            dialogAmountInputContainer.appendChild(fromHTML(`<div>Amount:`));
            let dialogAmountInput = dialog.dialogAmountInput = fromHTML(`<input type="number" class="smallNumberInput">`);
            dialogAmountInputContainer.appendChild(dialogAmountInput);

            dialogElement.appendChild(hb(2));
            let dialogTotalCostContainer = fromHTML(`<div class="listHorizontal">`);
            dialogElement.appendChild(dialogTotalCostContainer);
            let dialogTotalCostLabel = dialog.dialogTotalCostLabel = fromHTML(`<div>Total Cost:`);
            dialogTotalCostContainer.appendChild(dialogTotalCostLabel);
            let dialogTotalCost = dialog.dialogTotalCost = fromHTML(`<div>`);
            dialogTotalCostContainer.appendChild(dialogTotalCost);

            dialogElement.appendChild(hb(4));
            let dialogItemPreviewContainer = dialog.dialogItemPreviewContainer = fromHTML(`<div class="w-100">`);
            dialogElement.appendChild(dialogItemPreviewContainer);

            dialogElement.appendChild(hb(6));
            let dialogButtonList = fromHTML(`<div class="listHorizontal">`);
            dialogElement.appendChild(dialogButtonList);
            let dialogCancelButton = fromHTML(`<button class="largeElement bordered hoverable flexFill w-100">Cancel`);
            dialogButtonList.appendChild(dialogCancelButton);
            dialog.addCloseButton(dialogCancelButton);
            let dialogConfirmButton = dialog.dialogConfirmButton = fromHTML(`<button class="largeElement bordered hoverable flexFill w-100">`);
            dialogButtonList.appendChild(dialogConfirmButton);

            dialog.onCostChange = () => {
                let cost = AbilitySectionHelpers.getParsedCost(dialog._section);

                let amount = InputHelpers.fixNumberInput(dialogAmountInput);
                if (dialog._type != "Buy") amount = InputHelpers.constrainInput(dialogAmountInput, value => Math.min(value, character.getItemAmount(dialog._originalSection)));
                amount = dialog._amount = InputHelpers.constrainInput(dialogAmountInput, value => clamp(value, 1, 10000));

                let maxBuyableAmount = Math.floor(character.money / cost);
                if (character.settings.validate && dialog._type == "Buy" && maxBuyableAmount < amount) {
                    dialogConfirmButton.setAttribute('disabled', '');
                } else {
                    dialogConfirmButton.removeAttribute('disabled');
                }

                if (dialog._type == "Throw Away") cost = 0;
                else if (dialog._type == "Sell") cost = Math.floor(cost / 2) * amount;
                else cost *= amount;
                dialogTotalCost.textContent = cost;
            }
            dialog.onSectionChange = () => {
                let scaling = InputHelpers.fixNumberInput(dialogScalingInput);
                scaling = dialog._scaling = InputHelpers.constrainInput(dialogScalingInput, value => clamp(value, 1, 10));

                dialogItemPreviewContainer.innerHTML = '';
                let section = dialog._section = SectionHelpers.getScaled(dialog._originalSection, scaling);

                let structuredSection = dialog._structuredSection = SectionHelpers.generateStructuredHtmlForSection(section, { variables });
                dialogItemPreviewContainer.innerHTML = "";
                dialogItemPreviewContainer.appendChild(structuredSection.wrapperElement);

                dialog.onCostChange();
            }
            dialogAmountInput.addEventListener('change', () => {
                if (dialogAmountInput.value == '') return;
                dialog.onCostChange();
            });
            dialogAmountInput.addEventListener('focusout', () => {
                if (dialogAmountInput.value == '') dialogAmountInput.value = dialog._amount;
            });
            dialogScalingInput.addEventListener('change', () => {
                if (dialogScalingInput.value == '') return;
                dialog.onSectionChange();
            });
            dialogScalingInput.addEventListener('focusout', () => {
                if (dialogScalingInput.value == '') dialogScalingInput.value = dialog._scaling;
            });
            //dialogNameInput.addEventListener('input', () => {
            //    let value = dialogNameInput.value;
            //    if (!value) value = dialog._structuredSection.section.title;
            //    dialog._structuredSection.titleElement.textContent = value;
            //});
            dialogConfirmButton.addEventListener('click', () => {
                /*dialog._structuredSection.section.title = dialogNameInput.value;*/
                let type = dialog._type;
                let target = completeBuyItem;
                if (type == "Sell") target = completeSellItem;
                else if (type == "Throw Away") target = completeThrowAwayItem;
                else if (type == "Return") target = completeReturnItem;
                target(dialog._section, dialog._amount);
                dialog.close();
            });

            return dialogElement;
        });
        element.addEventListener('removed', () => itemDialog.container.remove());

        function openDialog(item, type) {
            itemDialog.dialogTitleElement.textContent = `${type} Item: ${item.title}`;
            itemDialog.dialogAmountInput.value = itemDialog._amount = 1;
            itemDialog.dialogScalingInput.value = itemDialog._scaling = availableOverview.sections.get(item)?.settings.variables.get("X") ?? 1;
            itemDialog._type = type;
            itemDialog.dialogConfirmButton.textContent = type;

            if (AbilitySectionHelpers.isScalingItem(item)) {
                itemDialog.dialogScalingInputContainer.classList.remove('hide');
            } else {
                itemDialog.dialogScalingInputContainer.classList.add('hide');
            }

            if (type != "Buy") itemDialog.dialogTotalCostLabel.textContent = "Total Payment:";

            itemDialog._originalSection = item;

            itemDialog.onSectionChange();
            itemDialog.open();
        }

        // sell, throw away, return
        element.appendChild(hb(4));
        element.appendChild(fromHTML(`<h1>Owned Items`));
        let chosenOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(chosenItems.getAll(), SectionHelpers.MasonryType, { addSearch: true, filterKey: this.getSearchFilterKey('owned_items'), variables, draggable: true, afterdrag: this.getAfterdragForCharacterRegistry(character, chosenItems) });
        element.appendChild(chosenOverview.container);
        chosenOverview.listElement.setAttribute('placeholder', 'No items owned yet...');
        function updateChosenOverview() {
            for (let structuredSection of chosenOverview.sections) {
                let element = structuredSection.wrapperElement;
                let item = structuredSection.section;
            }

            chosenOverview.listElement._masonry?.resize();
        }

        element.appendChild(hb(4));
        element.appendChild(fromHTML(`<h1>Available Items`));
        let availableOverview = SectionHelpers.generateStructuredHtmlForSectionOverview(Registries.items.getAll(), SectionHelpers.MasonryType, { addSearch: true, filterKey: this.getSearchFilterKey('available_items'), variables });
        element.appendChild(availableOverview.container);
        let noItemsElement = fromHTML(`<div class="hide" placeholder="No more items available...">`);
        element.appendChild(noItemsElement);
        function updateAvailableOverview() {
            for (let structuredSection of availableOverview.sections) {
                let element = structuredSection.wrapperElement;
                let item = structuredSection.section;
                let isAvailable = true;
                let cost = AbilitySectionHelpers.getParsedCost(item);
                if (character.money - cost < 0) isAvailable = false;
                if (isAvailable || !character.settings.validate) {
                    structuredSection.buyButton?.removeAttribute('disabled');
                }
                else structuredSection.buyButton?.setAttribute('disabled', '');
            }

            availableOverview.listElement._masonry?.resize();
        }

        function buyItem(item) {
            openDialog(item, "Buy");
        }

        function completeBuyItem(item, amount) {
            character.addItem(item, amount);
            character.money -= AbilitySectionHelpers.getParsedCost(item) * amount;

            if (chosenOverview.sections.has(item)) SectionHelpers.regenerateHtmlForStructuredSection(chosenOverview.sections.get(item));
            else {
                let structuredSection = chosenOverview.addSection(character.items.get(item), { replace: true });
                addRemoveButtons(structuredSection);
                structuredSection.settings.onRegenerated = () => addRemoveButtons(structuredSection);
            }

            CharacterHelpers.saveCharacter(character);
            updateAll();
        }

        function sellItem(item) {
            openDialog(item, "Sell");
        }
        function completeSellItem(item, amount) {
            character.removeItem(item, amount);
            character.money += Math.floor(AbilitySectionHelpers.getParsedCost(item) / 2) * amount;
            if (character.getItemAmount(item) == 0) chosenOverview.removeSection(item);
            else {
                SectionHelpers.regenerateHtmlForStructuredSection(chosenOverview.sections.get(item));
            }

            CharacterHelpers.saveCharacter(character);
            updateAll();
        }
        function throwAwayItem(item) {
            openDialog(item, "Throw Away");
        }
        function completeThrowAwayItem(item, amount) {
            character.removeItem(item, amount);
            if (character.getItemAmount(item) == 0) chosenOverview.removeSection(item);
            else {
                SectionHelpers.regenerateHtmlForStructuredSection(chosenOverview.sections.get(item));
            }

            CharacterHelpers.saveCharacter(character);
            updateAll();
        }
        function returnItem(item) {
            openDialog(item, "Return");
        }
        function completeReturnItem(item, amount) {
            character.removeItem(item, amount);
            character.money += AbilitySectionHelpers.getParsedCost(item) * amount;
            if (character.getItemAmount(item) == 0) chosenOverview.removeSection(item);
            else {
                SectionHelpers.regenerateHtmlForStructuredSection(chosenOverview.sections.get(item));
            }

            CharacterHelpers.saveCharacter(character);
            updateAll();
        }

        for (let structuredSection of chosenOverview.sections) {
            addRemoveButtons(structuredSection);
            structuredSection.settings.onRegenerated = () => addRemoveButtons(structuredSection);
        }

        for (let structuredSection of availableOverview.sections) {
            addBuyButton(structuredSection);
            structuredSection.settings.onRegenerated = () => addBuyButton(structuredSection);
        }

        function addRemoveButtons(structuredSection) {
            addSellButton(structuredSection);
            addThrowAwayButton(structuredSection);
            addReturnButton(structuredSection);
            if (AbilitySectionHelpers.getParsedCost(structuredSection.section) != 0) addBuyButton(structuredSection);
        }

        function addSellButton(structuredSection) {
            let item = structuredSection.section;

            let container = structuredSection.sellButtonContainer = fromHTML(`<div>`);
            container.appendChild(hb(2));
            let wrapper = fromHTML(`<div class="listHorizontal centerContentHorizontally">`);
            container.appendChild(wrapper);
            let button = structuredSection.sellButton = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered brand-border-color hoverable centerContentHorizontally w-100" tooltip="Use this to sell old or previously bought items. You regain half the price.">Sell`);
            wrapper.appendChild(button);

            button.addEventListener('click', () => sellItem(item));
            structuredSection.element.appendChild(container);
        }

        function addThrowAwayButton(structuredSection) {
            let item = structuredSection.section;

            let container = structuredSection.throwAwayButtonContainer = fromHTML(`<div>`);
            container.appendChild(hb(2));
            let wrapper = fromHTML(`<div class="listHorizontal centerContentHorizontally">`);
            container.appendChild(wrapper);
            let button = structuredSection.throwAwayButton = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered brand-border-color hoverable centerContentHorizontally w-100" tooltip="Throw away the item without any payment.">Throw Away`);
            wrapper.appendChild(button);

            button.addEventListener('click', () => throwAwayItem(item));
            structuredSection.element.appendChild(container);
        }

        function addReturnButton(structuredSection) {
            let item = structuredSection.section;

            let container = structuredSection.returnButtonContainer = fromHTML(`<div>`);
            container.appendChild(hb(2));
            let wrapper = fromHTML(`<div class="listHorizontal centerContentHorizontally">`);
            container.appendChild(wrapper);
            let button = structuredSection.returnButton = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered brand-border-color hoverable centerContentHorizontally w-100" tooltip="While buying, you can return mistakenly bought items at their full price.">Return`);
            wrapper.appendChild(button);

            button.addEventListener('click', () => returnItem(item));
            structuredSection.element.appendChild(container);
        }

        function addBuyButton(structuredSection) {
            let item = structuredSection.section;

            let container = structuredSection.buyButtonContainer = fromHTML(`<div>`);
            container.appendChild(hb(2));
            let wrapper = fromHTML(`<div class="listHorizontal centerContentHorizontally">`);
            container.appendChild(wrapper);
            let button = structuredSection.buyButton = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered brand-border-color hoverable centerContentHorizontally w-100">Buy`);
            wrapper.appendChild(button);

            button.addEventListener('click', () => buyItem(item));
            structuredSection.element.appendChild(container);
        }

        function updateAll() {
            updateDescription();
            updateChosenOverview();
            updateAvailableOverview();
        }
        updateAll();

        return element;
    }

    static generateFlavorPageHtml(character, page, structuredCharacterCreator) {
        let variables = character.getVariables();
        let element = fromHTML(`<div class="characterCreator-page divList">`);
        element.appendChild(SectionHelpers.generateStructuredHtmlForSection(SectionHelpers.resolveSectionExpression('rules/Character Creation/Choose Ancestry*noChildren'), { variables }).element);

        element.appendChild(hb(4));
        let chosenAncestriesBar = fromHTML(`<div class="listHorizontal gap-2">`);
        element.appendChild(chosenAncestriesBar);
        element.appendChild(hb(4));
        let unchosenAncestriesBar = fromHTML(`<div class="listHorizontal gap-2">`);
        element.appendChild(unchosenAncestriesBar);
        let ancestries = new Set(Registries.ancestries.getAll());

        function chooseAncestry(ancestry) {
            if (character.ancestry == ancestry) return;
            character.ancestry = ancestry;
            CharacterHelpers.saveCharacter(character);
            updateAncestries();
        }

        function unchooseAncestry(ancestry) {
            if (character.ancestry == null) return;
            character.ancestry = null;
            CharacterHelpers.saveCharacter(character);
            updateAncestries();
        }

        function updateAncestries() {
            chosenAncestriesBar.innerHTML = '';
            unchosenAncestriesBar.innerHTML = '';
            for (let ancestry of ancestries) {
                let hasAncestry = character.ancestry == ancestry;
                let element = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered hoverable">`);
                (hasAncestry ? chosenAncestriesBar : unchosenAncestriesBar).appendChild(element);
                if (hasAncestry) element.classList.add('brand-border-color');
                element.addEventListener('click', () => hasAncestry ? unchooseAncestry(ancestry) : chooseAncestry(ancestry));
                let nameElement = fromHTML(`<div>`);
                element.appendChild(nameElement);
                nameElement.textContent = ancestry;
                let icon = hasAncestry ? icons.close() : icons.add();
                element.appendChild(icon);
                icon.classList.add('minimalIcon');
            }
        }
        updateAncestries();

        element.appendChild(hb(4));
        element.appendChild(SectionHelpers.generateStructuredHtmlForSection(SectionHelpers.resolveSectionExpression('rules/Character Creation/Choose Characteristics*noChildren'), { variables }).element);
        element.appendChild(hb(4));

        let characteristicsInputContainer = fromHTML(`<div class="listHorizontal gap-1">`);
        element.appendChild(characteristicsInputContainer);
        let characteristicsInput = fromHTML(`<input type="text" class="largeElement smallTextInput">`);
        characteristicsInputContainer.appendChild(characteristicsInput);
        characteristicsInput.value = "";
        let addCharacteristicsButton = fromHTML(`<button class="largeElement bordered hoverable listHorizontal" tooltip="Add characteristics (or press Enter)" disabled>`);
        let characteristicsPlusIcon = icons.add();
        characteristicsPlusIcon.classList.add('minimalIcon');
        addCharacteristicsButton.appendChild(characteristicsPlusIcon);
        characteristicsInputContainer.appendChild(addCharacteristicsButton);
        function chooseCustomCharacteristics() {
            characteristicsInput.value.split(",").forEach(c => chooseCharacteristic(toTextCase(c.trim())));
            characteristicsInput.value = "";
            addCharacteristicsButton.setAttribute('disabled', '');
        }
        addCharacteristicsButton.addEventListener('click', e => chooseCustomCharacteristics());
        characteristicsInput.addEventListener('input', () => {
            if (characteristicsInput.value) addCharacteristicsButton.removeAttribute('disabled');
            else addCharacteristicsButton.setAttribute('disabled', '');
        });
        characteristicsInput.addEventListener('keyup', e => {
            if (e.key == "Enter") chooseCustomCharacteristics();
        });

        element.appendChild(hb(2));
        let chosenCharacteristicsBar = fromHTML(`<div class="listHorizontal gap-2">`);
        element.appendChild(chosenCharacteristicsBar);
        element.appendChild(hb(4));
        let unchosenCharacteristicsBar = fromHTML(`<div class="listHorizontal gap-2">`);
        element.appendChild(unchosenCharacteristicsBar);
        let characteristics = FlavorHelpers.sampleCharacteristics;
        let chosenCharacteristics = character.characteristics; // Registry

        function chooseCharacteristic(characteristic) {
            if (chosenCharacteristics.has(characteristic)) return;
            chosenCharacteristics.register(characteristic);
            CharacterHelpers.saveCharacter(character);
            updateCharacteristics();
        }

        function unchooseCharacteristic(characteristic) {
            if (!chosenCharacteristics.has(characteristic)) return;
            chosenCharacteristics.unregister(characteristic);
            CharacterHelpers.saveCharacter(character);
            updateCharacteristics();
        }

        function updateCharacteristics() {
            chosenCharacteristicsBar.innerHTML = '';
            unchosenCharacteristicsBar.innerHTML = '';
            for (let characteristic of chosenCharacteristics) {
                let hasCharacteristic = chosenCharacteristics.has(characteristic);
                if (!hasCharacteristic) continue;
                let element = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered hoverable">`);
                (hasCharacteristic ? chosenCharacteristicsBar : unchosenCharacteristicsBar).appendChild(element);
                if (hasCharacteristic) element.classList.add('brand-border-color');
                element.addEventListener('click', () => hasCharacteristic ? unchooseCharacteristic(characteristic) : chooseCharacteristic(characteristic));
                let nameElement = fromHTML(`<div>`);
                element.appendChild(nameElement);
                nameElement.textContent = characteristic;
                let icon = hasCharacteristic ? icons.close() : icons.add();
                element.appendChild(icon);
                icon.classList.add('minimalIcon');
            }
            for (let characteristic of characteristics) {
                let hasCharacteristic = chosenCharacteristics.has(characteristic);
                if (hasCharacteristic) continue;
                let element = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered hoverable">`);
                (hasCharacteristic ? chosenCharacteristicsBar : unchosenCharacteristicsBar).appendChild(element);
                if (hasCharacteristic) element.classList.add('brand-border-color');
                element.addEventListener('click', () => hasCharacteristic ? unchooseCharacteristic(characteristic) : chooseCharacteristic(characteristic));
                let nameElement = fromHTML(`<div>`);
                element.appendChild(nameElement);
                nameElement.textContent = characteristic;
                let icon = hasCharacteristic ? icons.close() : icons.add();
                element.appendChild(icon);
                icon.classList.add('minimalIcon');
            }
        }
        updateCharacteristics();

        element.appendChild(hb(4));
        element.appendChild(SectionHelpers.generateStructuredHtmlForSection(SectionHelpers.resolveSectionExpression('rules/Character Creation/Choose Passions*noChildren'), { variables }).element);
        element.appendChild(hb(4));

        let passionsInputContainer = fromHTML(`<div class="listHorizontal gap-1">`);
        element.appendChild(passionsInputContainer);
        let passionsInput = fromHTML(`<input type="text" class="largeElement smallTextInput">`);
        passionsInputContainer.appendChild(passionsInput);
        passionsInput.value = "";
        let addPassionsButton = fromHTML(`<button class="largeElement bordered hoverable listHorizontal" tooltip="Add passions (or press Enter)" disabled>`);
        let passionsPlusIcon = icons.add();
        passionsPlusIcon.classList.add('minimalIcon');
        addPassionsButton.appendChild(passionsPlusIcon);
        passionsInputContainer.appendChild(addPassionsButton);
        function chooseCustomPassions() {
            passionsInput.value.split(",").forEach(c => choosePassion(toTextCase(c.trim())));
            passionsInput.value = "";
            addPassionsButton.setAttribute('disabled', '');
        }
        addPassionsButton.addEventListener('click', e => chooseCustomPassions());
        passionsInput.addEventListener('input', () => {
            if (passionsInput.value) addPassionsButton.removeAttribute('disabled');
            else addPassionsButton.setAttribute('disabled', '');
        });
        passionsInput.addEventListener('keyup', e => {
            if (e.key == "Enter") chooseCustomPassions();
        });

        element.appendChild(hb(4));
        let chosenPassionsBar = fromHTML(`<div class="listHorizontal gap-2">`);
        element.appendChild(chosenPassionsBar);
        element.appendChild(hb(4));
        element.appendChild(fromHTML(`<h4>Common`));
        let unchosenPassionsCommonBar = fromHTML(`<div class="listHorizontal gap-2">`);
        element.appendChild(unchosenPassionsCommonBar);
        element.appendChild(hb(4));
        element.appendChild(fromHTML(`<h4>Specific`));
        let unchosenPassionsSpecificBar = fromHTML(`<div class="listHorizontal gap-2">`);
        element.appendChild(unchosenPassionsSpecificBar);
        let passionsCommon = FlavorHelpers.sampleCommonPassions;
        let passionsSpecific = FlavorHelpers.sampleSpecificPassions;
        let chosenPassions = character.passions; // Registry

        function choosePassion(passion) {
            if (chosenPassions.has(passion)) return;
            chosenPassions.register(passion);
            CharacterHelpers.saveCharacter(character);
            updatePassions();
        }

        function unchoosePassion(passion) {
            if (!chosenPassions.has(passion)) return;
            chosenPassions.unregister(passion);
            CharacterHelpers.saveCharacter(character);
            updatePassions();
        }

        function updatePassions() {
            chosenPassionsBar.innerHTML = '';
            unchosenPassionsCommonBar.innerHTML = '';
            unchosenPassionsSpecificBar.innerHTML = '';
            for (let passion of chosenPassions) {
                let hasPassion = chosenPassions.has(passion);
                if (!hasPassion) continue;
                let element = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered hoverable">`);
                (hasPassion ? chosenPassionsBar : (passionGroup == passionsCommon ? unchosenPassionsCommonBar : unchosenPassionsSpecificBar)).appendChild(element);
                if (hasPassion) element.classList.add('brand-border-color');
                element.addEventListener('click', () => hasPassion ? unchoosePassion(passion) : choosePassion(passion));
                let nameElement = fromHTML(`<div>`);
                element.appendChild(nameElement);
                nameElement.textContent = passion;
                let icon = hasPassion ? icons.close() : icons.add();
                element.appendChild(icon);
                icon.classList.add('minimalIcon');
            }
            for (let passionGroup of [passionsCommon, passionsSpecific]) {
                for (let passion of passionGroup) {
                    let hasPassion = chosenPassions.has(passion);
                    if (hasPassion) continue;
                    let element = fromHTML(`<button class="listHorizontal gap-2 largeElement bordered hoverable">`);
                    (hasPassion ? chosenPassionsBar : (passionGroup == passionsCommon ? unchosenPassionsCommonBar : unchosenPassionsSpecificBar)).appendChild(element);
                    if (hasPassion) element.classList.add('brand-border-color');
                    element.addEventListener('click', () => hasPassion ? unchoosePassion(passion) : choosePassion(passion));
                    let nameElement = fromHTML(`<div>`);
                    element.appendChild(nameElement);
                    nameElement.textContent = passion;
                    let icon = hasPassion ? icons.close() : icons.add();
                    element.appendChild(icon);
                    icon.classList.add('minimalIcon');
                }
            }
        }
        updatePassions();

        element.appendChild(hb(4));
        element.appendChild(SectionHelpers.generateStructuredHtmlForSection(SectionHelpers.resolveSectionExpression('rules/Character Creation/Appearance'), { variables }).element);
        element.appendChild(hb(4));
        let appearanceInputContainer = fromHTML(`<div class="contenteditableContainer">`);
        element.appendChild(appearanceInputContainer);
        const appearanceInput = fromHTML(`<div contenteditable-type="plainTextOnly" contenteditable="true" class="w-100 fixText maxHeight-6">`);
        appearanceInputContainer.appendChild(appearanceInput);
        appearanceInput.textContent = character.details.appearance;
        appearanceInput.addEventListener('input', e => {
            let text = appearanceInput.innerText;
            if (ContentEditableHelpers.textNeedsFixing(text)) appearanceInput.textContent = text = ContentEditableHelpers.fixText(text);
            character.details.appearance = text;
            CharacterHelpers.saveCharacter(character);
        });

        element.appendChild(hb(4));
        element.appendChild(SectionHelpers.generateStructuredHtmlForSection(SectionHelpers.resolveSectionExpression('rules/Character Creation/Why?'), { variables }).element);
        element.appendChild(hb(4));
        let whyInputContainer = fromHTML(`<div class="contenteditableContainer">`);
        element.appendChild(whyInputContainer);
        const whyInput = fromHTML(`<div contenteditable-type="plainTextOnly" contenteditable="true" class="w-100 fixText maxHeight-6">`);
        whyInputContainer.appendChild(whyInput);
        whyInput.textContent = character.details.why;
        whyInput.addEventListener('input', e => {
            let text = whyInput.innerText;
            if (ContentEditableHelpers.textNeedsFixing(text)) whyInput.textContent = text = ContentEditableHelpers.fixText(text);
            character.details.why = text;
            CharacterHelpers.saveCharacter(character);
        });

        element.appendChild(hb(4));
        element.appendChild(SectionHelpers.generateStructuredHtmlForSection(SectionHelpers.resolveSectionExpression('rules/Character Creation/Write Backstory'), { variables }).element);
        element.appendChild(hb(4));
        let backstoryInputContainer = fromHTML(`<div class="contenteditableContainer">`);
        element.appendChild(backstoryInputContainer);
        const backstoryInput = fromHTML(`<div contenteditable-type="plainTextOnly" contenteditable="true" class="w-100 fixText maxHeight-6">`);
        backstoryInputContainer.appendChild(backstoryInput);
        backstoryInput.textContent = character.details.backstory;
        backstoryInput.addEventListener('input', e => {
            let text = backstoryInput.innerText;
            if (ContentEditableHelpers.textNeedsFixing(text)) backstoryInput.textContent = text = ContentEditableHelpers.fixText(text);
            character.details.backstory = text;
            CharacterHelpers.saveCharacter(character);
        });

        return element;
    }

    static canConnectToAbility(targetRegistry, ability, techniqueRegistry = null) {
        if (AbilitySectionHelpers.isMutated(ability)) {
            let mutationInfo = AbilitySectionHelpers.getMutatedInfo(ability);
            if (!targetRegistry.has(mutationInfo.original) || !(techniqueRegistry ?? targetRegistry).has(mutationInfo.mutation)) return false;
            return true;
        } else if (AbilitySectionHelpers.isVariant(ability)) {
            let original = AbilitySectionHelpers.getVariantOriginal(ability);
            if (!targetRegistry.has(original)) return false;
            return true;
        }

        let connections = AbilitySectionHelpers.getConnections(ability);
        if (connections.has('Category')) return true;
        for (let connection of connections) {
            if (targetRegistry.has(connection)) return true;
        }
        return false;
    }

    // Unlock methods
    static getMaxSummonUnlocks(character) {
        let unlocks = new Map();
        character.techniques.filter(t => AbilitySectionHelpers.hasUnlocks(t)).map(s => AbilitySectionHelpers.getUnlocks(s)).forEach(unlocksList => {
            unlocksList.filter(u => u.type == "Summon").forEach(unlock => {
                let oldAmount = unlocks.get(unlock.target) ?? 0;
                unlocks.set(unlock.target, oldAmount + unlock.amount);
            });
        });
        return unlocks;
    }

    static getMaxSummonUnlocksInVariant(character, summon) {
        let unlocks = new Map();
        SummonHelpers.getTechniquesNotInOriginal(character, summon).filter(t => AbilitySectionHelpers.hasUnlocks(t)).map(s => AbilitySectionHelpers.getUnlocks(s)).forEach(unlocksList => {
            unlocksList.filter(u => u.type == "Summon").forEach(unlock => {
                let oldAmount = unlocks.get(unlock.target) ?? 0;
                unlocks.set(unlock.target, oldAmount + unlock.amount);
            });
        });
        return unlocks;
    }

    static getRemainingSummonUnlocks(character, environment = null) {
        environment ??= {};
        let maxSummonUnlocks = environment.maxSummonUnlocks ??= this.getMaxSummonUnlocks(character);
        let remaining = new Map();
        for (let [category, maxAmount] of maxSummonUnlocks.entries()) {
            let hasAmount = character.summons.filter(s => AbilitySectionHelpers.getMainCategory(s) == category).length;
            remaining.set(category, clamp(maxAmount - hasAmount, 0, maxAmount));
        }
        return remaining;
    }

    static getRemainingSummonUnlocksInVariant(character, summon, environment = null) {
        environment ??= {};
        let maxSummonUnlocks = environment.maxSummonUnlocks ??= this.getMaxSummonUnlocksInVariant(character, summon, environment);
        let uniqueSummons = SummonHelpers.getSummonsNotInOriginal(character, summon);
        let remaining = new Map();
        for (let [category, maxAmount] of maxSummonUnlocks.entries()) {
            let hasAmount = uniqueSummons.filter(s => AbilitySectionHelpers.getMainCategory(s) == category).length;
            remaining.set(category, clamp(maxAmount - hasAmount, 0, maxAmount));
        }
        return remaining;
    }

    static getRemainingFreeMutations(character, environment = null) {
        environment ??= {};
        let chosenMutations = environment.chosenMutations ??= this.getMutations(character);
        let remaining = new Map();
        for (let mutation of chosenMutations) {
            remaining.set(mutation, 1);
            for (let techniqueLike of character.techniques) {
                let mutatedMutation = AbilitySectionHelpers.getMutatedMutation(techniqueLike);
                if (mutatedMutation == mutation.title) remaining.set(mutation, 0);
            }
        }
        return remaining;
    }

    static getRemainingFreeMutationsInVariant(character, summon, environment = null) {
        environment ??= {};
        let original = SummonHelpers.getVariantOriginal(character, summon);
        let chosenMutations = (environment.chosenMutations ?? this.getMutations(summon.npc)).filter(m => !original.npc.techniques.has(m));
        let remaining = new Map();
        for (let mutation of chosenMutations) {
            remaining.set(mutation, 1);
            for (let techniqueLike of summon.npc.techniques) {
                let mutatedMutation = AbilitySectionHelpers.getMutatedMutation(techniqueLike);
                if (mutatedMutation == mutation.title) remaining.set(mutation, 0);
            }
        }
        return remaining;
    }

    static getMutations(character) {
        return character.techniques.filter(t => AbilitySectionHelpers.isMutation(t));
    }

    static getHasMutation(character) {
        return character.techniques.some(t => AbilitySectionHelpers.isMutation(t));
    }

    static getHasWeaponCore(character) {
        return character.techniques.some(t => AbilitySectionHelpers.isWeaponCore(t));
    }

    static getTooManySummonsCount(character, environment = null) {
        environment ??= {};
        let maxSummonUnlocks = environment.maxSummonUnlocks ??= this.getMaxSummonUnlocks(character);
        let tooManySummonsTracker = new Map(maxSummonUnlocks);
        let tooManySummons = character.summons.filter(s => !AbilitySectionHelpers.isVariant(s)).filter(summon => {
            let category = AbilitySectionHelpers.getMainCategory(summon);
            let remaining = tooManySummonsTracker.get(category);
            if (remaining == null || remaining == 0) return true;
            tooManySummonsTracker.set(category, remaining - 1);
            return false;
        }).length;
        return tooManySummons;
    }

    static getTooManySummonsCountInVariant(character, summon, environment = null) {
        environment ??= {};
        let maxSummonUnlocks = environment.maxSummonUnlocks ??= this.getMaxSummonUnlocksInVariant(character, summon);
        let tooManySummonsTracker = new Map(maxSummonUnlocks);
        let tooManySummons = SummonHelpers.getSummonsNotInOriginal(character, summon).filter(summon => {
            let category = AbilitySectionHelpers.getMainCategory(summon);
            let remaining = tooManySummonsTracker.get(category);
            if (remaining == null || remaining == 0) return true;
            tooManySummonsTracker.set(category, remaining - 1);
            return false;
        }).length;
        return tooManySummons;
    }

    static getFreeMutatedCount(character, environment = null) {
        environment ??= {};
        let remainingFreeMutations = environment.remainingFreeMutations ??= this.getRemainingFreeMutations(character, environment);
        let freeMutated = 0;
        [...remainingFreeMutations.values()].forEach(amount => freeMutated += 1 - amount);
        return freeMutated;
    }

    static getFreeMutatedCountInVariant(character, summon, environment = null) {
        environment ??= {};
        let remainingFreeMutations = environment.remainingFreeMutations ??= this.getRemainingFreeMutationsInVariant(character, summon, environment);
        let freeMutated = 0;
        [...remainingFreeMutations.values()].forEach(amount => freeMutated += 1 - amount);
        return freeMutated;
    }

    static getTooManyTechniquesCountInVariant(character, summon, environment = null) {
        return SummonHelpers.getTechniquesNotInOriginal(character, summon).length - this.getFreeMutatedCountInVariant(character, summon, environment);
    }

    static getTooManyThingsCountInVariant(character, summon, environment = null) {
        return this.getTooManySummonsCountInVariant(character, summon, environment) + this.getTooManyTechniquesCountInVariant(character, summon, environment);
    }

    static getTooManyVariantTechniquesCount(character, environment = null) {
        let count = 0;
        character.summons.filter(s => AbilitySectionHelpers.isVariant(s)).forEach(s => {
            count += this.getTooManyTechniquesCountInVariant(character, s);
        });
        return count;
    }

    static getTooManyVariantSummonsCount(character, environment = null) {
        let tooManyVariantSummons = 0;
        character.summons.filter(s => AbilitySectionHelpers.isVariant(s)).forEach(s => {
            tooManyVariantSummons += this.getTooManySummonsCountInVariant(character, s);
        });
        return tooManyVariantSummons;
    }

    static getTooManyVariantThingsCountData(character, environment = null) {
        let tooManyVariantSummons = this.getTooManyVariantSummonsCount(character, environment);
        let toomanyVariantTechniques = this.getTooManyVariantTechniquesCount(character, environment);
        let tooManyUndivided = tooManyVariantSummons + toomanyVariantTechniques;

        let divisior = 2;
        let divisionOverflow = tooManyUndivided % divisior;
        let tooManyVariantThings = Math.ceil(tooManyUndivided / divisior);
        return { count: tooManyVariantThings, divisionOverflow };
    }

    static getTooManyVariantThingsCount(character, environment = null) {
        return this.getTooManyVariantThingsCountData(character, environment).count;
    }

    static getMaxOtherTechniques(character, environment = null) {
        environment ??= {};
        let maxTechniques = environment.maxTechniques ?? character.getMaxTechniques(); // one of which is a weapon core technique
        return maxTechniques - 1;
    }

    static getRemainingOtherTechniquesData(character, environment = null) {
        environment ??= {};
        let maxTechniques = environment.maxTechniques ??= character.getMaxTechniques(); // one of which is a weapon core technique
        let maxOtherTechniques = environment.maxOtherTechniques ??= this.getMaxOtherTechniques(character, environment);
        let chosenTechniques = character.techniques;

        let remainingFreeMutations = environment.remainingFreeMutations ??= this.getRemainingFreeMutations(character, environment);
        let hasMutation = environment.hasMutation ??= this.getHasMutation(character);
        let hasWeaponCore = environment.hasWeaponCore ??= this.getHasWeaponCore(character);
        let freeMutated = this.getFreeMutatedCount(character, { remainingFreeMutations });
        let tooManySummons = this.getTooManySummonsCount(character, environment);
        let tooManyVariantThingsData = this.getTooManyVariantThingsCountData(character, environment);
        let tooManyVariantThings = tooManyVariantThingsData.count;
        let divisionOverflow = tooManyVariantThingsData.divisionOverflow;

        let freeTechniques = 0;
        if (hasWeaponCore) freeTechniques += 1;
        if (character.canHaveFreeMutation() && hasMutation) freeTechniques += 1;
        let remaining = maxOtherTechniques + freeMutated - chosenTechniques.size + freeTechniques - tooManySummons - tooManyVariantThings;
        return {count:remaining, divisionOverflow};
    }

    static getRemainingOtherTechniques(character, environment = null) {
        return this.getRemainingOtherTechniquesData(character, environment).count;
    }

    static getAllowedMutations(character, techniqueLike, environment) {
        environment ??= {};
        let chosenMutations = environment.chosenMutations ??= this.getMutations(character);
        let remainingFreeMutations = environment.remainingFreeMutations ??= this.getRemainingFreeMutations(character, environment);
        let remainingOtherTechniques = environment.remainingOtherTechniques ??= this.getRemainingOtherTechniques(character, environment);

        let chosen = character.techniques;
        let category = AbilitySectionHelpers.getMainCategory(techniqueLike);
        return chosenMutations.filter(mutation =>
            !chosen.has(SectionHelpers.getMutationId(techniqueLike, mutation)) &&
            AbilitySectionHelpers.getMainCategory(mutation) != category &&
            (remainingOtherTechniques > 0 || remainingFreeMutations.get(mutation) > 0)
        );
    }

    static getMaxThingsInVariant(character) {
        return (Math.floor(character.stats.level / 10) + 1) * 2;
    }

    static getRemainingOtherTechniquesInVariant(character, summon, environment) {
        let remainingForCharacterData = this.getRemainingOtherTechniquesData(character);
        let remainingForSummonFromCharacterPerspective = remainingForCharacterData.count * 2 + remainingForCharacterData.divisionOverflow;
        let tooManyThings = this.getTooManyThingsCountInVariant(character, summon, environment);
        let maxThings = this.getMaxThingsInVariant(character);
        let remainingThings = maxThings - tooManyThings;
        return Math.min(remainingForSummonFromCharacterPerspective, remainingThings);
    }

    static getAllowedMutationsInVariant(character, summon, techniqueLike, environment) {
        environment ??= {};
        let chosenMutations = environment.chosenMutations ??= this.getMutations(summon.npc);
        let remainingFreeMutations = environment.remainingFreeMutations ??= this.getRemainingFreeMutationsInVariant(character, summon, environment);
        let remainingOtherTechniques = environment.remainingOtherTechniques ??= this.getRemainingOtherTechniquesInVariant(character, summon, environment);

        let chosen = character.techniques;
        let category = AbilitySectionHelpers.getMainCategory(techniqueLike);
        return chosenMutations.filter(mutation =>
            !chosen.has(SectionHelpers.getMutationId(techniqueLike, mutation)) &&
            AbilitySectionHelpers.getMainCategory(mutation) != category &&
            (remainingOtherTechniques > 0 || remainingFreeMutations.get(mutation) > 0)
        );
    }

    static getHasPathCore(character) {
        return character.masteries.some(t => AbilitySectionHelpers.isPathCore(t));
    }

    static getRemainingMasteries(character, environment = null) {
        environment ??= {};
        let maxMasteries = environment.maxMasteries ??= character.getMaxMasteries();
        let upgrades = character.upgrades.size;
        let pathCores = character.masteries.filter(m => AbilitySectionHelpers.isPathCore(m)).length - 1;
        if (pathCores < 0) pathCores = 0;
        else pathCores -= 1; // If a path core exists, the cost of the first is removed
        return maxMasteries - character.masteries.size - upgrades - pathCores; // Path cores are subtracted to gain double effect, as they are also included in the masteries
    }

    static getRemainingEvolutions(character, environment = null) {
        environment ??= {};
        let maxEvolutions = environment.maxEvolutions ??= character.getMaxEvolutions();
        return maxEvolutions - character.evolutions.size;
    }

    static getRemainingAscendancies(character, environment = null) {
        environment ??= {};
        let maxAscendancies = environment.maxAscendancies ??= character.getMaxAscendancies();
        return maxAscendancies - character.ascendancies.size;
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
        this.updateTitle = settings.updateTitle ?? false;

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