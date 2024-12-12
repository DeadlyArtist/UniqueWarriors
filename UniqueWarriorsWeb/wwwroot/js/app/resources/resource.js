class Resource {
    loaded = false;

    get id() {
        return this.link;
    }

    constructor(link, preload = false) {
        this.link = link;
        this.preload = preload;

        let self = this;
        if (preload) App.onAfterAppLoaded(() => self.cache());
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

    async cache() {
        // Add to service worker cache
        const cache = await caches.open("offline-cache");
        await cache.add(this.link).catch(err => {
            //console.error(`Failed to cache resource: ${resourceUrl}`, err)
        });

        // Preload into app-level fetch cache for runtime access
        await fetchWithCache(this.link);
    }
}

