import { pal } from "./constants.ts";
import { debounce } from "./debounce.ts";
import { ProveBilde, type ProveBildeOptions } from "./provebilde.ts";

const options: ProveBildeOptions = {
    headerText: "Jørn A",
    footerText: "Sundt",
    showDate: true,
    showTime: true,
    noBlurEdges: false
};

let proveBilde: ProveBilde;

function init(): void {
    if (proveBilde) {
        proveBilde.stop();
    }
    const canvas = document.getElementById("provebilde") as HTMLCanvasElement;
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

document.addEventListener("DOMContentLoaded", () => {
    init();
});

const debouncedInit = debounce(init, 400);

window.addEventListener("resize", () => {
    debouncedInit();
});
