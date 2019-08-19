
// Attach the event handlers to support the search box and hamburger
function handleHeader(): void {
    const searchForm = "search-form";
    const headerLinks = "header-links";
    const searchTextbox = "search-textbox";
    const showSearch = "show-search";
    const openHamburger = "open-hamburger";

    // Show the header links, hide the search box
    function showNavBarLinks(): void {
        const sf = getById(searchForm);
        if (sf) {
            sf.classList.remove(showSearch);
        }

        const hl = getById(headerLinks);
        if (hl) {
            hl.classList.remove(showSearch);
        }

        const st = getById(searchTextbox) as HTMLInputElement;
        if (st) {
            st.value = "";
        }
    }

    // Show the header search box, hide the links
    function showSearchBox(): void {
        const sf = getById(searchForm);
        if (sf) {
            sf.classList.add(showSearch);
        }

        const hl = getById(headerLinks);
        if (hl) {
            hl.classList.add(showSearch);
        }

        const st = getById(searchTextbox);
        if (st) {
            st.focus();
        }
    }

    // Hide the search box when the user hits the ESC key
    listen(document.body, keyup, o => {
        const e = o as KeyboardEvent;
        if (e.which === 27) {
            showNavBarLinks();
            closeActiveOverlay();
        }
    });

    // Show the search box
    listen(getById("search-show"), click, e => {
        e.preventDefault();
        showSearchBox();
    });

    // Hide the search box
    listen(getById("search-close"), click, e => {
        e.preventDefault();
        showNavBarLinks();
    });

    // When the user submits the search form, initiate a search
    listen(getById(searchForm), "submit", e => {
        e.preventDefault();
        const textbox = getById(searchTextbox) as HTMLInputElement;
        const searchPageUrl = getById("search-page-url") as HTMLInputElement;
        const url = searchPageUrl.value + "?q=" + textbox.value;
        showNavBarLinks();
        window.location.assign(url);
    });

    listen(getById("hamburger"), click, () => {
        const b = getById("brand");
        if (b) {
            b.classList.toggle(openHamburger);
        }

        const hl = getById(headerLinks);
        if (hl) {
            hl.classList.toggle(openHamburger);
        }

        const sf = getById(searchForm);
        if (sf) {
            sf.classList.toggle(openHamburger);
        }

        const st = getById(searchTextbox);
        if (st) {
            st.focus();
        }
    });
}

handleHeader();
