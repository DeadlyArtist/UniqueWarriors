class HomePageManager extends PageManager {

    load() {
        let element = fromHTML(`<div class="listVertical">`);
        element.appendChild(fromHTML(`<h1>Welcome to Unique Warriors`));
        element.appendChild(fromHTML(`<a><h2>A Cyberfantasy TTRPG created for epic combats in a mix of magical High Fantasy and epic SciFi.`));
        pageElement.appendChild(element);
    }

    unload() {

    }
}