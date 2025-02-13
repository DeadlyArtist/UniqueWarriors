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

        let unknownSummons = [];
        let outdatedSummons = [];
        for (let summon of character.summons) {
            // Somehow need to check the abilities within and compare npc between summon and source, with special rules for variants
            let original = AbilitySectionHelpers.getVariantOriginal(summon);
            if (original) {
                let oldOriginal = character.summons.get(original);
                if (!oldOriginal) continue;
                original = Registries.summons.get(original);
                if (!original) continue;
                let isOutdated = false;
                for (let technique of summon.npc.techniques) {
                    if (oldOriginal.npc.techniques.has(technique)) {
                        if (!technique.compareRecursively(original.npc.techniques.get(technique))) {
                            isOutdated = true;
                            continue;
                        }
                    } else {
                        let newTechnique = Registries.techniques.get(technique);
                        if (!newTechnique || !technique.compareRecursively(newTechnique)) {
                            isOutdated = true;
                            continue;
                        }
                    }
                }
                for (let subSummon of summon.npc.summons) {
                    if (oldOriginal.npc.summons.has(subSummon)) {
                        if (!subSummon.compareRecursively(original.npc.summons.get(subSummon))) {
                            isOutdated = true;
                            continue;
                        }
                    } else {
                        let newSummon = Registries.summons.get(subSummon);
                        if (!newSummon || !subSummon.compareRecursively(newSummon)) {
                            isOutdated = true;
                            continue;
                        }
                    }
                }
                for (let mastery of summon.npc.masteries) {
                    if (oldOriginal.npc.masteries.has(mastery)) {
                        if (!mastery.compareRecursively(original.npc.masteries.get(mastery))) {
                            isOutdated = true;
                            continue;
                        }
                    }
                }

                if (isOutdated) {
                    outdatedSummons.push(summon);
                    continue;
                }
            }

            if (AbilitySectionHelpers.isVariant(summon)) continue;

            let source = Registries.summons.get(summon);
            if (!source) {
                unknownSummons.push(summon);
                continue;
            }

            if (!source.compareRecursively(summon)) {
                outdatedSummons.push(summon);
                continue;
            }
        }

        let unknownSummonNames = new Set(unknownSummons.map(t => t.title));
        let outdatedSummonNames = new Set(outdatedSummons.map(t => t.title));
        for (let summon of character.summons) {
            let original = AbilitySectionHelpers.getVariantOriginal(summon);
            if (original) {
                if (unknownSummonNames.has(original)) {
                    unknownSummons.push(summon);
                } else if (outdatedSummonNames.has(original)) {
                    if (!outdatedSummonNames.has(summon.title)) outdatedSummons.push(summon);
                }
            }
        }

        let lists = {
            unknownTechniques,
            outdatedTechniques,
            unknownMasteries,
            outdatedMasteries,
            unknownSummons,
            outdatedSummons,
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

        let summons = new Registry();
        for (let summon of character.summons) {
            let original = AbilitySectionHelpers.getVariantOriginal(summon);
            if (original) {
                let oldOriginal = character.summons.get(original);
                if (!oldOriginal) continue;
                original = Registries.summons.get(original);
                if (!original) continue;
                let variant = SectionHelpers.getVariant(original, summon.title);
                for (let technique of summon.npc.techniques) {
                    if (!oldOriginal.npc.techniques.has(technique)) {
                        let newTechnique = Registries.techniques.get(technique);
                        if (newTechnique) variant.npc.techniques.register(newTechnique);
                    }
                }
                for (let subSummon of summon.npc.summons) {
                    if (!oldOriginal.npc.summons.has(subSummon)) {
                        let newSummon = Registries.summons.get(subSummon);
                        if (newSummon) variant.npc.summons.register(subSummon);
                    }
                }
                for (let weapon of summon.npc.weapons) {
                    if (!oldOriginal.npc.weapons.has(weapon)) {
                        variant.npc.weapons.register(weapon);
                    }
                }
                SummonHelpers.updateWeaponsHeadValue(variant);
                summons.register(variant);
                continue;
            }

            let source = Registries.summons.get(summon);
            if (!source) continue;
            summons.register(source.clone());
        }
        character.summons.clear();
        summons.forEach(t => character.summons.register(t));

        if (character instanceof Character) CharacterHelpers.saveCharacter(character);
    }
}