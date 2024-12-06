class HomePageManager extends PageManager {

    load() {
        pageElement.innerHTML = `Home<br><a href="${Pages.appPath}/rules">Rules</a>`;
    }

    unload() {

    }
}