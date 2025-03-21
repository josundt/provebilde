import { pal } from "./constants.ts";
import { ProveBilde, type ProveBildeOptions } from "./provebilde.ts";
import { debounce, toggleFullScreen } from "./utils.ts";

export interface ProveBildePluginOptions extends ProveBildeOptions {
    containerSelector: string;
}

let proveBilde: ProveBilde;
let canvas: HTMLCanvasElement;
let options: ProveBildePluginOptions;

function start(): void {
    if (proveBilde) {
        proveBilde.stop();
    }
    const ctx = canvas.getContext("2d")!;
    const [palW, palH] = pal;
    const [winW, winH] = [
        ctx.canvas.parentElement!.clientWidth,
        ctx.canvas.parentElement!.clientHeight
    ];
    const [scaleX, scaleY] = [winW / palW, winH / palH];
    const scale = Math.min(scaleX, scaleY);
    canvas.width = palW * scale;
    canvas.height = palH * scale;
    ctx.scale(scale, scale);
    proveBilde = new ProveBilde(ctx, options);
    proveBilde.start();
    document.body.style.zoom = "1";
}

const debouncedStart = debounce(start, 100);

export function initPlugin(o: ProveBildePluginOptions): void {
    options = o;
    const container = document.querySelector(options.containerSelector)!;
    canvas = document.createElement("canvas");
    container?.appendChild(canvas);
    canvas.addEventListener("click", e =>
        toggleFullScreen(e.target as HTMLElement)
    );
    const resizeObserver = new ResizeObserver(debouncedStart);
    resizeObserver.observe(container);
    start();
}
