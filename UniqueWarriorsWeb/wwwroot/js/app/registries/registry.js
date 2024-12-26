class Registry {
    entries = new Map();
    entriesByObjects = new Map();
    streams = new Set();
    batchStreams = new Set();
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

        this.setup();
    }

    setup() {
        let selfRef = new WeakRef(this);
        (async function () {
            while (true) {
                await sleep(100);
                let self = selfRef.deref();
                if (!self) return;
                self._processBatchStreams();
            }
        })();
    }

    register(obj, settings = null) {
        return this.registerEntry(new RegistryEntry(obj, settings), settings);
    }

    registerEntry(entry, settings = null) {
        settings ??= {};

        if (entry.id == null) return null;

        let insertInfo = {};
        let index = this.getInsertIndex(settings.replace ?? settings.insertBefore, settings.insertAfter);
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
        for (const stream of this.streams) stream.callback(this._getStreamCallbackParam(entry, true, insertInfo));
        for (const stream of this.batchStreams) {
            stream.batchState.registered.add(entry);
            stream.batchState.unregistered.delete(entry);
        }

        if (settings.replace != null) this.unregister(settings.replace);

        return entry;
    }

    /**
     * `id` can be id, object, or entry
     */
    unregister(id) {
        let entry = this.getEntry(id);
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
        for (const stream of this.streams) stream.callback(this._getStreamCallbackParam(entry, false));
        for (const stream of this.batchStreams) {
            stream.batchState.unregistered.add(entry);
            stream.batchState.registered.delete(entry);
        }

        return entry;
    }

    clear() {
        for (let entry of this.getAllEntries()) this.unregisterEntry(entry);
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


    forEach(callback, thisArg = undefined) {
        for (const obj of this) {
            callback.call(thisArg, obj, this.getEntryForObject(obj), this.getAllEntries());
        }
    }

    *iterate() {
        for (const entry of this.entries.values()) {
            yield entry.obj;
        }
    }

    *iterateEntries() {
        for (const entry of this.entries.values()) {
            yield entry;
        }
    }

    getEntryIterator() {
        return this.iterateEntries();
    }

    first() {
        return this.firstEntry()?.obj;
    }

    firstEntry() {
        for (const entry of this.entries.values()) {
            return entry;
        }
    }

    /**
     * `id` can be id, object, or entry
     */
    contains(id) {
        return this.entries.has(this.getId(id));
    }

    stream(callback) {
        for (const entry of this.getAllEntries()) callback(this._getStreamCallbackParam(entry, true));

        let self = this;
        const stream = {
            callback,
            stop: () => self.streams.delete(stream), // Unregister the stream
        };
        this.streams.add(stream);

        return stream;
    }

    _getStreamCallbackParam(entry, registered, insertInfo = null) {
        return { obj: entry.obj, entry, insertInfo, registered };
    }

    streamBatch(callback) {
        callback(this._getStreamBatchCallbackParam(this.getAllEntries()));

        const batchState = {
            registered: new Set(),
            unregistered: new Set(),
        };

        let self = this;
        const stream = {
            batchState,
            callback,
            stop: () => self.streams.delete(stream), // Unregister the stream
        };
        this.batchStreams.add(stream);

        return stream;
    }

    _getStreamBatchCallbackParam(registeredEntries, unregisteredEntries = null) {
        registeredEntries ??= [];
        unregisteredEntries ??= [];
        return { registered: registeredEntries.map(e => e.obj), registeredEntries: registeredEntries, unregistered: unregisteredEntries.map(e => e.obj), unregisteredEntries: unregisteredEntries };
    }

    _processBatchStreams() {
        for (const stream of this.batchStreams) {
            const registered = [...stream.batchState.registered];
            const unregistered = [...stream.batchState.unregistered];
            if (registered.length || unregistered.length) {
                stream.callback(this._getStreamBatchCallbackParam(registered, unregistered));
                stream.batchState.registered.clear();
                stream.batchState.unregistered.clear();
            }
        }
    }

    streamTag(tag, callback) {
        this.tryInitTag(tag);
        return this.getTagRegistry(tag).stream(callback);
    }

    clone() {
        return Registry.fromJSON(JSON.stringify(this));
    }

    // Does NOT return a string. Use JSON.stringify instead.
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
        tagRegistry.register(entry.obj);
        entry.tags.add(tag);
    }

    removeFromTag(tag, entry) {
        entry.tags.delete(tag);

        const tagRegistry = this.getTagRegistry(tag);
        if (!tagRegistry) return;

        tagRegistry.unregister(entry);
    }

    getEntriesByTag(tag) {
        const tagRegistry = this.getTagRegistry(tag);
        return tagRegistry ? tagRegistry.getAll() : [];
    }

    tagExists(tag) {
        return this.tags.get(tag)?.size > 0;
    }

    // JSON
    toJSON() {
        return this.getAllEntries().map(entry => ({
            id: entry.id,
            tags: [...entry.tags],
            obj: entry.obj,
        }));
    }

    static fromJSON(json) {
        let registry = new Registry();
        json.forEach(e => registry.register(e.obj, { id: e.id, tags: e.tags }));
        return registry;
    }

    // List method wrappers
    filter(callback, thisArg = undefined) {
        const result = [];
        for (const obj of this) {
            if (callback.call(thisArg, obj, this.getEntryForObject(obj), this)) {
                result.push(obj);
            }
        }
        return result;
    }

    find(callback, thisArg = undefined) {
        for (const obj of this) {
            if (callback.call(thisArg, obj, this.getEntryForObject(obj), this)) {
                return obj;
            }
        }
        return undefined;
    }

    some(callback, thisArg = undefined) {
        for (const obj of this) {
            if (callback.call(thisArg, obj, this.getEntryForObject(obj), this)) {
                return true;
            }
        }
        return false;
    }

    every(callback, thisArg = undefined) {
        for (const obj of this) {
            if (!callback.call(thisArg, obj, this.getEntryForObject(obj), this)) {
                return false;
            }
        }
        return true;
    }

    map(callback, thisArg = undefined) {
        const result = [];
        for (const obj of this) {
            result.push(callback.call(thisArg, obj, this.getEntryForObject(obj), this));
        }
        return result;
    }

    reduce(callback, initialValue) {
        let accumulator = initialValue;
        for (const obj of this) {
            accumulator = callback(accumulator, obj, this.getEntryForObject(obj), this);
        }
        return accumulator;
    }

    includes(obj) {
        return this.contains(obj);
    }

    indexOf(obj) {
        let index = 0;
        for (const entry of this) {
            if (entry === obj) return index;
            index++;
        }
        return -1;
    }

    flatMap(callback, thisArg = undefined) {
        const result = [];
        for (const obj of this) {
            const value = callback.call(thisArg, obj, this.getEntryForObject(obj), this);
            result.push(...value);
        }
        return result;
    }

}
