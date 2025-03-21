import { pal } from "./constants.ts";
import { ProveBilde, type ProveBildeOptions } from "./provebilde.ts";
import { debounce } from "./utils.ts";

const options: ProveBildeOptions = {
    headerText: "Jørn A",
    footerText: "Sundt",
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
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        canvas.addEventListener("click", e =>
            (e.target as HTMLElement).requestFullscreen()
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
    // proveBilde.start();
    document.writeln(window.navigator.userAgent);
}

const debouncedInit = debounce(init, 400);

document.addEventListener("DOMContentLoaded", () => {
    init();
    document.body.style.zoom = "1";
});

window.addEventListener("resize", () => {
    debouncedInit();
});
