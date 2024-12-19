
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
        if (!this.settings.keepCase) this.name = toNormalCase(this.name);
    }

    load(element = pageElement) {
        this.isLoaded = this.pageManager.isLoaded = true;
        this.loadId = this.pageManager.loadId = generateUniqueId();
        this.pageElement = this.pageManager.pageElement = element;
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
    pageElement;

    load() {

    }

    unload() {

    }
}