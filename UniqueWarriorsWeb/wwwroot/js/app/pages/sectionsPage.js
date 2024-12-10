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
        pageElement.appendChild(overview.container);

        this.stream = streamProvider(event => {
            if (event.registered) overview.addSection(event.obj, { insertBefore: event.insertBefore });
            else overview.removeSection(event.obj);
        });
    }

    unload() {
        if (this.stream) {
            this.stream.stop();
            this.stream = null;
        }
    }
}
