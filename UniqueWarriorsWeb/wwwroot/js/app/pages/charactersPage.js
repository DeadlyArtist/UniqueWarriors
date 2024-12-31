class CharactersPageManager extends PageManager {
    stream = null;
    overview;
    noSearchBar = false;

    constructor(settings) {
        super();
        settings ??= {};
        this.settings = settings;
        this.charactersProvider = settings.charactersProvider ?? [];
    }

    load(settings = null) {
        settings ??= {};
        let self = this;
        let loadId = this.loadId;
        this.noSearchBar = !!settings.noSearchBar;
        this.overview = null;

        this.pageElement.appendChild(CharactersPageHelpers.generateActionsBarHtml());

        setTimeout(() => {
            Loader.onCollectionsLoaded(() => {
                if (self.loadId == loadId) self.delayedLoad();
            });
        }, 1);
    }

    delayedLoad() {
        let streamProvider = this.settings.streamProvider;
        if (this.settings.registry) streamProvider = callback => this.settings.registry.stream(callback);

        if (streamProvider) {
            this.setupStream(streamProvider);
        } else {
            const characters = isFunction(this.charactersProvider) ? this.charactersProvider() : this.charactersProvider;
            const overview = CharacterHelpers.generateStructuredHtmlForCharacterSectionOverview(characters, { addSearch: !this.noSearchBar });
            this.overview = overview;
        }

        this.overview.listElement.setAttribute('placeholder', 'No characters created yet...');
        this.sendOverviewEvent();
        this.pageElement.appendChild(this.overview.container);
    }

    setupStream(streamProvider) {
        const overview = CharacterHelpers.generateStructuredHtmlForCharacterSectionOverview([], { addSearch: !this.noSearchBar, dontInitSearch: true });
        this.stream = streamProvider(event => {
            const character = event.obj;
            if (event.registered) overview.addCharacter(character, { insertBefore: event.insertBefore });
            else overview.removeCharacter(character);
        });
        overview.initSearch();
        this.overview = overview;
    }

    sendOverviewEvent() {
        window.dispatchEvent(new CustomEvent(this.loadId + "__Overview"));
    }

    async onOverviewLoaded(callback = doNothing) {
        return new Promise((resolve, reject) => {
            let _callback = () => { callback(); resolve(); }
            if (this.overview) {
                _callback();
            } else {
                window.addEventListener(this.loadId + "__Overview", e => _callback());
            }
        });
    }

    unload() {
        if (this.stream) {
            this.stream.stop();
            this.stream = null;
        }
    }
}

class CharactersPageHelpers {
    static generateActionsBarHtml() {
        let element = fromHTML(`<div>`);

        let importDialog = DialogHelpers.create(dialog => {
            let dialogElement = fromHTML(`<div class="divList">`);
            let dialogTitleElement = fromHTML(`<h1>`);
            dialogElement.appendChild(dialogTitleElement);
            dialogTitleElement.textContent = `Import Characters`;

            let parseFile = async file => {
                return CharacterHelpers.parseCharacterFromFile(file);
            };
            let structuredDropArea = DropAreaHelpers.createJson({ parseFile, multiple: true, });
            dialogElement.appendChild(structuredDropArea.element);
            dialogElement.appendChild(hb(2));
            let dialogButtonList = fromHTML(`<div class="listHorizontal">`);
            dialogElement.appendChild(dialogButtonList);
            let dialogCancelButton = fromHTML(`<button class="largeElement bordered hoverable flexFill w-100">Cancel`);
            dialogButtonList.appendChild(dialogCancelButton);
            dialog.addCloseButton(dialogCancelButton);
            let dialogConfirmButton = fromHTML(`<button class="largeElement bordered hoverable flexFill w-100" disabled>Import`);
            dialogButtonList.appendChild(dialogConfirmButton);
            dialogConfirmButton.addEventListener('click', () => {
                structuredDropArea.parsedContents.forEach(character => CharacterHelpers.importCharacter(character));
                dialog.close();
            });

            structuredDropArea.onChange = () => {
                if (structuredDropArea.files.length == 0) dialogConfirmButton.setAttribute('disabled', '');
                else dialogConfirmButton.removeAttribute('disabled');
            }

            return dialogElement;
        });
        element.addEventListener('removed', () => importDialog.container.remove());

        let actionBarContainer = fromHTML(`<div class="hide">`);
        element.appendChild(actionBarContainer);
        let actionBarElement = fromHTML(`<div class="character-actionBar listHorizontal centerContentHorizontally">`);
        actionBarContainer.appendChild(actionBarElement);
        let downloadButton = fromHTML(`<button class="listHorizontal largeElement bordered hoverable gap-1" tooltip="Download all as zip"><div>Download`);
        actionBarElement.appendChild(downloadButton);
        downloadButton.addEventListener('click', () => CharacterHelpers.downloadAllCharacters());
        let downloadIcon = icons.download();
        downloadButton.appendChild(downloadIcon);
        downloadIcon.classList.add("minimalIcon");
        let importButton = fromHTML(`<button class="listHorizontal largeElement bordered hoverable gap-1" tooltip="Open import dialog"><div>Import`);
        actionBarElement.appendChild(importButton);
        importButton.addEventListener('click', () => importDialog.open());
        let importIcon = icons.upload();
        importButton.appendChild(importIcon);
        importIcon.classList.add("minimalIcon");
        actionBarContainer.appendChild(hb(4));

        let titleBarElement = fromHTML(`<div class="listContainerHorizontal gap-2">`);
        element.appendChild(titleBarElement);
        element.appendChild(hb(1));
        titleBarElement.appendChild(fromHTML(`<div>`));
        let createButton = fromHTML(`<button class="listHorizontal largeElement bordered brand-border-color hoverable gap-1" tooltip="Create a new character."><div>Create`);
        titleBarElement.appendChild(createButton);
        createButton.addEventListener('click', () => CharacterHelpers.createCharacter());
        let plusIcon = icons.add();
        createButton.appendChild(plusIcon);
        plusIcon.classList.add("minimalIcon");

        let openMenuElement = fromHTML(`<div class="character-menu listHorizontal">`);
        titleBarElement.appendChild(openMenuElement);
        let openMenuButton = fromHTML(`<button class="listHorizontal gap-1 element hoverable" tooltip="Open menu">`);
        openMenuElement.appendChild(openMenuButton);
        let closeMenuButton = fromHTML(`<button class="listHorizontal gap-1 element hoverable hide" tooltip="Close menu">`);
        openMenuElement.appendChild(closeMenuButton);
        openMenuButton.addEventListener('click', () => {
            openMenuButton.classList.add('hide');
            closeMenuButton.classList.remove('hide');
            actionBarContainer.classList.remove('hide');
        });
        closeMenuButton.addEventListener('click', () => {
            openMenuButton.classList.remove('hide');
            closeMenuButton.classList.add('hide');
            actionBarContainer.classList.add('hide');
        });
        let menuIcon = icons.menu();
        openMenuButton.appendChild(menuIcon);
        let closeMenuIcon = icons.menuClose();
        closeMenuButton.appendChild(closeMenuIcon);

        return element;
    }
}