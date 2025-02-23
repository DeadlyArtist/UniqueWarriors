
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
    static searchAll = this.register(new Page("search", "Search All", new SearchAllPageManager()));

    // Game
    static rules = this.register(new Page(null, "rules", new SectionsPageManager(SectionHelpers.TextType, { registry: Registries.rules })));
    static neontris = this.register(new Page(null, "neontris", new SectionsPageManager(SectionHelpers.TextType, { registry: Registries.neontris })));
    static ancestries = this.register(new Page(null, "ancestries", new SectionsPageManager(SectionHelpers.MasonryType, { registry: Registries.ancestries })));
    static defaultAbilities = this.register(new Page(null, "defaultAbilities", new SectionsPageManager(SectionHelpers.MasonryType, { registry: Registries.defaultAbilities })));
    static techniques = this.register(new Page(null, "techniques", new SectionsPageManager(SectionHelpers.MasonryType, { registry: Registries.techniques })));
    static masteries = this.register(new Page(null, "masteries", new SectionsPageManager(SectionHelpers.MasonryType, { registry: Registries.masteries })));
    static summons = this.register(new Page(null, "summons", new SectionsPageManager(SectionHelpers.MasonryType, { registry: Registries.summons })));
    static skills = this.register(new Page(null, "skills", new SkillsPageManager()));
    static shop = this.register(new Page(null, "shop", new SectionsPageManager(SectionHelpers.MasonryType, { registry: Registries.items })));
    static conditions = this.register(new Page(null, "conditions", new SectionsPageManager(SectionHelpers.MasonryType, { registry: Registries.conditions })));
    static characters = this.register(new Page(null, "characters", new CharactersPageManager({ registry: Registries.characters })));
    static character = this.register(new Page(null, "character", new CharacterPageManager()));
    static characterCreator = this.register(new Page("character/creator", "character creator", new CharacterCreatorPageManager()));
    static summonEditor = this.register(new Page("summon/editor", "summon edtior", new SummonEditorPageManager()));

    static snippet = this.register(new Page(null, "snippet", new SnippetPageManager()));

    static setup() {
        document.addEventListener('click', e => this._handleNavigation(e));
        this.setupSidebar();
    }

    static setupSidebar() {
        let sidebarPages = [
            this.home,
            this.rules,
            this.neontris,
            this.ancestries,
            this.skills,
            this.techniques,
            this.masteries,
            this.summons,
            this.shop,
            this.conditions,
            this.defaultAbilities,
            this.characters,
        ];

        let sidebarBottomPages = [
            this.searchAll,
        ];

        for (let page of sidebarPages) {
            sidebarListElement.appendChild(this.getSidebarElement(page));
        }

        for (let page of sidebarBottomPages) {
            sidebarBottomListElement.appendChild(this.getSidebarElement(page));
        }
    }

    static getSidebarElement(page) {
        let link = fromHTML(`<a class="element sidebarElement borderedHoverable">`);
        link.setAttribute('href', page.link);
        link.textContent = page.name;
        return link;
    }

    static _handleNavigation(event) {
        let target = event.target.closest('a[href]');
        if (!target) return;
        let href = target.getAttribute('href');
        let domain = getDomain(href);
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
        this.goToPath(page.link);
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

        let newServerUrl = getServerUrl();
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
        App.setTitle(page.name);
        page.load();
    }

    static loadError(message) {
        App.setTitle("Error");
        this.error.pageManager.errorMessage = message;
        this.load(this.error);
    }

    static reload() {
        this.load(this.currentPage);
    }

    static onHashChange() {
        this.currentPage?.onHashChange();
    }
}
Pages.setup();
App.onAppLoaded(() => Pages.loadFromPath());

const pageElement = Pages.element;