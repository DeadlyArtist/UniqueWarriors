class Category {
    constructor(name, type) {
        this.name = name;
        this.type = type;
    }

    toSection() {
        return new Section({
            title: this.name,
            headValues: new HeadValue("Category", this.type),
        });
    }
}