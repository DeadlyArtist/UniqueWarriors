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

        let titleBar = fromHTML(`<div class="listHorizontal centerContentHorizontally gap-2">`);
        let createButton = fromHTML(`<button class="listHorizontal largeElement bordered brand-border-color hoverable gap-1" tooltip="Create a new character."><div>Create`);
        titleBar.appendChild(createButton);
        createButton.addEventListener('click', () => CharacterHelpers.createCharacter());
        let plusIcon = icons.add();
        createButton.appendChild(plusIcon);
        plusIcon.classList.add("minimalIcon");
        this.pageElement.appendChild(titleBar);
        this.pageElement.appendChild(hb(1));

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
