class App {
    static isRunning = false;

    static setup() {
        window.addEventListener('hashchange', this.#onHashChange);
        window.addEventListener('load', this.#onLoad);
        window.addEventListener('load-silently', this.#onLoad);
        window.addEventListener('popstate', this.#onLoad);

        window.dispatchEvent(new CustomEvent('app-loaded'));
        window.dispatchEvent(new CustomEvent('after-app-loaded'));
    }

    static #onHashChange() {
        _tryRemoveEmptyHash();
    }

    static #onLoad() {
        Pages.loadFromPath();
    }

    static onAppLoaded(callback) {
        if (this.isRunning) {
            callback();
        } else {
            window.addEventListener('app-loaded', e => callback());
        }
    }

    static onAfterAppLoaded(callback) {
        if (this.isRunning) {
            callback();
        } else {
            window.addEventListener('after-app-loaded', e => callback());
        }
    }

    static run() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.setup();
    }
}