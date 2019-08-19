"use strict";


function handleThemes() {
    // reapply this in case the first call didn't 'stick' due to timing
    applyStyleSheet(cookieValue);
    listen(getById(lightThemeItem), click, () => {
        applyStyleSheet(lightTheme);
        createCookie(styleCookie, lightTheme);
        return false;
    });
    listen(getById(darkThemeItem), click, () => {
        applyStyleSheet(darkTheme);
        createCookie(styleCookie, darkTheme);
        return false;
    });
}
handleThemes();
//# sourceMappingURL=themes.js.map