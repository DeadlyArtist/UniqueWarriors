class App {
    static isRunning = false;

    static setup() {
        window.addEventListener('hashchange', this.#onHashChange);
        window.addEventListener('load', this.#onLoad);
        window.addEventListener('load-silently', this.#onLoad);

        window.dispatchEvent(new CustomEvent('app-loaded'));
    }

    static #onHashChange() {
        _tryRemoveEmptyHash();
    }

    static #onLoad() {
        Pages.loadFromPath();
    }

    static onLoaded(callback) {
        if (this.isRunning) {
            callback();
        } else {
            window.addEventListener('app-loaded', e => callback());
        }
    }

    static run() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.setup();

        Pages.loadFromPath();

        Resources.preloadAll();
    }
}