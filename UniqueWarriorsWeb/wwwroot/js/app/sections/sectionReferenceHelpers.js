class SectionReferenceHelpers {
    static invalidFormulaTooltip = "Invalid Formula";

    static parseFormula(formula, variables) {
        var settings = CustomMath.getDefaultSettings();
        for (let variable in variables) {
            settings.variables[variable.key] = variable.value;
        }
        return CustomMath.parse(formula, settings);
    }

    static getFormulaTooltip(formula, variables) {
        return this.parseFormula(formula, variables) ?? this.invalidFormulaTooltip;
    }
}