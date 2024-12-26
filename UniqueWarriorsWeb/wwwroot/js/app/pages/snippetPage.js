class SnippetPageManager extends PageManager {
    pathOverride;
    path;

    constructor(settings) {
        super();
        settings ??= {};
        this.pathOverride = settings.path;
        this.settings = settings;
    }

    load(settings = null) {
        settings ??= {};
        let self = this;
        let loadId = this.loadId;
        this.path = this.pathOverride ?? getQueryVariable('path');
        setTimeout(() => {
            Loader.onCollectionsLoaded(() => {
                if (self.loadId == loadId) self.delayedLoad();
            });
        }, 1);
    }

    delayedLoad() {
        if (!this.path) {
            Pages.loadError('No path provided.');
            return;
        }

        let sections = null;
        try {
            sections = SectionHelpers.resolveMultipleSectionsExpression(this.path);
        } catch (e) { }
        if (!sections) {
            Pages.loadError(`Path not found or invalid: ${this.path}`);
            return;
        }
        this.pageElement.appendChild(SectionHelpers.generateStructuredHtmlForSectionOverview(sections, SectionHelpers.TextType).container);
    }

    unload() {

    }
}
