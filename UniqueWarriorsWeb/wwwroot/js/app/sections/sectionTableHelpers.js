class SectionTableHelpers {
    static Top = "Top";
    static Left = "Left";
    static Both = "Both";
    static None = null;

    static generateHtmlForTable(model) {
        // Create the wrapper and main table element
        const tableWrapper = fromHTML(`<div class="tableWrapper search-content search-label-table">`);
        const table = fromHTML(`<table>`);

        // Determine the classes for the table based on header location
        let none = !model.TableHeaderLocation || model.TableHeaderLocation === this.None;
        let top = model.TableHeaderLocation === this.Top;
        let left = model.TableHeaderLocation === this.Left;
        let both = model.TableHeaderLocation === this.Both;

        // Add relevant classes
        table.classList.add("tableBordered");
        if (top || none) {
            table.classList.add("tableNoLeftHeader");
        }
        if (left || none) {
            table.classList.add("tableNoTopHeader");
        }

        // Append the table to the wrapper
        tableWrapper.appendChild(table);

        // Generate rows and cells based on header logic
        if (none) {
            model.Table.forEach(rowData => {
                const row = this.createTableRow(rowData);
                table.appendChild(row);
            });
        } else if (top) {
            table.appendChild(this.createTableHeader(model.Table[0]));
            for (let i = 1; i < model.Table.length; i++) {
                table.appendChild(this.createTableRow(model.Table[i]));
            }
        } else if (left) {
            model.Table.forEach(rowData => {
                const row = fromHTML(`<tr>`);
                const headerCell = fromHTML(`<th><span>`);
                headerCell.querySelector("span").textContent = rowData[0];
                row.appendChild(headerCell);

                for (let i = 1; i < rowData.length; i++) {
                    const cell = fromHTML(`<td><span>`);
                    cell.querySelector("span").textContent = rowData[i];
                    row.appendChild(cell);
                }

                table.appendChild(row);
            });
        } else if (both) {
            table.appendChild(this.createTableHeader(model.Table[0]));
            for (let i = 1; i < model.Table.length; i++) {
                const row = fromHTML(`<tr>`);

                const headerCell = fromHTML(`<th><span>`);
                headerCell.querySelector("span").textContent = model.Table[i][0];
                row.appendChild(headerCell);

                for (let j = 1; j < model.Table[i].length; j++) {
                    const cell = fromHTML(`<td><span>`);
                    cell.querySelector("span").textContent = model.Table[i][j];
                    row.appendChild(cell);
                }

                table.appendChild(row);
            }
        }

        return tableWrapper;
    }

    static createTableHeader(headers) {
        const headerRow = fromHTML(`<tr>`);
        headers.forEach(header => {
            const cell = fromHTML(`<th><span>`);
            cell.querySelector("span").textContent = header;
            headerRow.appendChild(cell);
        });
        return headerRow;
    }

    static createTableRow(rowData) {
        const row = fromHTML(`<tr>`);
        rowData.forEach(cellData => {
            const cell = fromHTML(`<td><span>`);
            cell.querySelector("span").textContent = cellData;
            row.appendChild(cell);
        });
        return row;
    }
}
