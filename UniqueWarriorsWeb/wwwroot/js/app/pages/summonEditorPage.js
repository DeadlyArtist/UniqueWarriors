class SummonEditorPageManager extends PageManager {
    characterIdOverride;
    characterId;
    summonIdOverride;
    summonId;
    character;
    summon;

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

        this.characterId = this.characterIdOverride ?? getQueryVariable('characterId');
        if (!this.characterId) {
            Pages.loadError('No character id provided.');
            return;
        }
        this.summonId = this.summonIdOverride ?? getQueryVariable('summonId');
        if (!this.summonId) {
            Pages.loadError('No summon id provided.');
            return;
        }

        this.character = Registries.characters.get(this.characterId);
        if (!this.character) {
            Pages.loadError(`Character not found or invalid: ${this.characterId}`);
            return;
        }
        this.summon = this.character.summons.get(this.summonId);
        if (!this.character) {
            Pages.loadError(`Summon not found or invalid: ${this.summonId}`);
            return;
        }
        if (this.setTitle) App.setTitle(`Edit - ${this.summon.npc.name} - ${this.character.name}`);

        setTimeout(() => {
            Loader.onCollectionsLoaded(() => {
                if (self.loadId == loadId) self.delayedLoad();
            });
        }, 1);
    }

    delayedLoad() {
        this.structuredCharacterCreator = SummonEditorHelpers.generateStructuredHtmlForSummonEditor(this.character, this.summon, { startTab: this.getTab(), updateHash: true, updateTitle: this.setTitle });
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
