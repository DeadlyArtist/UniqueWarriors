class SectionTableHelpers {
    static Top = "Top";
    static Left = "Left";
    static Both = "Both";
    static None = null;

    static generateTableHTML(model) {
        let none = !model.tableHeaderLocation || model.tableHeaderLocation === this.None;
        let top = model.tableHeaderLocation === this.Top;
        let left = model.tableHeaderLocation === this.Left;
        let both = model.tableHeaderLocation === this.Both;

        let classes = "table tableBordered";
        if (top || none) classes += " tableNoLeftHeader";
        if (left || none) classes += " tableNoTopHeader";

        let html = `<div class="section-table markTooltips tableWrapper search-content search-label-table"><table class="${classes}">`;

        if (none) {
            html += this.generateTableRows(model.table);
        } else if (top) {
            html += this.generateTableHeaderRow(model.table[0]);
            html += this.generateTableRows(model.table.slice(1));
        } else if (left) {
            for (const row of model.table) {
                let rowHtml = `<tr><th class="section-table-cell">${escapeHTML(row[0])}</th>`;
                for (let i = 1; i < row.length; i++) {
                    rowHtml += `<td class="section-table-cell">${escapeHTML(row[i])}</td>`;
                }
                rowHtml += "</tr>";
                html += rowHtml;
            }
        } else if (both) {
            html += this.generateTableHeaderRow(model.table[0]);
            for (let i = 1; i < model.table.length; i++) {
                let rowData = model.table[i];
                let rowHtml = `<tr><th class="section-table-cell">${escapeHTML(rowData[0])}</th>`;
                for (let j = 1; j < rowData.length; j++) {
                    rowHtml += `<td class="section-table-cell">${escapeHTML(rowData[j])}</td>`;
                }
                rowHtml += "</tr>";
                html += rowHtml;
            }
        }

        html += "</table></div>";
        return html;
    }

    static generateTableHeaderRow(headers) {
        let html = "<tr>";
        for (const header of headers) {
            html += `<th class="section-table-cell">${escapeHTML(header)}</th>`;
        }
        html += "</tr>";
        return html;
    }

    static generateTableRows(rows) {
        let html = "";
        for (const row of rows) {
            html += "<tr>";
            for (const cell of row) {
                html += `<td class="section-table-cell">${escapeHTML(cell)}</td>`;
            }
            html += "</tr>";
        }
        return html;
    }
}
