import LIBRARY from './library.json'

class CodinLibrary extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.allBooks = LIBRARY || [];
        this.filteredBooks = [];
    }

    async connectedCallback() {
        const source = this.getAttribute('data');

        // Render the Toolbar & Empty Grid instantly
        this.shadowRoot.innerHTML = this.getStyles() + `
            <div class="toolbar">
                <input type="text" id="searchInput" placeholder="Search title, author, or category...">
                <select id="sortSelect">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="rating">Highest Rated</option>
                </select>
            </div>
            <div id="grid" class="grid"><p style="opacity: 0.5;">Loading library data...</p></div>
        `;

        // Bind events
        this.shadowRoot.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e));
        this.shadowRoot.getElementById('sortSelect').addEventListener('change', (e) => this.handleSort(e));

        // try {
        //     const response = await fetch(source);
        //     this.allBooks = await response.json();
        // } catch (error) {
        //     console.warn(`Could not fetch ${source}. Falling back to internal mock data.`);
        //     this.allBooks = this.getMockData();
        // }

        this.filteredBooks = [...this.allBooks];
        this.sortData('newest'); // Default sort
        this.renderGrid();
    }

    handleSearch(event) {
        const query = event.target.value.toLowerCase();
        this.filteredBooks = this.allBooks.filter(book =>
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query) ||
            (book.category && book.category.toLowerCase().includes(query))
        );
        this.sortData(this.shadowRoot.getElementById('sortSelect').value);
        this.renderGrid();
    }

    handleSort(event) {
        this.sortData(event.target.value);
        this.renderGrid();
    }

    sortData(method) {
        this.filteredBooks.sort((a, b) => {
            if (method === 'newest') {
                const dateA = a.readDate ? new Date(a.readDate).getTime() : 0;
                const dateB = b.readDate ? new Date(b.readDate).getTime() : 0;
                return dateB - dateA; // Newest first
            }
            if (method === 'oldest') {
                const dateA = a.readDate ? new Date(a.readDate).getTime() : 9999999999999; // Far future if unread
                const dateB = b.readDate ? new Date(b.readDate).getTime() : 9999999999999;
                return dateA - dateB; // Oldest first
            }
            if (method === 'rating') {
                return (b.rating || 0) - (a.rating || 0); // Highest rating first
            }
            return 0;
        });
    }

    renderGrid() {
        const grid = this.shadowRoot.getElementById('grid');

        if (this.filteredBooks.length === 0) {
            grid.innerHTML = `<p style="opacity: 0.5;">No books found matching your search.</p>`;
            return;
        }

        grid.innerHTML = this.filteredBooks.map(book => {
            const stars = book.rating ? '★'.repeat(book.rating) + '☆'.repeat(5 - book.rating) : '';
            return `
                <div class="book-item">
                    <img src="${book.image || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}" alt="${book.title}" class="book-cover" onerror="this.style.opacity='0.2'">
                    <div class="book-info">
                        <!-- <div class="book-meta">${book.category || 'Engineering'} &nbsp; // &nbsp; <span style="color: var(--accent-yellow, #F4D03F); font-size: 1rem;">${stars}</span></div> -->
                        <h3 class="book-title">${book.title}</h3>
                        <p class="book-author">by ${book.author}</p>
                        ${book?.notes ? `<p class="book-notes">"${book.notes}"</p>` : ''}
                        ${book?.affiliate?.amazon ? `<a href="${book.affiliate.amazon}" target="_blank" class="book-link">View on Amazon ↗</a>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    getStyles() {
        return `
            <style>
                :host { display: block; color: var(--text-color, #2B3331); font-family: var(--font-main, sans-serif); }

                /* Toolbar Styles */
                .toolbar { display: flex; gap: 15px; margin-bottom: 30px; flex-wrap: wrap; }
                input, select {
                    font-family: var(--font-sans); font-size: 0.85rem;
                    background: transparent; border: 1px solid rgba(43, 51, 49, 0.2);
                    color: var(--text-color, #2B3331); padding: 10px 15px; border-radius: 4px; outline: none;
                    transition: border-color 0.2s;
                }
                input:focus, select:focus { border-color: var(--accent-yellow, #F4D03F); }
                input { flex-grow: 1; min-width: 200px; }

                select {
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;

                    background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232B3331' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 15px center;
                    background-size: 14px;

                    padding-right: 40px; /* Keep text from overlapping the arrow */
                    cursor: pointer;
                }

                /* Grid Styles */
                .grid { display: flex; flex-direction: column; gap: 40px; }
                .book-item { display: flex; gap: 25px; align-items: flex-start; }
                .book-cover { width: 90px; height: 135px; object-fit: cover; border-radius: 3px; box-shadow: 0 4px 12px rgba(43, 51, 49, 0.15); background-color: rgba(43, 51, 49, 0.05); flex-shrink: 0; }
                .book-info { display: flex; flex-direction: column; }
                .book-meta { font-family: var(--font-sans); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.6; margin-bottom: 8px; }
                .book-title { font-size: 1.25rem; font-weight: 700; margin: 0 0 4px 0; letter-spacing: -0.01em; }
                .book-author { font-size: 0.95rem; font-weight: 500; opacity: 0.8; margin: 0 0 12px 0; }
                .book-notes { font-size: 0.95rem; line-height: 1.5; font-style: italic; opacity: 0.8; border-left: 2px solid var(--accent-yellow, #F4D03F); padding-left: 12px; margin: 0 0 15px 0; }
                .book-link { font-family: var(--font-sans); font-size: 0.8rem; font-weight: 700; color: var(--text-color, #2B3331); text-decoration: none; align-self: flex-start; border-bottom: 2px solid var(--accent-yellow, #F4D03F); padding-bottom: 2px; transition: opacity 0.2s; }
                .book-link:hover { opacity: 0.7; }
                @media (max-width: 600px) {
                  .book-item { gap: 15px; }
                  .toolbar { flex-direction: column; }
                  .book-notes { display: none; }
                  input { width: 100%; box-sizing: border-box; } }
            </style>
        `;
    }

    // getMockData() {
    //     return [
    //     ];
    // }
}

// Register the element globally
customElements.define('codin-library', CodinLibrary);
