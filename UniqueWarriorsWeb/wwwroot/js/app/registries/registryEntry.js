class RegistryEntry {
    obj;
    id;
    tags;
    registry;

    constructor(obj, id = null, tags = null) {
        this.obj = obj;
        this.id = id ?? obj.id;
        this.tags = tags ?? obj.tags;
    }
}