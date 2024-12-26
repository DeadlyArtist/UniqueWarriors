

function getUrl() {
    return window.location.href;
}

function getUrlBase(url = null) {
    url ??= window.location.href;
    url = getSubstringBefore(url, '#');
    url = getSubstringBefore(url, '?');
    return url;
}

function getUrlModifiers(url = null) {
    url ??= window.location.href;
    hash = url.indexOf('#');
    query = url.indexOf('?');
    if (hash == query) return "";

    var first = query;
    if (hash < query) {
        if (hash != -1) first = hash;
    } else {
        if (query == -1) first = hash;
    }
    url = url.substring(first);

    return url;
}

function getServerUrl(url = null) {
    url ??= window.location.href;
    url = getSubstringBefore(url, '#');
    return url;
}

function getPath(url = null) {
    url ??= window.location.href;
    url = getSubstringBefore(url, '#');
    url = getSubstringBefore(url, '?');
    const domainEndIndex = url.indexOf('//') >= 0 ? url.indexOf('/', url.indexOf('//') + 2) : url.indexOf('/');
    if (domainEndIndex === -1) return '/';
    return url.substring(domainEndIndex);
}

function getDomain(url = null) {
    url ??= window.location.href;
    url = getSubstringBefore(url, '#');
    url = getSubstringBefore(url, '?');
    const doubleSlashIndex = url.indexOf('//');
    const domainStartIndex = (doubleSlashIndex >= 0) ? doubleSlashIndex + 2 : 0;
    const domainEndIndex = url.indexOf('/', domainStartIndex);
    if (domainEndIndex === -1) url = url.substring(domainStartIndex);
    url = url.substring(domainStartIndex, domainEndIndex);

    if (!url.includes('.') || url.length == 0) return null;
    return url;
}

function getOrigin(url = null) {
    url ??= window.location.href;
    url = getSubstringBefore(url, '#');
    url = getSubstringBefore(url, '?');
    const doubleSlashIndex = url.indexOf('//');
    const protocol = doubleSlashIndex >= 0 ? url.substring(0, doubleSlashIndex + 2) : '';
    const domain = getDomain(url);
    return protocol + domain;
}

function getProtocol(url = null) {
    url ??= window.location.href;
    const protocolEndIndex = url.indexOf(':');
    if (protocolEndIndex === -1) return '';
    return url.substring(0, protocolEndIndex);
}

function getUrlWithChangedPath(newPath, url = null) {
    url ??= window.location.href;
    const origin = getOrigin(url), modifiers = getUrlModifiers(url);
    if (!newPath.startsWith('/')) newPath = '/' + newPath;
    return origin + newPath + modifiers;
}

function getUrlWithChangedHash(newHash, url = null) {
    url ??= window.location.href;
    const base = getUrlBase(url), query = getSubstringBefore(getUrlModifiers(url), '#');
    if (!newHash.startsWith('#')) newHash = '#' + newHash;
    return base + query + newHash;
}

function getUrlWithChangedDomain(newDomain, url = null) {
    url ??= window.location.href;
    const protocol = getProtocol(url), path = getPath(url), modifiers = getUrlModifiers(url);
    return `${protocol}://${newDomain}${path}${modifiers}`;
}

function getUrlWithChangedOrigin(newOrigin, url = null) {
    url ??= window.location.href;
    const path = getPath(url), modifiers = getUrlModifiers(url);
    if (newOrigin.endsWith('/')) newOrigin = newOrigin.slice(0, -1);
    return `${newOrigin}${path}${modifiers}`;
}

function getUrlWithChangedProtocol(newProtocol, url = null) {
    url ??= window.location.href;
    const domain = getDomain(url), path = getPath(url), modifiers = getUrlModifiers(url);
    if (!newProtocol.endsWith(':')) newProtocol += ':';
    return `${newProtocol}//${domain}${path}${modifiers}`;
}

function getQueryVariable(variable, url = null) {
    url ??= window.location.href;
    const query = url.split('?')[1];
    if (!query) return undefined;

    const vars = query.split('&');
    for (const pair of vars) {
        const [key, value] = pair.split('=');
        if (key == variable) return decodeURIComponent(value);
    }
    return undefined;
}



function goToUrl(url) {
    window.location.href = url;
}

function replaceUrl(newUrl) {
    history.replaceState(null, "", newUrl);
}

const loadWithoutRequestEvent = new CustomEvent('load-silently');
// Update the browser's URL without reloading the page
function goToUrlWithoutRequest(url) {
    window.history.pushState({}, '', url);
    window.dispatchEvent(loadWithoutRequestEvent);
}

function createObjectUrl(object, options = undefined) {
    const blob = new Blob([object], options);
    const blobUrl = URL.createObjectURL(blob);
    return blobUrl;
}