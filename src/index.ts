import { pal } from "./constants.ts";
import { ProveBilde, type ProveBildeOptions } from "./provebilde.ts";
import { debounce, toggleFullScreen } from "./utils.ts";

const options: ProveBildeOptions = {
    headerText: "jasMIN",
    footerText: "Retro TV",
    showDate: true,
    showTime: true,
    noBlurEdges: false
};

let proveBilde: ProveBilde;
let canvas: HTMLCanvasElement;

function init(): void {
    if (proveBilde) {
        proveBilde.stop();
    }
    if (!canvas) {
        canvas = document.getElementById("provebilde") as HTMLCanvasElement;
        canvas.addEventListener("click", e =>
            toggleFullScreen(e.target as HTMLElement)
        );
    }
    const ctx = canvas.getContext("2d")!;
    const [palW, palH] = pal;
    const [winW, winH] = [window.innerWidth, window.innerHeight];
    const [scaleX, scaleY] = [winW / palW, winH / palH];
    const scale = Math.min(scaleX, scaleY);
    canvas.width = palW * scale;
    canvas.height = palH * scale;
    ctx.scale(scale, scale);
    proveBilde = new ProveBilde(ctx, options);
    proveBilde.start();
}

const debouncedInit = debounce(init, 400);

document.addEventListener("DOMContentLoaded", () => {
    init();
    document.body.style.zoom = "1";
});

window.addEventListener("resize", () => {
    debouncedInit();
});
