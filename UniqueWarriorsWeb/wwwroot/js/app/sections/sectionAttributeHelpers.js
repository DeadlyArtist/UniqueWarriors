class SectionAttributesHelpers {
    static TagType = "tag";
    static HeadValueType = "headValue";

    static getAttributeValue(attribute) {
        if (attribute.parts && attribute.parts.length > 0) {
            const separators = attribute.separators || [];
            let result = "";

            for (let i = 0; i < attribute.parts.length; i++) {
                result += attribute.parts[i];

                // Add a separator if it exists and isn't the last part
                if (i < separators.length && i < attribute.parts.length - 1) {
                    result += separators[i];
                }
            }

            return result;
        }
        return "";
    }

    static isHeadValue(attribute) {
        if (attribute instanceof HeadValue) return true;
        return (
            attribute.type === this.HeadValueType &&
            attribute.parts &&
            attribute.parts.length >= 2
        );
    }

    static tryGetHeadValue(attribute) {
        if (!this.isHeadValue(attribute)) return null;
        return new HeadValue(attribute.parts[0], attribute.parts[1]);
    }

    static isTag(attribute) {
        if (isString(attribute)) return true;
        return (
            attribute.type === this.TagType &&
            attribute.parts &&
            attribute.parts.length !== 0
        );
    }

    static tryGetTag(attribute) {
        if (!this.isTag(attribute)) return null;
        return attribute.parts[0];
    }

    static createTag(name) {
        return {
            type: this.TagType,
            parts: [name],
        };
    }

    static createHeadValue(name, value) {
        return {
            type: this.HeadValueType,
            parts: [name, value],
            separators: [": "],
        };
    }

    static classify(attributes) {
        let newAttributes = [];
        for (let line of attributes) {
            let newLine = [];
            for (let attribute of line) {
                attribute = ObjectHelpers.lowerFirstCharOfKeys(attribute);
                let newAttribute = null;
                if (attribute.type == this.TagType) newAttribute = this.tryGetTag(attribute);
                else if (attribute.type == this.HeadValueType) newAttribute = this.tryGetHeadValue(attribute);
                if (newAttribute != null) newLine.push(newAttribute);
            }
            newAttributes.push(newLine);
        }

        return newAttributes;
    }

    static toJSON(attributes) {
        let newAttributes = [];
        for (let line of attributes) {
            let newLine = [];
            for (let attribute of line) {
                let newAttribute = null;
                if (this.isTag(attribute)) newAttribute = this.createTag(attribute);
                else if (this.isHeadValue(attribute)) newAttribute = this.createHeadValue(attribute.name, attribute.value);
                if (newAttribute != null) newLine.push(newAttribute);
            }
            newAttributes.push(newLine);
        }

        return newAttributes;
    }

    static fromJSON(attributes) {
        return this.classify(attributes);
    }

    static attributesToHTML(attributes) {
        if (!attributes || attributes.length === 0) return "";

        let html = '<div class="section-attributes applySnippets markTooltips">';
        for (const attributeList of attributes) {
            html += '<div class="section-attributesLine">';
            attributeList.forEach((attr, index) => {
                if (this.isTag(attr)) {
                    html += `<span class="section-tag">${escapeHTML(attr)}</span>`;
                } else if (this.isHeadValue(attr)) {
                    html += `
                        <span class="section-headValue">
                            <span class="section-headValue-name">${escapeHTML(attr.name)}</span>: 
                            <span class="section-headValue-value">${escapeHTML(attr.value)}</span>
                        </span>`;
                }
                if (index < attributeList.length - 1) {
                    html += ", ";
                }
            });
            html += "</div>";
        }
        html += "</div>";
        return html;
    }
}

class HeadValue {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }

    toString() {
        return `${this.name}: ${this.value}`;
    }

    toAttribute() {
        return SectionHelpers.createHeadValue(this.name, this.value);
    }
}