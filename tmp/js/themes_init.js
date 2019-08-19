"use strict";


const darkThemeClass = "dark-theme";
const darkTheme = "Dark Theme";
const darkThemeItem = "dark-theme-item";
const lightTheme = "Light Theme";
const lightThemeItem = "light-theme-item";
const styleCookie = "style";
function applyStyleSheet(theme) {
    // convert legacy cookie values
    if (theme === "dark") {
        theme = darkTheme;
    }
    else if (theme === "light") {
        theme = lightTheme;
    }
    if (theme === darkTheme) {
        document.documentElement.classList.add(darkThemeClass);
    }
    else {
        document.documentElement.classList.remove(darkThemeClass);
    }
    // set the active theme menu item
    let item = document.getElementById(lightThemeItem);
    if (item) {
        if (theme === darkTheme) {
            item.classList.remove(active);
        }
        else {
            item.classList.add(active);
        }
    }
    item = document.getElementById(darkThemeItem);
    if (item) {
        if (theme === darkTheme) {
            item.classList.add(active);
        }
        else {
            item.classList.remove(active);
        }
    }
}
function readCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let c of ca) {
        while (c.charAt(0) === " ") {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return null;
}
function readSystemDefault() {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return darkTheme;
    }
    else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
        return lightTheme;
    }
    return null;
}
let cookieValue = readCookie(styleCookie);
if (cookieValue === null) {
    cookieValue = readSystemDefault();
}
applyStyleSheet(cookieValue);
//# sourceMappingURL=themes_init.js.map