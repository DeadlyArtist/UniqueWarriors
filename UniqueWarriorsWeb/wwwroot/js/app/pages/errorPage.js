class ErrorPageManager extends PageManager {
    errorMessage;

    load() {
        let html = fromHTML(`<div><h2 class="danger-text" style="margin-top:64px">Client Error</h2>${this.errorMessage}</div>`);
        this.pageElement.appendChild(html);
    }

    unload() {

    }
}