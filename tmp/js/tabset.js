"use strict";

function handleTabs() {
    function updateLikeTabsets(cookieName, cookieValue) {
        document.querySelectorAll(".tabset").forEach(tabset => {
            tabset.querySelectorAll(".tab-strip").forEach(o => {
                const strip = o;
                if (strip.dataset.cookieName === cookieName) {
                    strip.querySelectorAll("[role=tab]").forEach(tab => {
                        const attr = tab.getAttribute(ariaControls);
                        if (!attr) {
                            return;
                        }
                        const panel = getById(attr);
                        if (!panel) {
                            return;
                        }
                        if (tab.dataset.cookieValue === cookieValue) {
                            tab.setAttribute(ariaSelected, "true");
                            tab.removeAttribute(tabIndex);
                            panel.removeAttribute("hidden");
                        }
                        else {
                            tab.removeAttribute(ariaSelected);
                            tab.setAttribute(tabIndex, "-1");
                            panel.setAttribute("hidden", "");
                        }
                    });
                }
            });
        });
    }
    document.querySelectorAll(".tabset").forEach(tabset => {
        const strip = tabset.querySelector(".tab-strip");
        if (!strip) {
            return;
        }
        const cookieName = strip.dataset.cookieName;
        const panels = tabset.querySelectorAll("[role=tabpanel]");
        const tabs = [];
        strip.querySelectorAll("[role=tab]").forEach(tab => {
            tabs.push(tab);
        });
        const kbdnav = new KbdNav(tabs);
        function activateTab(tab) {
            deactivateAllTabs();
            tab.removeAttribute(tabIndex);
            tab.setAttribute(ariaSelected, "true");
            const ac = tab.getAttribute(ariaControls);
            if (ac) {
                const other = getById(ac);
                if (other) {
                    other.removeAttribute("hidden");
                }
            }
        }
        function deactivateAllTabs() {
            tabs.forEach(tab => {
                tab.setAttribute(tabIndex, "-1");
                tab.setAttribute(ariaSelected, "false");
            });
            panels.forEach(panel => {
                panel.setAttribute("hidden", "");
            });
        }
        if (cookieName) {
            const cookieValue = readCookie(cookieName);
            if (cookieValue) {
                updateLikeTabsets(cookieName, cookieValue);
            }
        }
        // attach the event handlers to support tab sets
        strip.querySelectorAll(button).forEach(tab => {
            listen(tab, "focus", () => {
                activateTab(tab);
                if (cookieName) {
                    const cookieValue = tab.dataset.cookieValue;
                    if (cookieValue) {
                        createCookie(cookieName, cookieValue);
                        updateLikeTabsets(cookieName, cookieValue);
                    }
                }
            });
            listen(tab, "click", () => {
                activateTab(tab);
                if (cookieName) {
                    const cookieValue = tab.dataset.cookieValue;
                    if (cookieValue) {
                        createCookie(cookieName, cookieValue);
                        updateLikeTabsets(cookieName, cookieValue);
                    }
                }
            });
            listen(tab, keydown, o => {
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
                        case keyCodes.LEFT:
                            kbdnav.focusPrevElement();
                            break;
                        case keyCodes.RIGHT:
                            kbdnav.focusNextElement();
                            break;
                        case keyCodes.HOME:
                            kbdnav.focusFirstElement();
                            break;
                        case keyCodes.END:
                            kbdnav.focusLastElement();
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
        });
    });
}
handleTabs();
//# sourceMappingURL=tabset.js.map