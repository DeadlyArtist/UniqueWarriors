class CharacterCreatorPageManager extends PageManager {
    characterIdOverride;
    characterId;

    constructor(settings) {
        super();
        settings ??= {};
        this.characterIdOverride = settings.id;
        this.settings = settings;
    }

    load(settings = null) {
        settings ??= {};
        let self = this;
        let loadId = this.loadId;
        this.characterId = this.characterIdOverride ?? getQueryVariable('id');
        if (!this.characterId) {
            Pages.loadError('No character id provided.');
            return;
        }

        this.character = Registries.characters.get(this.characterId);
        if (!this.character) {
            Pages.loadError(`Character not found or invalid: ${this.characterId}`);
            return;
        }
        if (!settings.dontSetTitle) App.setTitle(`Edit - ${this.character.name}`);

        setTimeout(() => {
            Loader.onCollectionsLoaded(() => {
                if (self.loadId == loadId) self.delayedLoad();
            });
        }, 1);
    }

    delayedLoad() {
        this.pageElement.appendChild(CharacterCreatorHelpers.generateStructuredHtmlForCharacterCreator(this.character).element);
    }

    unload() {

    }
}
