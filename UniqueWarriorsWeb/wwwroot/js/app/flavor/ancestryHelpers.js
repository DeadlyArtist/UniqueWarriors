class AncestryHelpers {

    static registerAllAncestries() {
        ["Ashka", "Automaton", "Bruhx", "Dragna", "Dwarf", "Elf", "Ghost", "Goblin", "Human", "Inferum", "Insectoid", "Kruull", "Nymph", "Plasmoid", "Seraph", "Skeleton", "Swarm", "Vampire", "Wildblood", "Zombie"].forEach(ancestry => Registries.ancestries.register(ancestry));
    }
}
App.onAppLoaded(() => AncestryHelpers.registerAllAncestries());