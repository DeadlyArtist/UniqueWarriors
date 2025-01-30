class CategoryHelpers {
    static registerCategory(category) {
        Registries.categories.register(category);

        if (category.type == "Weapon") {
            Registries.weapons.register(category.name);
        } else if (category.type == "Path") {
            Registries.paths.register(category.name);
        }
    }

    static registerWeapon(name) {
        let category = new Category(name, "Weapon");
        this.registerCategory(category);
        return category;
    }

    static registerPath(name) {
        let category = new Category(name, "Path");
        this.registerCategory(category);
        return category;
    }

    static fromSection(section) {
        return new Category(section.title, CategoryHelpers.getCategoryType(section))
    }

    static getCategoryType(category) {
        return category.headValues.get('Category');
    }

    static getWeaponCategories() {
        return Registries.categories.getAllByTag('Weapon').sort((a, b) => a.name.localeCompare(b.name));
    }

    static getPathCategories() {
        return Registries.categories.getAllByTag('Path').sort((a, b) => a.name.localeCompare(b.name));
    }

    static getSummonCategories() {
        return Registries.categories.getAllByTag('Summon').sort((a, b) => a.name.localeCompare(b.name));
    }

    static getWeaponNames() {
        return this.getWeaponCategories().map(c => c.name);
    }

    static getPathNames() {
        return this.getPathCategories().map(c => c.name);
    }

    static getSummonTypeNames() {
        return this.getSummonCategories().map(c => c.name);
    }
}

class CategoryNames {
    static weapon = "Weapon";
    static path = "Path";
    static summon = "Summon";
}