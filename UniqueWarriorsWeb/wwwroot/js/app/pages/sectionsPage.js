class SectionsPageManager extends PageManager {
    stream = null;
    overview;
    noSearchBar = false;

    constructor(overviewType, settings) {
        super();
        settings ??= {};
        this.overviewType = overviewType;
        this.settings = settings;
        this.sectionsProvider = settings.sectionsProvider ?? [];
    }

    load(settings = null) {
        settings ??= {};
        let self = this;
        let loadId = this.loadId;
        this.noSearchBar = !!settings.noSearchBar;
        this.overview = null;
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
            const sections = isFunction(this.sectionsProvider) ? this.sectionsProvider() : this.sectionsProvider;
            const overview = SectionHelpers.generateStructuredHtmlForSectionOverview(sections, this.overviewType, { ...(this.settings.settings ?? {}), addSearch: !this.noSearchBar });
            this.overview = overview;
            this.sendOverviewEvent();
            this.pageElement.appendChild(overview.container);
        }
    }

    setupStream(streamProvider) {
        const overview = SectionHelpers.generateStructuredHtmlForSectionOverview([], this.overviewType, { ...(this.settings.settings ?? {}), addSearch: !this.noSearchBar, dontInitSearch: true });
        this.stream = streamProvider(event => {
            if (event.registered) overview.addSection(event.obj, { insertFirst: event.insertFirst, insertBefore: event.insertBefore });
            else overview.removeSection(event.obj);
        });
        overview.initSearch();
        this.overview = overview;
        this.sendOverviewEvent();
        this.pageElement.appendChild(overview.container);
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
