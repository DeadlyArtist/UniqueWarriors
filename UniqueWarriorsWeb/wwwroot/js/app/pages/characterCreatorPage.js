class CharacterCreatorPageManager extends PageManager {
    characterIdOverride;
    characterId;
    character;

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
        this.setTitle = !settings.dontSetTitle

        this.characterId = this.characterIdOverride ?? getQueryVariable('id');
        if (!this.characterId) {
            Pages.loadError('No character id provided.');
            return;
        }

        this.character = CharacterHelpers.current = Registries.characters.get(this.characterId);
        if (!this.character) {
            Pages.loadError(`Character not found or invalid: ${this.characterId}`);
            return;
        }
        if (this.setTitle) App.setTitle(`Edit - ${this.character.name}`);

        setTimeout(() => {
            Loader.onCollectionsLoaded(() => {
                if (self.loadId == loadId) self.delayedLoad();
            });
        }, 1);
    }

    delayedLoad() {
        this.structuredCharacterCreator = CharacterCreatorHelpers.generateStructuredHtmlForCharacterCreator(this.character, { startTab: this.getTab(), updateHash: true, updateTitle: this.setTitle });
        this.pageElement.appendChild(this.structuredCharacterCreator.element);
    }

    unload() {

    }

    onHashChange() {
        this.structuredCharacterCreator?.openPageFromHash();
    }

    getTab() {
        return getHashQueryVariable('tab');
    }
}
