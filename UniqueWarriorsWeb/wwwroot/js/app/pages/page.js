
class Page {
    name;
    link;
    pageManager;
    loadId;
    isLoaded = false;

    get id() {
        return this.link;
    }

    constructor(link, name, pageManager, settings = null) {
        this.name = name;
        this.link = link ?? `/app/${name}`;
        this.pageManager = pageManager;
        this.settings = settings ?? {};

        this.setup();
    }

    setup() {
        this.pageManager.page = this;
        if (!this.settings.keepCase) this.name = toNormalCase(this.name);
    }

    load() {
        this.isLoaded = true;
        this.loadId = generateUniqueId();
        this.pageManager.load();
    }

    unload() {
        this.pageManager.unload();
        this.loadId = null;
        this.isLoaded = false;
    }
}

class PageManager {
    page;
    get isLoaded() {
        return this.page.isLoaded;
    }

    get loadId() {
        return this.page.loadId;
    }

    load() {

    }

    unload() {

    }
}