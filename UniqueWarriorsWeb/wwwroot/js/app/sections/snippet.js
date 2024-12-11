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

        if (this.whitelist == "tags") this.whitelist = ".section-tag, .section-headValue-name";
        if (this.blacklist == "tags") this.blacklist = ".section-tag, .section-headValue-name";
    }
}