class SkillsPageManager extends PageManager {
    tabOverride;
    tab;

    constructor(settings) {
        super();
        settings ??= {};
        this.settings = settings;
    }

    load(settings = null) {
        settings ??= {};
        let self = this;
        let loadId = this.loadId;
        this.tabOverride = settings.path;
        this.noSearchBar = !!settings.noSearchBar;
        this.tab = this.tabOverride ?? window.localStorage.getItem('skill-overview-tab');
        setTimeout(() => {
            Loader.onCollectionsLoaded(() => {
                if (self.loadId == loadId) self.delayedLoad();
            });
        }, 1);
    }

    delayedLoad() {
        let tabBar = fromHTML(`<div class="listHorizontal gap-2 centerContentHorizontally">`);
        if (!this.tabOverride) this.pageElement.appendChild(tabBar);

        let tabs = this.tabs = [
            { name: "Grid", provider: tab => this.generateGridHtml(), },
            { name: "Tree", provider: tab => this.generateTreeHtml(), },
        ];
        this.tabsByName = new Map(tabs.map(tab => [tab.name, tab]));
        this.currentTab = this.tabsByName.get(this.tab) ?? tabs[0];

        for (let tab of tabs) {
            let element = tab.tabElement = fromHTML(`<button class="skillsOverview-tab largeElement raised bordered-inset hoverable hideDisabled">`);
            tabBar.appendChild(element);
            element.textContent = tab.name;
            element.addEventListener('click', () => {
                this.openTab(tab)
            });
        }

        this.pageElement.appendChild(hb(2));

        let tabElement = this.tabElement = fromHTML(`<div>`);
        this.pageElement.appendChild(tabElement);

        this.reloadTab();
        this.sendOverviewEvent();
    }

    updateTabBar() {
        for (let tab of this.tabs) {
            if (tab == this.currentTab) {
                tab.tabElement.classList.add('raised');
                tab.tabElement.classList.add('bordered-inset');
                tab.tabElement.classList.remove('hoverable');
                tab.tabElement.setAttribute('disabled', '');
            } else {
                tab.tabElement.classList.remove('raised');
                tab.tabElement.classList.remove('bordered-inset');
                tab.tabElement.classList.add('hoverable');
                tab.tabElement.removeAttribute('disabled');
            }
        }
    }

    reloadTab() {
        this.updateTabBar();

        this.tabElement.innerHTML = '';
        this.tabElement.appendChild(this.currentTab.provider());
    }

    openTab(tab) {
        if (isString(tab)) tab = this.tabsByName.get(tab);
        if (!tab || tab == this.currentTab) return;

        this.currentTab = tab;
        if (!this.tabOverride) window.localStorage.setItem('skill-overview-tab', tab.name);

        this.reloadTab();
    }

    generateGridHtml() {
        const overview = SectionHelpers.generateStructuredHtmlForSectionOverview(Registries.skills.getAll(), SectionHelpers.MasonryType, { ...(this.settings.settings ?? {}), addSearch: !this.noSearchBar, tooltips: "tagsOnly" });
        this.overview = overview;
        return overview.container;
    }

    generateTreeHtml() {
        return CharacterHelpers.generateSkillsOverviewHtml();
    }

    sendOverviewEvent() {
        window.dispatchEvent(new CustomEvent(this.loadId + "__Overview"));
    }

    async onOverviewLoaded(callback = doNothing) {
        return new Promise((resolve, reject) => {
            let _callback = () => { callback(); resolve(); }
            if (this.overview) {
                _callback();
            } else {
                window.addEventListener(this.loadId + "__Overview", e => _callback());
            }
        });
    }

    unload() {

    }
}
