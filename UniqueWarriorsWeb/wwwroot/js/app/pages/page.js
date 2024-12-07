
class Page {
    name;
    link;
    pageManager;

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
        if (!this.settings.keepCase) this.name = toNormalCase(this.name);
    }

    load() {
        this.pageManager.load();
    }

    unload() {
        this.pageManager.unload();
    }
}

class PageManager {
    load() {

    }

    unload() {

    }
}