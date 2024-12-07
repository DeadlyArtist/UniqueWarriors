
const _htmlStringHelpers = {
    escapeHtmlChars: {
        '¢': 'cent',
        '£': 'pound',
        '¥': 'yen',
        '€': 'euro',
        '©': 'copy',
        '®': 'reg',
        '<': 'lt',
        '>': 'gt',
        '"': 'quot',
        '&': 'amp',
        '\'': '#39',
    },
    getEscapeHtmlRegex() {
        let escapeHtmlRegexString = '[';
        for (let key in _htmlStringHelpers.escapeHtmlChars) {
            escapeHtmlRegexString += key;
        }
        escapeHtmlRegexString += ']';
        const regex = new RegExp(escapeHtmlRegexString, 'g');
        return regex;
    },
    htmlEntities: {
        nbsp: ' ',
        cent: '¢',
        pound: '£',
        yen: '¥',
        euro: '€',
        copy: '©',
        reg: '®',
        lt: '<',
        gt: '>',
        quot: '"',
        amp: '&',
        apos: '\''
    },
};
_htmlStringHelpers.escapeHtmlRegex = _htmlStringHelpers.getEscapeHtmlRegex();

function escapeHTML(str) {
    return str.replace(_htmlStringHelpers.escapeHtmlRegex, function (m) {
        return '&' + _htmlStringHelpers.escapeHtmlChars[m] + ';';
    });
}
function unescapeHTML(str) {
    return str.replace(/\\&([^;]+);/g, function (entity, entityCode) {
        let match;

        if (entityCode in _htmlStringHelpers.htmlEntities) {
            return _htmlStringHelpers.htmlEntities[entityCode];
            /*eslint no-cond-assign: 0*/
        } else if (match = entityCode.match(/^#x([\\da-fA-F]+)$/)) {
            return String.fromCharCode(parseInt(match[1], 16));
            /*eslint no-cond-assign: 0*/
        } else if (match = entityCode.match(/^#(\\d+)$/)) {
            return String.fromCharCode(~~match[1]);
        } else {
            return entity;
        }
    });
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function unescapeRegex(string) {
    return string.replace(/\\([.*+?^${}()|[\]\\])/g, '$1');  // $1 refers to the captured group
}

function escapeReplacement(string) {
    return string.replace(/\$/g, '$$$$');
}

function escapeCamelCase(name) {
    const parts = escapeFileName(name).replace('\.\-', ' ').replace('( )*', ' ').trim().split(' ');
    if (parts[0].length != 0) parts[0] = parts[0][0].toLowerCase() + parts[0].slice(1);
    for (let i = 1; i < parts.length; i++) {
        if (parts[i].length != 0) parts[i] = parts[i][0].toUpperCase() + parts[i].slice(1);
    }
    return parts.join('');
}

function removeFirstChar(str) {
    return str.substring(1);
}
function removeLastChar(str) {
    return str.substring(0, str.length - 1);
}

function isString(str, orNull = false) {
    return (orNull && str == null) || typeof str === 'string' || str instanceof String;
}

function getStringByteSize(string) {
    string.length * 2;
}

function addIndent(string, spaces = 4) {
    return string.split('\n').map(l => ' '.repeat(spaces) + l).join('\n');
}
function getIndexBeyond(string, searchTerm, startIndex = 0) {
    const nextIndex = string.indexOf(searchTerm, startIndex);
    if (nextIndex === -1) return null;
    const newIndex = nextIndex + searchTerm.length;
    if (newIndex === searchTerm.length) return null;
    return nextIndex;
}

function getSubstringAfterOrNull(string, searchTerm, startIndex = 0) {
    const searchIndex = string.indexOf(searchTerm, startIndex);
    if (searchIndex === -1) return null;
    return string.slice(searchIndex + searchTerm.length);
}

function getSubstringAfter(string, searchTerm, startIndex = 0) {
    const searchIndex = string.indexOf(searchTerm, startIndex);
    return searchIndex === -1 ? string : string.slice(searchIndex + searchTerm.length);
}

function getSubstringBeforeOrNull(string, searchTerm, startIndex = 0) {
    const searchIndex = string.indexOf(searchTerm, startIndex);
    if (searchIndex === -1) return null;
    return string.slice(0, searchIndex);
}

function getSubstringBefore(string, searchTerm, startIndex = 0) {
    const searchIndex = string.indexOf(searchTerm, startIndex);
    return searchIndex === -1 ? string : string.slice(0, searchIndex);
}

function getSubstringAfterLastOrNull(string, searchTerm, endIndex = null) {
    const adjustedEndIndex = endIndex !== null ? endIndex : string.length;
    const lastIndex = string.lastIndexOf(searchTerm, adjustedEndIndex);
    if (lastIndex === -1) return null;
    return string.slice(lastIndex + searchTerm.length, adjustedEndIndex);
}

function getSubstringAfterLast(string, searchTerm, endIndex = null) {
    const adjustedEndIndex = endIndex !== null ? endIndex : string.length;
    const lastIndex = string.lastIndexOf(searchTerm, adjustedEndIndex);
    return lastIndex === -1 ? '' : string.slice(lastIndex + searchTerm.length, adjustedEndIndex);
}

function getSubstringBeforeLastOrNull(string, searchTerm, endIndex = null) {
    const adjustedEndIndex = endIndex !== null ? endIndex : string.length;
    const lastIndex = string.lastIndexOf(searchTerm, adjustedEndIndex);
    if (lastIndex === -1) return null;
    return string.slice(0, lastIndex);
}

function getSubstringBeforeLast(string, searchTerm, endIndex = null) {
    const adjustedEndIndex = endIndex !== null ? endIndex : string.length;
    const lastIndex = string.lastIndexOf(searchTerm, adjustedEndIndex);
    return lastIndex === -1 ? string : string.slice(0, lastIndex);
}

function getSubstringStartingWith(string, searchTerm, startIndex = 0) {
    const searchIndex = string.indexOf(searchTerm, startIndex);
    return searchIndex === -1 ? '' : string.slice(searchIndex);
}

function getSubstringStartingWithOrNull(string, searchTerm, startIndex = 0) {
    const searchIndex = string.indexOf(searchTerm, startIndex);
    return searchIndex === -1 ? null : string.slice(searchIndex);
}

function getSubstringStartingWithLast(string, searchTerm, endIndex = null) {
    const adjustedEndIndex = endIndex !== null ? endIndex : string.length;
    const lastIndex = string.lastIndexOf(searchTerm, adjustedEndIndex);
    return lastIndex === -1 ? '' : string.slice(lastIndex);
}

function getSubstringStartingWithLastOrNull(string, searchTerm, endIndex = null) {
    const adjustedEndIndex = endIndex !== null ? endIndex : string.length;
    const lastIndex = string.lastIndexOf(searchTerm, adjustedEndIndex);
    return lastIndex === -1 ? null : string.slice(lastIndex);
}


function toNormalCase(text) {
    text = text.replace(/_/g, ' ');
    return text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}