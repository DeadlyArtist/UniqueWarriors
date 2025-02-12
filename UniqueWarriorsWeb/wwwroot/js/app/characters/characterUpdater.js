class CharacterUpdater {
    static updateAll() {
        Registries.characters.forEach(c => this.update(c));
    }

    static update(character) {
        this.updateAttributes(character);
        this.updateAbilities(character);
        this.updateVersion(character);
    }

    static updateVersion(character) {
        character.version = App.version;
        CharacterHelpers.saveCharacter(character);
    }

    static updateAttributes(character) {
        let oldAttributes = character.attributes;
        character.attributes = CharacterHelpers.getEmptyAttributes();
        for (let [key, value] of Object.entries(oldAttributes)) {
            if (character.attributes.hasOwnProperty(key)) character.attributes[key] = value;
        }
        CharacterHelpers.saveCharacter(character);
    }

    static checkForAbilityUpdates(character) {
        let needsUpdate = false;

        let unknownTechniques = [];
        let outdatedTechniques = [];
        for (let technique of character.techniques) {
            if (AbilitySectionHelpers.isMutated(technique)) continue;
            let source = Registries.techniques.get(technique);
            if (!source) {
                unknownTechniques.push(technique);
                continue;
            }

            if (!source.compareRecursively(technique)) {
                outdatedTechniques.push(technique);
                continue;
            }
        }

        let unknownTechniqueNames = new Set(unknownTechniques.map(t => t.title));
        let outdatedTechniqueNames = new Set(outdatedTechniques.map(t => t.title));
        for (let technique of character.techniques) {
            let mutatedInfo = AbilitySectionHelpers.getMutatedInfo(technique);
            if (mutatedInfo) {
                if (unknownTechniqueNames.has(mutatedInfo.mutation) || unknownTechniqueNames.has(mutatedInfo.original)) {
                    unknownTechniques.push(technique);
                } else if (outdatedTechniqueNames.has(mutatedInfo.mutation) || outdatedTechniqueNames.has(mutatedInfo.original)) {
                    outdatedTechniques.push(technique);
                }
            }
        }

        let unknownMasteries = [];
        let outdatedMasteries = [];
        for (let mastery of character.masteries) {
            let source = Registries.masteries.get(mastery);
            if (!source) {
                unknownMasteries.push(mastery);
                continue;
            }

            let isOutdated = false;
            if (!source.compareSurface(mastery)) isOutdated = true;
            for (let section of mastery.subSections) {
                let inSource = mastery.subSections.has(section);
                if (!inSource) {
                    isOutdated = true;
                    continue;
                }
                if (!section.compareRecursively(mastery.subSections.get(section))) {
                    isOutdated = true;
                    continue;
                }
            }
            for (let section of source.subSections) {
                if (!AbilitySectionHelpers.isSubMastery(section) && !mastery.subSections.has(section)) {
                    isOutdated = true;
                    continue;
                }
            }

            if (isOutdated) outdatedMasteries.push(mastery);
        }

        // more stuff missing like summons

        let lists = {
            unknownTechniques,
            outdatedTechniques,
            unknownMasteries,
            outdatedMasteries,
        }
        needsUpdate ||= Object.values(lists).filter(l => l.length != 0).length != 0;

        return {
            needsUpdate,
            ...lists,
        };
    }

    static updateAbilities(character) {
        let techniques = new Registry();
        for (let technique of character.techniques) {
            let mutatedInfo = AbilitySectionHelpers.getMutatedInfo(technique);
            if (mutatedInfo) {
                let original = Registries.techniques.get(mutatedInfo.original);
                let mutation = Registries.techniques.get(mutatedInfo.mutation);
                if (!original || !mutation) continue;
                let mutated = SectionHelpers.getMutated(original, mutation, technique.title);
                if (mutated) techniques.register(mutated);
                continue;
            }
            let source = Registries.techniques.get(technique);
            if (!source) continue;
            techniques.register(source.clone());
        }
        character.techniques.clear();
        techniques.forEach(t => character.techniques.register(t));

        let masteries = new Registry();
        for (let mastery of character.masteries) {
            let source = Registries.masteries.get(mastery);
            if (!source) continue;

            let newMastery = source.cloneWithoutSubSections();
            for (let section of source.subSections) if (!AbilitySectionHelpers.isSubMastery(section) || mastery.subSections.has(section)) newMastery.subSections.register(section);
            masteries.register(newMastery);
        }
        character.masteries.clear();
        masteries.forEach(t => character.masteries.register(t));

        // more stuff missing like summons

        CharacterHelpers.saveCharacter(character);
    }
}