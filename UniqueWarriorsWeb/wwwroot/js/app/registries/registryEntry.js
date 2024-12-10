class RegistryEntry {
    obj;
    id;
    tags;
    registry;

    constructor(obj, settings = null) {
        settings ??= {};
        this.obj = obj;
        this.id = settings.id ?? RegistryEntry.extractId(obj);
        this.tags = new Set([...(settings.tags ?? obj.tags ?? [])]);
    }

    static extractId(obj) {
        if (isString(obj) || isNumber(obj)) return obj;
        return obj.id ?? obj.name ?? obj.title;
    }

    unregister() {
        this.registry?.unregisterEntry(this);
    }

    hasTag(tag) {
        return this.tags.has(tag);
    }
}