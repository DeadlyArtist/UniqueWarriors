class SectionSearchHelpers {
    static encoding = {
        "\\": "back",
        "!": "invert",
        "?": "exact",
        "@": "at",
        "\$": "dollar",
        "|": "or",
        ",": "comma",
        " ": "space",
        "#": "hash",
        ">": "right",
        "<": "left",
        "^": "top",
        "-": "minus",
        "\'": "quote",
        "~": "rough",
        "+": "plus",
        ":": "semi",
        "%": "cent",
    }
}

SectionSearchHelpers.encoder = new Encoder(SectionSearchHelpers.encoding);