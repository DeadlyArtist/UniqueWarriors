class Resource {
    loaded = false;

    get id() {
        return this.link;
    }

    constructor(link, preload = false) {
        this.link = link;
        this.preload = preload;
    }

    async get() {
        let result = await fetchWithCache(this.link);
        this.onLoaded();
        return result;
    }

    async getText() {
        let result = await fetchTextWithCache(this.link);
        this.onLoaded();
        return result;
    }

    async getFromJson() {
        let result = await fetchFromJsonWithCache(this.link);
        this.onLoaded();
        return result;
    }

    onLoaded() {
        if (this.loaded) return;
        this.loaded = true;
    }
}