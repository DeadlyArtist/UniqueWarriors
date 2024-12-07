
class Pages {
    static appPath = "/app";
    static lastServerUrl = null;

    static element = document.getElementById('page');
    static currentPage = null;

    static register(page) {
        return Registries.pages.register(page).obj;
    }

    static error = this.register(new Page(null, "error", new ErrorPageManager()));
    static home = this.register(new Page("/", "home", new HomePageManager()));

    // Game
    static rules = this.register(new Page(null, "rules", new SectionsPageManager(SectionHelpers.TextType, { registry: Registries.rules })));
    static techniques = this.register(new Page(null, "techniques", new SectionsPageManager(SectionHelpers.MasonryType, { registry: Registries.techniques })));
    static masteries = this.register(new Page(null, "masteries", new SectionsPageManager(SectionHelpers.MasonryType, { registry: Registries.masteries })));
    static summons = this.register(new Page(null, "summons", new SectionsPageManager(SectionHelpers.MasonryType, { registry: Registries.summons })));
    static conditions = this.register(new Page(null, "conditions", new SectionsPageManager(SectionHelpers.MasonryType, { registry: Registries.conditions })));

    static setup() {
        document.addEventListener('click', e => this._handleNavigation(e));
        this.setupSidebar();
    }

    static setupSidebar() {
        let sidebarPages = [
            this.home,
            this.rules,
            this.techniques,
            this.masteries,
            this.summons,
            this.conditions,
        ];

        for (let page of sidebarPages) {
            let link = fromHTML(`<a class="element sidebarElement hoverable">`);
            link.setAttribute('href', page.link);
            link.textContent = page.name;

            sidebarListElement.appendChild(link);
        }
    }

    static _handleNavigation(event) {
        var target = event.target.closest('a[href]');
        if (!target) return;
        var href = target.getAttribute('href');
        var domain = getDomain(href);
        if (domain != null && domain != getDomain()) return;
        if (!this.isPagePath(href)) return;

        event.preventDefault();
        goToUrlWithoutRequest(href);
    }

    static isHomePath(path = null) {
        path ??= getUrl();
        path = getPath(path);
        return path.length == 0 || path == "/";
    }

    static isAppPath(path = null) {
        path ??= getUrl();
        path = getPath(path);
        return path.includes(this.appPath);
    }

    static isPagePath(path = null) {
        return this.isHomePath(path) || this.isAppPath(path);
    }

    static goToPath(path) {
        goToUrlWithoutRequest(path);
    }

    static goTo(page) {
        goToPath(page.link);
    }

    static goToError(message) {
        this.error.errorMessage = message;
        this.goTo(this.error);
    }

    static loadFromPath(path = null) {
        if (path != null) {
            this.goToPath(path);
            return;
        }
        path = getPath();
        if (path == '/app/' || path == '/app') {
            path = '/';
            replaceUrl(getUrlWithChangedPath(path));
        }

        var newServerUrl = getServerUrl();
        if (newServerUrl == this.lastServerUrl) return;
        this.lastServerUrl = newServerUrl;


        let page = null;
        if (this.isHomePath(path)) {
            page = Pages.home;
        } else if (this.isAppPath(path)) {
            path = getSubstringStartingWith(path, this.appPath);
            page = Registries.pages.get(path);
        }

        this.load(page);
    }

    static load(page) {
        if (page == null) {
            this.loadError(`Page doesn't exist.`);
            return;
        }

        if (this.currentPage) {
            this.currentPage.unload();
            this.currentPage = null;
        }

        pageElement.innerHTML = '';

        this.currentPage = page;
        page.load();
    }

    static loadError(message) {
        this.error.pageManager.errorMessage = message;
        this.load(this.error);
    }
}

Pages.setup();

const pageElement = Pages.element;