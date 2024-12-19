class SearchAllPageManager extends PageManager {
    static pages;

    load() {
        let container = fromHTML(`<div class="listVertical smallGap children-w-100">`);
        let searchContainer = fromHTML(`<div class="sticky">`);
        container.appendChild(searchContainer);
        let subContainer = fromHTML(`<div class="listVertical largeGap children-w-100">`);
        container.appendChild(subContainer);
        let promises = [];
        for (let page of SearchAllPageManager.pages) {
            let pageContainer = fromHTML(`<div class="children-w-100">`);
            subContainer.appendChild(pageContainer);
            let header = fromHTML(`<h1 class="xl-title">`);
            pageContainer.appendChild(header);
            header.textContent = page.name;
            let element = fromHTML(`<div class="children-w-100">`);
            pageContainer.appendChild(element);
            page.load({ pageElement: element, noSearchBar: true});
            promises.push(page.pageManager.onOverviewLoaded());
        }

        let loadId = this.loadId;
        Promise.allSettled(promises).then(() => {
            if (this.loadId != loadId) return;
            this.search = new SectionSearch(searchContainer, SearchAllPageManager.pages.map(page => page.pageManager.overview));
            this.pageElement.appendChild(container);
        });

    }

    unload() {
        for (let page of SearchAllPageManager.pages) {
            page.unload();
        }
    }
}

App.onAppLoaded(() => SearchAllPageManager.pages = [Pages.rules, Pages.techniques, Pages.masteries, Pages.summons, Pages.conditions]);