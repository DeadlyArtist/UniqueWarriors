class CategoryHelpers {
    static getCategoryType(category) {
        return category.headValues.get('Category');
    }

    static getWeaponCategories() {
        return Registries.categories.getAllByTag('Weapon').sort((a, b) => a.title.localeCompare(b.title));
    }

    static getPathCategories() {
        return Registries.categories.getAllByTag('Path').sort((a, b) => a.title.localeCompare(b.title));
    }

    static getSummonCategories() {
        return Registries.categories.getAllByTag('Summon').sort((a, b) => a.title.localeCompare(b.title));
    }

    static getWeaponNames() {
        return this.getWeaponCategories().map(c => c.title);
    }

    static getPathNames() {
        return this.getPathCategories().map(c => c.title);
    }

    static getSummonTypeNames() {
        return this.getSummonCategories().map(c => c.title);
    }
}