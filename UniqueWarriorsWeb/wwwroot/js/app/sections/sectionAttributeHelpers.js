class SectionAttributesHelpers {
    static TagType = "tag";
    static HeadValueType = "headValue";

    static getAttributeValue(attribute) {
        if (attribute.Parts && attribute.Parts.length > 0) {
            const separators = attribute.Separators || [];
            let result = "";

            for (let i = 0; i < attribute.Parts.length; i++) {
                result += attribute.Parts[i];

                // Add a separator if it exists and isn't the last part
                if (i < separators.length && i < attribute.Parts.length - 1) {
                    result += separators[i];
                }
            }

            return result;
        }
        return "";
    }

    static isHeadValue(attribute) {
        return (
            attribute.Type === this.HeadValueType &&
            attribute.Parts &&
            attribute.Parts.length >= 2
        );
    }

    static tryGetHeadValue(attribute) {
        if (!this.isHeadValue(attribute)) return null;
        return { Name: attribute.Parts[0], Value: attribute.Parts[1] };
    }

    static isTag(attribute) {
        return (
            attribute.Type === this.TagType &&
            attribute.Parts &&
            attribute.Parts.length !== 0
        );
    }

    static tryGetTag(attribute) {
        if (!this.isTag(attribute)) return null;
        return attribute.Parts[0];
    }

    static createTag(name) {
        return {
            Type: this.TagType,
            Parts: [name],
        };
    }

    static createHeadValue(name, value) {
        return {
            Type: this.HeadValueType,
            Parts: [name, value],
            Separators: [": "],
        };
    }
}
