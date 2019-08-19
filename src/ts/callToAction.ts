
const callToActionDelayMs = 250;

function handleCallToAction(): void {
    window.setTimeout(() => {
        document.querySelectorAll<HTMLElement>(".call-to-action").forEach(el => {
            el.style.opacity = "1";
        });
    }, callToActionDelayMs);
}

handleCallToAction();
