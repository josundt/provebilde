import { pal } from "./constants.ts";
import { ProveBilde, type ProveBildeOptions } from "./provebilde.ts";
import { debounce, toggleFullScreen } from "./utils.ts";
import { WebGLUtil } from "./webgl/webgl-util.ts";

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
    document.addEventListener("keydown", e => {
        if (!o.fx) {
            return;
        }

        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            const factor = e.key === "ArrowRight" ? 1 : -1;

            const bsc = o.fx.brightnessSaturationContrast;
            if (bsc) {
                let bscKey: keyof typeof bsc | undefined;

                if (e.ctrlKey && e.shiftKey) {
                    bscKey = "saturation";
                } else if (e.ctrlKey) {
                    bscKey = "brightness";
                } else if (e.shiftKey) {
                    bscKey = "contrast";
                }
                if (bscKey) {
                    bsc[bscKey] = WebGLUtil.clamp(
                        -1,
                        (bsc[bscKey] as number) + 0.005 * factor,
                        1
                    );
                }
            }
        }
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            const factor = e.key === "ArrowUp" ? 1 : -1;

            const bp = o.fx.bulgePinch;
            if (bp) {
                bp.strength = WebGLUtil.clamp(
                    0,
                    bp.strength + 0.005 * factor,
                    1
                );
            }
        }
    });
}
