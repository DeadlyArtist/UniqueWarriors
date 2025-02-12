class SkillsPageManager extends PageManager {
    tabOverride;
    tab;

    constructor(settings) {
        super();
        settings ??= {};
        this.tabOverride = settings.path;
        this.settings = settings;
    }

    load(settings = null) {
        settings ??= {};
        let self = this;
        let loadId = this.loadId;
        this.tab = this.tabOverride ?? window.localStorage.getItem('skill-overview-tab');
        setTimeout(() => {
            Loader.onCollectionsLoaded(() => {
                if (self.loadId == loadId) self.delayedLoad();
            });
        }, 1);
    }

    delayedLoad() {
        let tabBar = fromHTML(`<div class="listHorizontal gap-2 centerContentHorizontally">`);
        this.pageElement.appendChild(tabBar);

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
        window.localStorage.setItem('skill-overview-tab', tab.name);

        this.reloadTab();
    }

    generateGridHtml() {
        return SectionHelpers.generateStructuredHtmlForSectionOverview(Registries.skills.getAll(), SectionHelpers.MasonryType, { addSearch: true }).container;
    }

    generateTreeHtml() {
        return CharacterHelpers.generateSkillsOverviewHtml();
    }

    unload() {

    }
}
