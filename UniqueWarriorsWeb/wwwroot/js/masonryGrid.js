class MasonryGrid {
    static gapDefault = 10;
    static widthDefault = 200;
    static allResizeDisabled = false;
    resizeDisabled = false;

    constructor(gridElement) {
        this.grid = gridElement;
        this.updateValues();

        this.resize();
        this.initObservers();
    }

    updateValues() {
        this.gapX = +this.grid.getAttribute('gap-x') || +this.grid.getAttribute('gap') || this.gapDefault;
        this.gapY = +this.grid.getAttribute('gap-y') || +this.grid.getAttribute('gap') || this.gapDefault;
        this.minWidth = +this.grid.getAttribute('min-width') || this.widthDefault;
        this.centerAtStart = this.grid.getAttribute('center-at-start') !== "false";
    }

    initObservers() {
        this.initContentObserver();
        this.initAttributeObserver();
    }

    initAttributeObserver() {
        const observer = new MutationObserver(() => {
            this.updateValues();
            resizeMasonryGrid(this.grid);
        });

        observer.observe(this.grid, {
            attributes: true,
            attributeFilter: ['gap-x', 'gap-y', 'min-width', 'center-at-start']
        });
    }

    initContentObserver() {
        const observer = new MutationObserver(mutations => {
            let itemChanged = false;

            // Loop through mutations and detect changes specific to `.masonryGridItem`
            for (const mutation of mutations) {
                if (mutation.target != this.grid && mutation.target.parentElement != this.grid) continue;

                if (
                    mutation.type === "childList" &&
                    ([...mutation.addedNodes, ...mutation.removedNodes].some(node => node.classList?.contains("masonryGridItem")))
                ) {
                    itemChanged = true; // A relevant grid item was added or removed
                    break;
                } else if (
                    mutation.type === "attributes" &&
                    mutation.target.classList.contains("masonryGridItem")
                ) {
                    itemChanged = true; // A relevant grid item had its visibility/style changed
                    break;
                }
            }

            if (itemChanged) {
                this.resize();
            }
        });

        observer.observe(this.grid, {
            childList: true,  // Detect when children (grid-items) are added or removed
            subtree: true,
            attributes: true, // Detect if grid items' visibility changes (style change)
            attributeFilter: ['style', 'class']
        });

        const images = this.grid.querySelectorAll('.masonryGridItem img')
        images.forEach(img => {
            if (!img.complete) {
                img.addEventListener('load', () => this.resize());
            }
        });
    }

    resize() {
        if (this.resizeDisabled || MasonryGrid.allResizeDisabled) return;

        const grid = this.grid;

        // Calculate container width and minimum number of columns based on `minWidth`
        const containerWidth = grid.clientWidth;
        const columnCount = Math.max(
            1,
            Math.floor((containerWidth + this.gapX) / (this.minWidth + this.gapX))
        );

        // Calculate how much space is left after determining the columns
        const totalColumnSpace = columnCount * this.minWidth + (columnCount - 1) * this.gapX;
        const remainingSpace = containerWidth - totalColumnSpace;

        // Calculate the extra width to distribute across all columns
        const stretchPerColumn = remainingSpace > 0 ? remainingSpace / columnCount : 0;

        const itemWidth = this.minWidth + stretchPerColumn;  // Add the extra space evenly to each column

        // Initialize an array to store heights for each column
        const columns = Array(columnCount).fill(0);

        // Process all grid items
        const items = grid.querySelectorAll(":scope > .masonryGridItem");
        const totalItems = items.length;

        // Center align: calculate horizontal start offset if centering is needed
        let startOffset = 0;
        if (this.centerAtStart && totalItems < columnCount) {
            // If fewer items than columns, we'll calculate a center offset
            const emptySpace = containerWidth - (totalItems * itemWidth + (totalItems - 1) * this.gapX);
            startOffset = emptySpace / 2; // Equal offset on both sides
        }

        items.forEach(item => {
            // Determine shortest column
            const minHeight = Math.min(...columns);
            const columnIndex = columns.indexOf(minHeight);

            // Calculate x (horizontal) & y (vertical) positions for the item
            const xPos = startOffset + (columnIndex * (itemWidth + this.gapX));
            const yPos = columns[columnIndex];

            // Apply positioning and sizing to grid item
            item.style.width = `${itemWidth}px`;
            item.style.transform = `translate(${xPos}px, ${yPos}px)`;

            // Measure and update the column height
            const contentHeight = item.offsetHeight;
            columns[columnIndex] += contentHeight + this.gapY;
        });

        // Set the container's height to fit grid items
        grid.style.height = `${Math.max(...columns)}px`;
    }
}

function resizeMasonryGrid(grid) {
    let masonry = grid.__masonry;
    if (masonry) {
        masonry.resize();
    } else {
        grid.__masonry = new MasonryGrid(grid);
    }
}

function resizeAllMasonryGrids() {
    document.querySelectorAll('.masonryGrid').forEach(grid => resizeMasonryGrid(grid));
}

onBodyCreated(() => {
    // Set up an observer to detect when new MasonryGrid elements are added to the DOM
    new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && node.classList.contains("masonryGrid")) {
                    resizeMasonryGrid(node);
                }
            });
        });
    }).observe(document.body, {
        childList: true,
        subtree: true
    });
});

window.addEventListener('load', resizeAllMasonryGrids);
window.addEventListener('resize', resizeAllMasonryGrids);