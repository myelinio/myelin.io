"use strict";


const callToActionDelayMs = 250;
function handleCallToAction() {
    window.setTimeout(() => {
        document.querySelectorAll(".call-to-action").forEach(el => {
            el.style.opacity = "1";
        });
    }, callToActionDelayMs);
}
handleCallToAction();
//# sourceMappingURL=callToAction.js.map