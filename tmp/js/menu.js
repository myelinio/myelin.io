"use strict";


function handleMenu() {
    document.querySelectorAll(".menu").forEach(menu => {
        const trigger = menu.querySelector(".menu-trigger");
        const content = menu.querySelector(".menu-content");
        if (!trigger || !content) {
            // malformed menu
            return;
        }
        // get all the menu items, setting role="menuitem" and tabindex="-1" along the way
        const items = [];
        for (const el of content.children) {
            const child = el;
            if (child.getAttribute("role") === "menuitem") {
                items.push(child);
            }
        }
        const kbdnav = new KbdNav(items);
        function focusTrigger() {
            if (trigger) {
                trigger.focus();
            }
        }
        listen(trigger, click, e => {
            toggleOverlay(menu);
            toggleAttribute(e.currentTarget, ariaExpanded);
            e.cancelBubble = true;
        });
        listen(trigger, keydown, o => {
            const e = o;
            const ch = e.key;
            switch (e.keyCode) {
                case keyCodes.SPACE:
                case keyCodes.RETURN:
                case keyCodes.DOWN:
                    showOverlay(menu);
                    kbdnav.focusFirstElement();
                    break;
                case keyCodes.UP:
                    showOverlay(menu);
                    kbdnav.focusLastElement();
                    break;
                default:
                    if (isPrintableCharacter(ch)) {
                        kbdnav.focusElementByChar(ch);
                    }
                    return;
            }
            e.stopPropagation();
            e.preventDefault();
        });
        items.forEach(el => {
            listen(el, keydown, o => {
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
                        case keyCodes.SPACE:
                            break;
                        case keyCodes.RETURN:
                            const evt = new MouseEvent(click, {
                                bubbles: true,
                                cancelable: true,
                                clientX: 20,
                                view: window,
                            });
                            el.dispatchEvent(evt);
                            break;
                        case keyCodes.ESC:
                        case keyCodes.TAB:
                            focusTrigger();
                            closeActiveOverlay();
                            return;
                        case keyCodes.UP:
                            kbdnav.focusPrevElement();
                            break;
                        case keyCodes.DOWN:
                            kbdnav.focusNextElement();
                            break;
                        case keyCodes.HOME:
                        case keyCodes.PAGEUP:
                            kbdnav.focusFirstElement();
                            break;
                        case keyCodes.END:
                        case keyCodes.PAGEDOWN:
                            kbdnav.focusLastElement();
                            break;
                        default:
                            if (isPrintableCharacter(ch)) {
                                kbdnav.focusElementByChar(ch);
                            }
                            return;
                    }
                    e.stopPropagation();
                    e.preventDefault();
                }
            });
        });
    });
}
handleMenu();
//# sourceMappingURL=menu.js.map