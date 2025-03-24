import { pal } from "./constants.ts";
import { ProveBilde, type ProveBildeOptions } from "./provebilde.ts";
import { debounce, toggleFullScreen } from "./utils.ts";

export interface ProveBildePluginOptions extends ProveBildeOptions {
    /** selector string or element */
    container: string | HTMLElement;
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
    const container =
        typeof options.container === "string"
            ? document.querySelector(options.container)!
            : options.container;

    container.innerHTML = "";
    canvas = document.createElement("canvas");
    container?.appendChild(canvas);
    const resizeObserver = new ResizeObserver(debouncedStart);
    resizeObserver.observe(container);
    start();
    container.addEventListener("click", e => {
        toggleFullScreen(e.currentTarget as HTMLElement);
    });
}
