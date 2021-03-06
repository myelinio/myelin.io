
class KbdNav {
    private readonly elements: HTMLElement[];

    constructor(elements: HTMLElement[]) {
        this.elements = elements;
    }

    public focusFirstElement(): void {
        this.elements[0].focus();
    }

    public focusLastElement(): void {
        this.elements[this.elements.length - 1].focus();
    }

    public focusNextElement(): void {
        for (let i = 0; i < this.elements.length; i++) {
            if (this.elements[i] === document.activeElement) {
                if (i < this.elements.length - 1) {
                    this.elements[i + 1].focus();
                    return;
                }
                break;
            }
        }

        this.focusFirstElement();
    }

    public focusPrevElement(): void {
        for (let i = 0; i < this.elements.length; i++) {
            if (this.elements[i] === document.activeElement) {
                if (i > 0) {
                    this.elements[i - 1].focus();
                    return;
                }
                break;
            }
        }

        this.focusLastElement();
    }

    public focusElementByChar(ch: string): void {

        function getIndexFirstChars(startIndex: number, elements: HTMLElement[]) {
            for (let i = startIndex; i < elements.length; i++) {
                const el = elements[i];
                if (el && el.textContent) {
                    const firstChar = el.textContent.trim().substring(0, 1).toLowerCase();
                    if (ch === firstChar) {
                        return i;
                    }
                }
            }
            return -1;
        }

        ch = ch.toLowerCase();
        for (let i = 0; i < this.elements.length; i++) {
            if (this.elements[i] === document.activeElement) {

                // Check remaining slots in the strip
                let index = getIndexFirstChars(i + 1, this.elements);

                // If not found in remaining slots, check from beginning
                if (index === -1) {
                    index = getIndexFirstChars(0, this.elements);
                }

                // If match was found...
                if (index > -1) {
                    this.elements[index].focus();
                }
                break;
            }
        }
    }
}
