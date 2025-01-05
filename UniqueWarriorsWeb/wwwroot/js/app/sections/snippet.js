class Snippet {
    get id() {
        return this.target;
    }

    constructor(target, path, settings = null) {
        settings ??= {};
        this.target = target;
        this.path = path;
        this.whitelist = settings.whitelist;
        this.blacklist = settings.blacklist;

        if (this.whitelist == "tags") this.whitelist = Snippets.tagQuery;
        if (this.blacklist == "tags") this.blacklist = Snippets.tagQuery;
    }
}