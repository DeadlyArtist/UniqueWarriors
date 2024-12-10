class HomePageManager extends PageManager {

    load() {
        let element = fromHTML(`<div class="listVertical">`);
        element.appendChild(fromHTML(`<h1>Welcome to Unique Warriors`));
        let link = fromHTML(`<a><h2>A Cyberfantasy TTRPG created for epic combats in a mix of magical High Fantasy and epic SciFi.`);
        element.appendChild(link);
        link.setAttribute('href', "/app/techniques");

        pageElement.appendChild(element);
    }

    unload() {

    }
}