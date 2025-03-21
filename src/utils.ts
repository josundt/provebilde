import type { Size } from "./abstractions.ts";

type Func<TArgs extends any[], TReturn> = (...args: TArgs) => TReturn;

export function debounce<TArgs extends any[]>(
    func: Func<TArgs, any>,
    wait: number,
    immediate: boolean = false
): Func<TArgs, void> {
    let timeout: number | null = null;
    return (...args: TArgs) => {
        const later = (): void => {
            timeout = null;
            if (!immediate) {
                func(...args);
            }
        };
        const callNow = immediate && !timeout;
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait) as unknown as number;
        if (callNow) {
            func(...args);
        }
    };
}

/**
 * Helper to overcome missing OffscreenCanvas support in Safari
 * @param size The size
 * @returns The off/on screen rendering context
 */
export function createOffscreenCanvasContext(
    ...size: Size
): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
    let result: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    if ("OffscreenCanvas" in self) {
        result = new OffscreenCanvas(...size).getContext("2d")!;
    } else {
        const canvas = document.createElement("canvas");
        [canvas.width, canvas.height] = size;
        return canvas.getContext("2d")!;
    }
    return result;
}

export function isSafari(win: Window): boolean {
    return (
        window.navigator.userAgent.includes("Mac OS X") &&
        window.navigator.userAgent.includes("Safari")
    );
}

let isFullScreen = false;
let fullScreenTogglePromise: Promise<void> | null = null;

export function toggleFullScreen(elem: HTMLElement): void {
    if (fullScreenTogglePromise) {
        return;
    }
    if (isFullScreen) {
        fullScreenTogglePromise = document.exitFullscreen();
    } else {
        fullScreenTogglePromise = elem.requestFullscreen();
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fullScreenTogglePromise
        .then(() => {
            isFullScreen = !isFullScreen;
        })
        .finally(() => (fullScreenTogglePromise = null));
}
