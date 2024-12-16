class MasonryGrid {
    static gapDefault = 10;
    static widthDefault = 200;
    static allResizeDisabled = false;
    resizeDisabled = false;

    constructor(gridElement) {
        this.grid = gridElement;
        let self = this;
        this.debouncedResize = debounce(() => self.resize());
        this.updateValues();

        this.debouncedResize();
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

                if (mutation.type === "childList" && ([...mutation.addedNodes, ...mutation.removedNodes].some(node => node.classList?.contains("masonryGridItem")))) {
                    this.debouncedResize();
                }
            }
        });

        observer.observe(this.grid, {
            childList: true,  // Detect when children (grid-items) are added or removed
            subtree: true,
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
        if (grid.children.length === 0) return;

        // Measure container and calculate layout - reading phase
        const scrollbarWidth = window.innerWidth < 750 ? 0 : getScrollbarWidth(); // Special handling for container window width
        const containerWidth = grid.clientWidth - (isYScrollbarPresent() ? 0 : Math.floor(scrollbarWidth / 2));
        const columnCount = Math.max(
            1,
            Math.floor((containerWidth + this.gapX) / (this.minWidth + this.gapX))
        );

        const totalColumnSpace = columnCount * this.minWidth + (columnCount - 1) * this.gapX;
        const remainingSpace = containerWidth - totalColumnSpace;
        const stretchPerColumn = remainingSpace > 0 ? remainingSpace / columnCount : remainingSpace;
        const itemWidth = this.minWidth + stretchPerColumn;

        const items = Array.from(grid.querySelectorAll(":scope > .masonryGridItem"));
        const columns = Array(columnCount).fill(0);
        const positions = []; // Store positions for a later write phase
        let startOffset = 0;

        if (this.centerAtStart && items.length < columnCount) {
            const emptySpace = containerWidth - (items.length * itemWidth + (items.length - 1) * this.gapX);
            startOffset = emptySpace / 2; // Center alignment offset
        }

        // Batch write widths
        items.forEach(item => {
            item.style.width = `${itemWidth}px`;
        });

        // Batch read height and calculate position
        items.forEach(item => {
            const minHeight = Math.min(...columns);
            const columnIndex = columns.indexOf(minHeight);
            const xPos = Math.floor(startOffset + (columnIndex * (itemWidth + this.gapX)));
            const yPos = columns[columnIndex];

            // Store positions for later updates
            positions.push({ item, xPos, yPos });

            // Estimate height - avoids layout thrashing
            const contentHeight = item.offsetHeight;
            columns[columnIndex] += contentHeight + this.gapY;
        });

        // Batch write position
        positions.forEach(({ item, xPos, yPos }) => {
            item.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        });

        // Set container height
        const gridHeight = Math.max(...columns);
        grid.style.height = `${gridHeight}px`;
    }
}

function resizeMasonryGrid(grid) {
    if (!grid.classList.contains('masonryGrid')) return;

    let masonry = grid._masonry;
    if (masonry) {
        masonry.debouncedResize();
    } else {
        grid._masonry = new MasonryGrid(grid);
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
                if (node.nodeType === Node.ELEMENT_NODE) {
                    resizeMasonryGrid(node);
                    node.querySelectorAll('.masonryGrid').forEach(resizeMasonryGrid);
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