class App {
    static isRunning = false;
    static appLoaded = false;
    static afterAppLoaded = false;
    static titleSuffix = " - Unique Warriors | Cyberfantasy";
    static name = "Cyberfantasy: Unique Warriors";
    static securityId = "_cyberfantasy_unique_warriors_123";
    static version = "2.0.0";

    static setup() {
        window.addEventListener('hashchange', this.#onHashChange);
        window.addEventListener('load', this.#onLoad);
        window.addEventListener('load-silently', this.#onLoad);
        window.addEventListener('popstate', this.#onLoad);

        this.appLoaded = true;
        window.dispatchEvent(new CustomEvent('app-loaded'));
        this.afterAppLoaded = true;
        window.dispatchEvent(new CustomEvent('after-app-loaded'));
    }

    static #onHashChange() {
        Pages.onHashChange();
    }

    static #onLoad() {
        Pages.loadFromPath();
    }

    static async onAppLoaded(callback = doNothing) {
        return new Promise((resolve, reject) => {
            let _callback = () => { callback(); resolve(); }
            if (this.appLoaded) {
                _callback();
            } else {
                window.addEventListener('app-loaded', e => _callback());
            }
        });
    }

    static async onAfterAppLoaded(callback = doNothing) {
        return new Promise((resolve, reject) => {
            let _callback = () => { callback(); resolve(); }
            if (this.afterAppLoaded) {
                _callback();
            } else {
                window.addEventListener('after-app-loaded', e => _callback());
            }
        });
    }

    static setTitle(title, addTitleSuffix = true) {
        if (addTitleSuffix) title += this.titleSuffix;
        document.title = title;
    }

    static getJsonPrototype(type, content) {
        return {
            securityId: App.securityId,
            source: App.name,
            version: App.version,
            type,
            content,
        }
    }

    static async parseExternalFile(file, type = null) {
        let json = await FileHelpers.getJson(file);
        if (json.securityId != this.securityId) return;
        if (type != null && json.type != type) return;
        return json;
    }

    static async parseExternalFileContent(file, type = null) {
        return (await this.parseExternalFile(file, type))?.content;
    }

    static run() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.setup();
    }
}