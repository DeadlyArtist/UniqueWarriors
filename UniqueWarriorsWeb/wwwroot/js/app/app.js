class App {
    static isRunning = false;
    static appLoaded = false;
    static afterAppLoaded = false;

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
        _tryRemoveEmptyHash();
    }

    static #onLoad() {
        Pages.loadFromPath();
    }

    static async onAppLoaded(callback = doNothing) {
        new Promise((resolve, reject) => {
            _callback = () => { callback(); resolve(); }
            if (this.appLoaded) {
                callback();
            } else {
                window.addEventListener('app-loaded', e => callback());
            }
        });
    }

    static async onAfterAppLoaded(callback = doNothing) {
        new Promise((resolve, reject) => {
            _callback = () => { callback(); resolve(); }
            if (this.afterAppLoaded) {
                callback();
            } else {
                window.addEventListener('after-app-loaded', e => callback());
            }
        });
    }

    static run() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.setup();
    }
}