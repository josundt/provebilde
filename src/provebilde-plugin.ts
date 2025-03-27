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
    #focusedTextBox: "headerText" | "footerText" = "headerText";
    #hadKeyStrokeAfterFocus: boolean = false;

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

    readonly #debouncedClearOsd: () => void = debounce(() => {
        this.#options.ocd.param = "none";
    }, 3000);

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

            if (["ArrowRight", "ArrowLeft"].includes(e.key)) {
                const factor = e.key === "ArrowRight" ? 1 : -1;

                const bsc = o.fx.brightnessSaturationContrast;
                if (bsc) {
                    let bscKey: keyof typeof bsc | undefined;

                    if (!e.ctrlKey && !e.shiftKey) {
                        this.#proveBilde.timeDelta += 60_000 * factor * -1;
                    } else if (e.ctrlKey && e.shiftKey) {
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
                        this.#debouncedClearOsd();
                    }
                }
                e.preventDefault();
            } else if (["ArrowUp", "ArrowDown"].includes(e.key)) {
                const factor = e.key === "ArrowUp" ? 1 : -1;
                const nowTime = Date.now();
                const displayedDate = new Date(
                    nowTime + this.#proveBilde.timeDelta
                );
                const newTime = displayedDate.setDate(
                    displayedDate.getDate() - factor
                );
                this.#proveBilde.timeDelta = newTime - nowTime;
                e.preventDefault();
            } else if (["PageUp", "PageDown"].includes(e.key)) {
                const factor = e.key === "PageUp" ? 1 : -1;
                const bp = o.fx.bulgePinch;
                if (bp) {
                    bp.strength = WebGLUtil.clamp(
                        0,
                        bp.strength + 0.005 * factor,
                        1
                    );
                }
                e.preventDefault();
            } else if (e.key === "Tab") {
                this.#focusedTextBox =
                    this.#focusedTextBox === "headerText"
                        ? "footerText"
                        : "headerText";
                this.#hadKeyStrokeAfterFocus = false;
                e.preventDefault();
            } else if (
                /^.$/u.test(e.key) &&
                !e.ctrlKey &&
                !e.altKey &&
                !e.metaKey
            ) {
                const char = e.key.toUpperCase();
                const textProp = this.#focusedTextBox;
                if (!this.#hadKeyStrokeAfterFocus) {
                    o[textProp] = "";
                }
                o[textProp] += char;
                this.#hadKeyStrokeAfterFocus = true;
                e.preventDefault();
            } else if (e.key === "Backspace") {
                const textProp = this.#focusedTextBox;
                if (o[textProp]) {
                    o[textProp] = o[textProp].substring(
                        0,
                        o[textProp].length - 1
                    );
                }
                e.preventDefault();
            } else if (e.key === "Delete") {
                const textProp = this.#focusedTextBox;
                if (o[textProp]) {
                    o[textProp] = "";
                }
                e.preventDefault();
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
