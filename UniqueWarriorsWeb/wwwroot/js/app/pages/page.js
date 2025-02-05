
class Page {
    name;
    link;
    pageManager;
    pageElement;
    loadId;
    isLoaded = false;

    get id() {
        return this.link;
    }

    constructor(link, name, pageManager, settings = null) {
        this.name = name;
        this.link = link == '/' ? link : link ? `/app/${link}` : `/app/${name}`;
        this.pageManager = pageManager;
        this.settings = settings ?? {};

        this.setup();
    }

    setup() {
        this.pageManager.page = this;
        if (!this.settings.keepCase) this.name = toTextCase(this.name);
    }

    load(settings = null) {
        settings ??= {};
        this.isLoaded = this.pageManager.isLoaded = true;
        this.loadId = this.pageManager.loadId = generateUniqueId();
        this.pageElement = this.pageManager.pageElement = settings.pageElement ?? pageElement;
        this.pageManager.load(settings);
    }

    unload() {
        this.pageManager.unload();
        this.loadId = this.pageManager.loadId = null;
        this.isLoaded = false;
    }

    onHashChange() {
        this.pageManager.onHashChange?.();
    }
}

class PageManager {
    page;
    pageElement;

    load() {

    }

    unload() {

    }
}