class AncestryHelpers {

    static getAncestryNames() {
        return Registries.ancestries.map(a => a.title);
    }
}