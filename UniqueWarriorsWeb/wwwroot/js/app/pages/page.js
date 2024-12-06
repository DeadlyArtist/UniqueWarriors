
class Page {
    name;
    link;
    pageManager;

    get id() {
        return this.link;
    }

    constructor(link, name, pageManager) {
        this.name = name;
        this.link = link ?? `/${name}`;
        this.pageManager = pageManager;
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