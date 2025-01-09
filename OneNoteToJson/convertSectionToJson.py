import klembord as kl
import json
import os
import re
import html as htmlHelpers

# !!!CHANGE BELOW BEFORE RUNNING!!!
jsonpath = 'help.json'
text = True
title = None
# !!!CHANGE ABOVE BEFORE RUNNING!!!

# Can change below if needed
outputdirectorypath = 'SectionOutput'
# Can change above if needed

class RawSection:
    def __init__(self, title: str, height: int, paragraphs: list[str], table: list[list[str]], tableHeaderLocation: str):
        self.title = title
        self.height = height
        self.paragraphs = paragraphs
        self.table = table
        self.tableHeaderLocation = tableHeaderLocation
        self.subsections = [] # type: list[RawSection]

tagType = "tag"
headValueType = "headValue"
class Attribute:
    def __init__(self, type: str, parts: list[str], separators: list[str] = []):
        self.Type = type
        self.Parts = parts
        self.Separators = separators

class Section:
    def __init__(self, title: str, height: int, attributes: list[list[Attribute]] = None, content: str = None, table: list[list[str]] = None, tableHeaderLocation: str = None, subSections: list = None):
        self.Title = title
        self.Height = height
        self.Attributes = attributes or []
        self.Content = content
        self.Table = table
        self.TableHeaderLocation = tableHeaderLocation
        self.SubSections = subSections or [] # type: list[Section]

def substring_after_first(s, delim):
    return s[s.index(delim) + len(delim):]

def substring_after_first_or_empty(s, delim):
    index = s.find(delim)
    if (index == -1):
        return ""
    return s[index + len(delim):]

def substring_before_first(s, delim):
    return s[:s.index(delim)]

def substring_before_first_or_full(s, delim):
    index = s.find(delim)
    if (index == -1):
        return s
    return s[:index]

def substring_before_first_or_empty(s, delim):
    index = s.find(delim)
    if (index == -1):
        return ""
    return s[:index]

def substring_after_last(s, delim):
    return s[s.rindex(delim) + len(delim):]

def substring_before_last(s, delim):
    return s[:s.rindex(delim)]

def findNextHeader(s, maxdepth = -1):
    current = ""
    if (maxdepth == -1):
        maxdepth = 9
    for i in range(len(s)):
        if (s[i] == "<"):
            current = "<"
        elif (current == "<" and s[i] == "h"):
            current = "<h"
        elif (current == "<h" and s[i].isdigit() and int(s[i]) <= maxdepth):
            return current + s[i]
        else:
            current = ""
    return -1

def gethtmlsections(html: str, height: int = -1) -> list[str]:
    htmlsections = []
    nextHeader = findNextHeader(html)
    htmlsection = ""
    if (nextHeader != -1):
        htmlsection = nextHeader[-1] + substring_after_first_or_empty(html, nextHeader)
    while len(htmlsection) != 0:
        height = int(nextHeader[-1])
        nextHeader = findNextHeader(htmlsection, height)
        if (nextHeader == -1):
            htmlsections.append(htmlsection)
            break
        htmlsections.append(substring_before_first(htmlsection, nextHeader))
        htmlsection = nextHeader[-1] + substring_after_first(htmlsection, nextHeader)

    return htmlsections

def rawsectionize(htmlsection: str) -> RawSection:
    height = int(htmlsection[0]) + 1
    htmlsections = gethtmlsections(htmlsection, height)
    nextHeader = findNextHeader(htmlsection)
    if (nextHeader != -1):
        htmlsection = substring_before_first(htmlsection, nextHeader)
    htmlsection = htmlsection.replace('\r\n  ', ' ').replace('\n', ' ').replace('\r', '').replace('&nbsp;', '')
    
    # Transform html links to markdown syntax
    htmlsection = re.sub(
        r'<a href="(.*?)">(.*?)</a>',
        r'[\2](\1)',  # \2 is the content, \1 is the link
        htmlsection
    )
    
    title = substring_before_first(htmlsection, "</")
    title = substring_after_last(title, ">")
    title = htmlHelpers.unescape(title)
    
    rawtable = ""
    paragraphs = []
    if "<div" in htmlsection:
        rawtable = substring_after_first(htmlsection, "<div")
        paragraphs = substring_before_first(htmlsection, "<div").split("<p")
    else:
        paragraphs = htmlsection.split("<p")
    paragraphs.pop(0)
    i = 0
    while (i < len(paragraphs)):
        paragraphs[i] = substring_after_first(paragraphs[i], ">")
        paragraphs[i] = substring_before_first(paragraphs[i], "</")
        paragraphs[i] = htmlHelpers.unescape(paragraphs[i])
        i += 1

    table = []
    tableHeaderLocation = ""
    if (len(rawtable) > 0):
        tableHeaderLocation = "Top"
        rawtable = substring_after_first(rawtable, "<table")
        rawtable = substring_before_first(rawtable, "</table>")
        rows = rawtable.split("<tr")
        rows.pop(0)
        for i in range(len(rows)):
            rawvalues = rows[i].split("<td")
            rawvalues.pop(0)
            values = []
            for i in range(len(rawvalues)):
                rawvalues[i] = substring_before_first(rawvalues[i], "</")
                rawvalues[i] = substring_after_last(rawvalues[i], ">")
                rawvalues[i] = htmlHelpers.unescape(rawvalues[i])
                values.append(rawvalues[i])
            table.append(values)

    rawsection = RawSection(title, height, paragraphs, table, tableHeaderLocation)
    for i in range(len(htmlsections)):
        rawsection.subsections.append(rawsectionize(htmlsections[i]))
    return rawsection


def getAttributes(paragraphs: list[str]):
    attributes = []
    for i in range(len(paragraphs)):
        attributes.append([])
        lastIndex = 0
        nextIndex = -1
        bracketCounter = 0
        parts = []
        for j in range(len(paragraphs[i])):
            if nextIndex > j: continue
            elif nextIndex == j:
                nextIndex = -1
                continue
            elif bracketCounter == 0 and paragraphs[i][j] == ':' and j + 1 < len(paragraphs[i]):
                nextPart = paragraphs[i][(j + 1):]
                nextIndex = substring_before_first_or_full(nextPart, ':').rfind('.')
                if nextIndex != -1:
                    nextIndex += j + 1
                    continue
                
            
            if (paragraphs[i][j] == '('):
                bracketCounter += 1
            elif (paragraphs[i][j] == ')' and bracketCounter > 0):
                bracketCounter -= 1
            elif (paragraphs[i][j] == ',' and bracketCounter == 0 and lastIndex < j):
                part = paragraphs[i][lastIndex:j]
                parts.append(part)
                lastIndex = j + 1
                if (len(paragraphs[i]) != lastIndex and paragraphs[i][lastIndex] == " "):
                    lastIndex += 1
        finalIndex = len(paragraphs[i])
        if (lastIndex < finalIndex):
            part = paragraphs[i][lastIndex:finalIndex]
            parts.append(part)
        
        for j in range(len(parts)):
            final = parts[j].split(": ")
            if (len(final) == 1):
                attributes[-1].append(Attribute(tagType, [parts[j]]))
            else:
                attributes[-1].append(Attribute(headValueType, [final[0], final[1]], [": "]))
    return attributes

def rawsectiontosection(rawsection: RawSection) -> Section:
    contentParagraphs = []

    attributes = []
    if (len(rawsection.paragraphs) != 0):
        if rawsection.paragraphs[0].startswith('#'):
            meta = rawsection.paragraphs.pop(0)
            if '#noheader' in meta:
                rawsection.tableHeaderLocation = None
        if (text):
            for i in range(len(rawsection.paragraphs)):
                contentParagraphs.append(rawsection.paragraphs[i])
        else:
            while (len(rawsection.paragraphs) != 0 and (rawsection.paragraphs[-1] == "" or (rawsection.paragraphs[-1].find(".") != -1 and rawsection.paragraphs[-1].find(":") == -1))):
                contentParagraphs.append(rawsection.paragraphs.pop())
            attributes = getAttributes(rawsection.paragraphs)
    
    content = '\n'.join(contentParagraphs).strip()
    section = Section(rawsection.title, rawsection.height, attributes, content, rawsection.table, rawsection.tableHeaderLocation)
    for i in range(len(rawsection.subsections)):
        section.SubSections.append(rawsectiontosection(rawsection.subsections[i]))
    
    return section

def recursivejsonobjectcleanup(jsonobject):
    if isinstance(jsonobject, list):
        jsonobject[:] = [e for e in jsonobject if e]
        for i, e in enumerate(jsonobject):
            jsonobject[i] = recursivejsonobjectcleanup(e)
    if isinstance(jsonobject, dict):
        jsonobject = {k: v for k, v in jsonobject.items() if v}
        for k, v in jsonobject.items():
            jsonobject[k] = recursivejsonobjectcleanup(v)
    return jsonobject

def cleanupjsonstring(jsonstring: str) -> str:
    jsonobject = json.loads(jsonstring)
    jsonobject = recursivejsonobjectcleanup(jsonobject)
    return json.dumps(jsonobject)

def cleanupjsonlist(listobject):
    jsonstring = json.dumps(listobject, default=lambda o: o.__dict__)
    listobject = json.loads(jsonstring)
    return recursivejsonobjectcleanup(listobject)

def extractParagraphs(html: str) -> list[str]:
    return re.findall(r'<p.*?>(.*?)</p>', html, re.DOTALL)

def extractOptions(html: str):
    global jsonpath
    global text
    global title

    metaData = html
    firstHeader = findNextHeader(metaData)
    if firstHeader != -1:
        metaData = substring_before_first(metaData, firstHeader)
    metaData = metaData.replace('\n', ' ').replace('\r', '').replace('&nbsp;', '')
    metaData = '\n'.join(extractParagraphs(metaData))
    pathOption = substring_before_first_or_empty(substring_after_first_or_empty(metaData, "Target: "), ".json")
    if pathOption != "":
        jsonpath = pathOption + ".json"
    textTrueOption = metaData.find("Text: True")
    if textTrueOption != -1:
        text = True
    textFalseOption = metaData.find("Text: False")
    if textFalseOption != -1:
        text = False
    titleOption = substring_before_first_or_empty(substring_after_first_or_empty(metaData, "Title: "), "\n")
    if titleOption != "":
        title = titleOption

    print("Json Path: " + jsonpath)
    print("Text: " + str(text))
    print("Title: " + str(title))


clip = kl.get_with_rich_text()[1] # type: str

clip = clip.replace("</span>", "")
while "<span" in clip:
    start_index = clip.index("<span")
    end_index = clip.index(">", start_index)
    clip = clip[:start_index] + clip[end_index + 1:]


extractOptions(clip)
htmlsections = gethtmlsections(clip)

rawsections = [] # type: list[RawSection]
for i in range(len(htmlsections)):
    rawsections.append(rawsectionize(htmlsections[i]))

sections = [] # type: list[Section]
for i in range(len(rawsections)):
    sections.append(rawsectiontosection(rawsections[i]))

# for i in range(len(rawsections)):
#     print("Section " + str(i) + ":")
#     print("Title: " + rawsections[i].title)
#     for j in range(len(rawsections[i].paragraphs)):
#         print("Paragraph " + str(j) + ":")
#         print(rawsections[i].paragraphs[j])

if title != None:
    sections = [Section(title, sections[0].Height - 1, subSections=sections)]

cleanedsections = cleanupjsonlist(sections)

jsonpath = outputdirectorypath + '/' + jsonpath

if os.path.isfile(jsonpath) and os.access(jsonpath, os.R_OK) and not os.stat(jsonpath).st_size == 0:
    with open(jsonpath, 'r') as openfile:
        loadedsections = json.load(openfile)
        print("New: " + str(len(cleanedsections)))
        print("Existing: " + str(len(loadedsections)))
        updated = 0
        for i in range(len(loadedsections)):
            if (not any(x["Title"] == loadedsections[i]["Title"] for x in cleanedsections)):
                cleanedsections.append(loadedsections[i])
            else:
                updated += 1
        print("Updated: " + str(updated))

print("Total: " + str(len(cleanedsections)))

with open(jsonpath, "w") as outfile:
    json.dump(cleanedsections, outfile)
