class SectionsPageManager extends PageManager {
    stream = null;

    constructor(overviewType, settings) {
        super();
        settings ??= {};
        this.overviewType = overviewType;
        this.settings = settings;
        this.sectionsProvider = settings.sectionsProvider ?? [];
    }

    load() {
        let self = this;
        let loadId = this.loadId;
         setTimeout(() => {
             Loader.onCollectionsLoaded(() => {
                 if (self.loadId == loadId) self.delayedLoad()
             });
         }, 1);
    }

    delayedLoad() {
        let streamProvider = this.settings.streamProvider;
        if (this.settings.registry) streamProvider = callback => this.settings.registry.stream(callback);

        if (streamProvider) {
            this.setupStream(streamProvider);
        } else {
            const sections = isFunction(this.sectionsProvider) ? this.sectionsProvider() : this.sectionsProvider;
            const overview = SectionHelpers.generateStructuredHtmlForSectionOverview(sections, this.overviewType);
            pageElement.appendChild(overview.container);
        }
    }

    setupStream(streamProvider) {
        const sections = [];

        const overview = SectionHelpers.generateStructuredHtmlForSectionOverview(sections, this.overviewType);

        this.stream = streamProvider(event => {
            if (event.registered) overview.addSection(event.obj, { insertBefore: event.insertBefore });
            else overview.removeSection(event.obj);
        });

        pageElement.appendChild(overview.container);
    }

    unload() {
        if (this.stream) {
            this.stream.stop();
            this.stream = null;
        }
    }
}
