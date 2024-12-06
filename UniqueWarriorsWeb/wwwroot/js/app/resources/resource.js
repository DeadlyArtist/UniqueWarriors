class Resource {
    get id() {
        return this.link;
    }

    constructor(link, preload = false) {
        this.link = link;
        this.preload = preload;
    }

    async get() {
        return await fetchWithCache(this.link);
    }

    async getText() {
        return await fetchTextWithCache(this.link);
    }

    async getJson() {
        return await fetchJsonWithCache(this.link);
    }
}