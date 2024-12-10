class Registry {
    entries = new Map();
    entriesByObjects = new Map();
    streams = new Set();
    tags = new Map();
    name;

    get size() {
        return this.entries.size;
    }

    get length() {
        return this.size;
    }

    [Symbol.iterator]() {
        return this.iterate();
    }

    constructor(name = null) {
        this.name = name;
    }


    register(obj, settings = null) {
        return this.registerEntry(new RegistryEntry(obj, settings), settings);
    }

    registerEntry(entry, settings = null) {
        settings ??= {};

        if (entry.id == null) return null;

        let insertInfo = {};
        let index = this.getInsertIndex(settings.insertBefore, settings.insertAfter);
        if (index != null) {
            MapHelpers.insertAtIndex(this.entries, index, entry.id, entry, insertInfo);
        } else {
            this.entries.set(entry.id, entry);
        }

        // Add entry to the primary registries
        this.entriesByObjects.set(entry.obj, entry);
        entry.registry = this;

        // Handle tags
        if (entry.tags) {
            for (let tag of this.tags) this.addToTag(tag, entry);
        }

        // Notify any active streams
        for (const stream of this.streams) stream.callback(this.getCallbackParam(entry, true, insertInfo));

        return entry;
    }

    unregister(obj) {
        return this.unregisterEntry(this.getEntryForObject(obj));
    }

    unregisterEntry(entry) {
        if (!entry) return null;

        // Remove entry from the primary registries
        this.entries.delete(entry.id);
        this.entriesByObjects.delete(entry.obj);
        entry.registry = null;

        // Remove entry from tag registries
        if (entry.tags) {
            for (let tag of this.tags) this.removeFromTag(tag, entry);
        }

        // Notify streams
        for (const stream of this.streams) stream.callback(this.getCallbackParam(entry, false));

        return entry;
    }

    /**
     * `id` can be id, object, or entry
     */
    getId(id) {
        let entry = this.getEntryForObject(id);
        if (entry != null) id = entry.id;
        else id = RegistryEntry.extractId(id);
        return id;
    }

    /**
     * `id` can be id, object, or entry
     */
    get(id) {
        return this.getEntry(id)?.obj;
    }

    /**
     * `id` can be id, object, or entry
     */
    getEntry(id) {
        return this.entries.get(this.getId(id));
    }

    getEntryForObject(obj) {
        return this.entriesByObjects.get(obj);
    }

    /**
     * `id` can be id, object, or entry
     */
    getIndex(id) {
        id = this.getId(id);
        let index = 0;
        for (let key of this.entries.keys()) {
            if (key == id) return index;
            index++;
        }
    }

    /**
     * `insertBefore` and `insertAfter` can be index, id, object, or entry
     */
    getInsertIndex(insertBefore, insertAfter = null) {
        let index = null;
        if (insertBefore) {
            index = ObjectHelpers.isNumber(insertBefore) ? insertBefore : this.get(insertBefore);
        } else if (insertAfter) {
            index = ObjectHelpers.isNumber(insertAfter) ? insertAfter : this.get(insertAfter);
            index++;
        }
        return index;
    }

    getAll() {
        return this.getAllEntries().map(e => e.obj);
    }

    getAllEntries() {
        return [...this.entries.values()];
    }

    *iterate() {
        for (const entry of this.entries.values()) {
            yield entry.obj;
        }
    }

    forEach(callback, thisArg = undefined) {
        for (const obj of this) {
            callback.call(thisArg, obj, this.getEntryForObject(obj), this.entries);
        }
    }

    getEntryIterator() {
        return this.iterateEntries();
    }

    *iterateEntries() {
        for (const entry of this.entries.values()) {
            yield entry;
        }
    }

    /**
     * `id` can be id, object, or entry
     */
    contains(id) {
        return this.entries.has(this.getId(id));
    }

    stream(callback) {
        for (const entry of this.getAllEntries()) callback(this.getCallbackParam(entry, true));

        let self = this;
        const stream = {
            callback,
            stop: () => self.streams.delete(stream), // Unregister the stream
        };
        this.streams.add(stream);

        return stream;
    }


    getCallbackParam(entry, registered, insertInfo = null) {
        return { obj: entry.obj, entry: entry, insertInfo, registered };
    }

    streamTag(tag, callback) {
        this.tryInitTag(tag);
        return this.getTagRegistry(tag).stream(callback);
    }

    clone() {
        return Registry.fromJSON(this.toJSON());
    }

    toJSON() {
        return {
            name: this.name,
            entries: this.getAllEntries().map(entry => ({
                id: entry.id,
                tags: entry.tags,
                obj: entry.obj,
            })),
        };
    }

    static fromJSON(json) {
        const parsed = JSON.parse(json);
        const registry = new Registry(parsed.name);
        parsed.entries.forEach(entryData => {
            registry.register(entryData.obj, entryData.id, entryData.tags);
        });
        return registry;
    }


    // Tags
    tryInitTag(tag) {
        if (!this.tags.has(tag)) {
            this.tags.set(tag, new Registry(tag));
        }
    }

    /**
     * @returns {Registry}
     */
    getTagRegistry(tag) {
        return this.tags.get(tag);
    }

    addToTag(tag, entry) {
        this.tryInitTag(tag);
        const tagRegistry = this.getTagRegistry(tag);
        tagRegistry.registerEntry(entry);
        entry.tags.add(tag);
    }

    removeFromTag(tag, entry) {
        entry.tags.delete(tag);

        const tagRegistry = this.getTagRegistry(tag);
        if (!tagRegistry) return;

        tagRegistry.unregisterEntry(entry);
    }

    getEntriesByTag(tag) {
        const tagRegistry = this.getTagRegistry(tag);
        return tagRegistry ? tagRegistry.getAll() : [];
    }

    tagExists(tag) {
        return this.tags.get(tag)?.size != 0;
    }
}
