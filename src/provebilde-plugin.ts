import { pal } from "./constants.ts";
import type { OnScreenDisplay } from "./provebilde-canvas.ts";
import { ProveBilde, type ProveBildeOptions } from "./provebilde.ts";
import { debounce, toggleFullScreen } from "./utils.ts";
import { WebGLUtil } from "./webgl/webgl-util.ts";

export interface ProveBildePluginOptions extends ProveBildeOptions {
    /** selector string or element */
    container: string | HTMLElement;
}

export class ProveBildePlugin {
    private constructor(options: ProveBildePluginOptions) {
        this.#options = options;

        const container =
            typeof options.container === "string"
                ? document.querySelector(options.container)!
                : options.container;

        container.innerHTML = "";
        this.#canvas = document.createElement("canvas");
        container?.appendChild(this.#canvas);
        this.#initEventHandlers(container);
        this.#start();
    }

    static create(options: ProveBildePluginOptions): ProveBildePlugin {
        return new ProveBildePlugin(options);
    }

    readonly #canvas: HTMLCanvasElement;
    readonly #options: ProveBildePluginOptions;
    #proveBilde!: ProveBilde;

    #start(): void {
        if (this.#proveBilde) {
            this.#proveBilde.stop();
        }
        const ctx = this.#canvas.getContext("2d")!;
        const [palW, palH] = pal;
        const [winW, winH] = [
            ctx.canvas.parentElement!.clientWidth,
            ctx.canvas.parentElement!.clientHeight
        ];
        const [scaleX, scaleY] = [winW / palW, winH / palH];
        const scale = Math.min(scaleX, scaleY);
        this.#canvas.width = palW * scale;
        this.#canvas.height = palH * scale;
        ctx.scale(scale, scale);
        this.#proveBilde = new ProveBilde(ctx, this.#options);
        this.#proveBilde.start();
        document.body.style.zoom = "1";
    }

    readonly #debouncedStart: () => void = debounce(
        this.#start.bind(this),
        100
    );

    #initEventHandlers(container: Element): void {
        const o = this.#options;
        const resizeObserver = new ResizeObserver(this.#debouncedStart);
        resizeObserver.observe(container);
        container.addEventListener("click", e => {
            toggleFullScreen(e.currentTarget as HTMLElement);
        });
        // eslint-disable-next-line complexity
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
                        const value = WebGLUtil.clamp(
                            -1,
                            (bsc[bscKey] as number) + 0.01 * factor,
                            1
                        );
                        bsc[bscKey] = value;
                        this.#options.ocd.level = value;
                        this.#options.ocd.param =
                            bscKey as OnScreenDisplay["param"];
                    }
                }
            } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                const factor = e.key === "ArrowUp" ? 1 : -1;

                const bp = o.fx.bulgePinch;
                if (bp) {
                    bp.strength = WebGLUtil.clamp(
                        0,
                        bp.strength + 0.005 * factor,
                        1
                    );
                }
            } else if (/^[ \wæøå.,]$/u.test(e.key)) {
                const char = e.key.toUpperCase();
                if (!e.shiftKey) {
                    o.headerText += char;
                } else {
                    o.footerText += char;
                }
            } else if (e.key === "Backspace") {
                if (e.shiftKey && o.footerText) {
                    o.footerText = o.footerText.substring(
                        0,
                        o.footerText.length - 1
                    );
                } else if (!e.shiftKey && o.headerText) {
                    o.headerText = o.headerText.substring(
                        0,
                        o.headerText.length - 1
                    );
                }
            } else if (e.key === "Delete") {
                if (e.shiftKey) {
                    o.footerText = "";
                } else {
                    o.headerText = "";
                }
            }
        });

        // Stop animation when tab is not active
        window.addEventListener("blur", () => {
            this.#proveBilde.stop();
        });
        window.addEventListener("focus", () => {
            this.#proveBilde.start();
        });
    }
}
