class Registry {
    entries = new Map();
    entriesByObjects = new Map();
    streams = new Set();
    name;

    get id() {
        return this.name;
    }

    constructor(name) {
        this.name = name;
    }

    register(obj, id = null, tags = null) {
        return this.registerEntry(new RegistryEntry(obj, id, tags));
    }

    registerEntry(entry) {
        this.entries.set(entry.id, entry);
        this.entriesByObjects.set(entry.obj, entry);
        entry.registry = this;
        this.streams.forEach(stream => {
            stream.callback(entry.obj);
        });
        return entry;
    }

    registerSection(section, tags = null) {
        return this.registerEntry(new RegistryEntry(section, section.Title, tags));
    }

    get(id) {
        return this.getEntry(id)?.obj;
    }

    getEntry(id) {
        return this.entries.get(id);
    }

    getEntryForObject(obj) {
        return this.entriesByObjects.get(obj);
    }

    contains(id) {
        return this.entries.has(id);
    }

    containsObject(obj) {
        return this.entriesByObjects.has(obj);
    }

    stream(callback) {
        this.entries.forEach(entry => callback(entry.obj));

        const stream = {
            callback,
            stop: () => this.streams.delete(stream), // Unregister the stream
        };
        this.streams.add(stream);

        return stream;
    }
}
