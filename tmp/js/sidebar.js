"use strict";

function handleSidebar() {
    const sidebar = getById("sidebar");
    if (!sidebar) {
        return;
    }
    // toggle subtree i n sidebar
    sidebar.querySelectorAll(".body").forEach(body => {
        body.querySelectorAll(button).forEach(o => {
            listen(o, click, e => {
                const button = e.currentTarget;
                button.classList.toggle("show");
                const next = button.nextElementSibling;
                if (!next) {
                    return;
                }
                const ul = next.nextElementSibling;
                if (!ul) {
                    return;
                }
                toggleAttribute(ul, ariaExpanded);
                let el = ul;
                do {
                    el = el.parentElement;
                } while (!el.classList.contains("body"));
                // adjust the body's max height to the total size of the body's content
                el.style.maxHeight = el.scrollHeight + "px";
            });
        });
    });
    const headers = [];
    sidebar.querySelectorAll(".header").forEach(header => {
        headers.push(header);
    });
    const kbdnav = new KbdNav(headers);
    function toggleHeader(header) {
        const body = header.nextElementSibling;
        if (!body) {
            return;
        }
        body.classList.toggle("show");
        toggleAttribute(header, ariaExpanded);
        if (body.classList.contains("show")) {
            // set this as the limit for expansion
            body.style.maxHeight = body.scrollHeight + "px";
        }
        else {
            // if was expanded, reset this
            body.style.maxHeight = null;
        }
    }
    // expand/collapse cards
    sidebar.querySelectorAll(".header").forEach(header => {
        if (header.classList.contains("dynamic")) {
            listen(header, click, () => {
                toggleHeader(header);
            });
            listen(header, keydown, o => {
                const e = o;
                const ch = e.key;
                if (e.ctrlKey || e.altKey || e.metaKey) {
                    // nothing
                }
                else if (e.shiftKey) {
                    if (isPrintableCharacter(ch)) {
                        kbdnav.focusElementByChar(ch);
                    }
                }
                else {
                    switch (e.keyCode) {
                        case keyCodes.UP:
                            kbdnav.focusPrevElement();
                            break;
                        case keyCodes.DOWN:
                            kbdnav.focusNextElement();
                            break;
                        case keyCodes.HOME:
                            kbdnav.focusFirstElement();
                            break;
                        case keyCodes.END:
                            kbdnav.focusLastElement();
                            break;
                        case keyCodes.RETURN:
                            toggleHeader(header);
                            break;
                        case keyCodes.TAB:
                            return;
                        default:
                            if (isPrintableCharacter(ch)) {
                                kbdnav.focusElementByChar(ch);
                            }
                            break;
                    }
                    e.preventDefault();
                    e.cancelBubble = true;
                }
            });
        }
    });
    // force expand the default cards
    sidebar.querySelectorAll(".body").forEach(body => {
        if (body.classList.contains("default")) {
            body.style.maxHeight = body.scrollHeight + "px";
            body.classList.toggle("default");
            body.classList.toggle("show");
            const header = body.previousElementSibling;
            if (header) {
                toggleAttribute(header, ariaExpanded);
            }
        }
    });
    // toggle sidebar on/off
    listen(getById("sidebar-toggler"), click, e => {
        const sc = getById("sidebar-container");
        if (sc) {
            sc.classList.toggle(active);
            const icon = e.currentTarget.querySelector("svg.icon");
            if (icon) {
                icon.classList.toggle("flipped");
            }
        }
    });
}
handleSidebar();
//# sourceMappingURL=sidebar.js.map