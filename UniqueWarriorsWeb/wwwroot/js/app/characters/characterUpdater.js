class CharacterUpdater {
    static updateAll() {
        Registries.characters.forEach(c => this.update(c));
    }

    static update(character) {
        this.updateAttributes(character);

        this.updateVersion(character);
    }

    static updateVersion(character) {
        character.version = App.version;
    }

    static updateAttributes(character) {
        let oldAttributes = character.attributes;
        character.attributes = CharacterHelpers.getEmptyAttributes();
        for (let [key, value] of Object.entries(oldAttributes)) {
            if (character.attributes.hasOwnProperty(key)) character.attributes[key] = value;
        }
        CharacterHelpers.saveCharacter(character);
    }
}