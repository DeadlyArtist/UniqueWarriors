class HomePageManager extends PageManager {

    load() {
        let element = fromHTML(`<div class="listVertical">`);
        element.appendChild(fromHTML(`<h1 class="brand-text centeredText">Welcome to Cyberfantasy: Unique Warriors`));
        let link = fromHTML(`<a><h2 class="centeredText">A Cyberfantasy TTRPG created for epic combats in a mix of dystopian Cyberpunk, magical High Fantasy, and interdimensional SciFi.`);
        element.appendChild(link);
        link.setAttribute('href', "/app/rules");

        this.pageElement.appendChild(element);
    }

    unload() {

    }
}