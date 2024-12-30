class FlavorHelpers {
    static sampleCharacteristics = new Set();
    static sampleCommonPassions = new Set();
    static sampleSpecificPassions = new Set();

    static setupSamples() {
        this.sampleCharacteristics = new Set(SectionHelpers.resolvePath("rules/Character Creation/Choose Characteristics/Characteristics (Samples)").content.split(", "));
        this.sampleCommonPassions = new Set(SectionHelpers.resolvePath("rules/Character Creation/Choose Passions/Common Passions (Samples)").content.split(", "));
        this.sampleSpecificPassions = new Set(SectionHelpers.resolvePath("rules/Character Creation/Choose Passions/Specific Passions (Samples)").content.split(", "));
    }
}

App.onAppLoaded(() => {
    Loader.onCollectionsLoaded(() => FlavorHelpers.setupSamples());
});