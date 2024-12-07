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
            const sections = typeof this.sectionsProvider === "function"
                ? this.sectionsProvider()
                : this.sectionsProvider;
            const overview = SectionHelpers.generateStructuredHtmlForSectionOverview(sections, this.overviewType);
            pageElement.appendChild(overview.container);
        }
    }

    setupStream(streamProvider) {
        const sections = [];

        const overview = SectionHelpers.generateStructuredHtmlForSectionOverview(sections, this.overviewType);
        pageElement.appendChild(overview.container);

        this.stream = streamProvider((newSection) => {
            overview.addSection(newSection, this.overviewType);
        });
    }

    unload() {
        if (this.stream) {
            this.stream.stop();
            this.stream = null;
        }
    }
}
