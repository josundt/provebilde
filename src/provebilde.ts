import {
    ProveBildeCanvas,
    type OnScreenDisplay,
    type ProveBildeCanvasOptions
} from "./provebilde-canvas.ts";
import { ProveBildeFx, type ProvebildeFxOptions } from "./provebilde-fx.ts";

export interface ProveBildeOptions extends ProveBildeCanvasOptions {
    fx?: ProvebildeFxOptions;
    ocd: OnScreenDisplay;
}

export class ProveBilde {
    constructor(ctx: CanvasRenderingContext2D, options: ProveBildeOptions) {
        this.#options = options;
        this.#provebildeCanvas = new ProveBildeCanvas(ctx, options);
        if (options.fx) {
            this.#provebildeFx = new ProveBildeFx(ctx, options.fx);
        }
    }
    readonly #options: Readonly<ProveBildeOptions>;
    readonly #provebildeCanvas: ProveBildeCanvas;
    readonly #provebildeFx: ProveBildeFx | null = null;
    #watchTimer: number | null = 0;

    static getDefaultOptions(): ProveBildeOptions {
        return {
            headerText: "jasMIN",
            footerText: "Retro TV",
            showDate: true,
            showTime: true,

            // date: new Date(1985, 4, 12, 1, 23, 35),

            blurredEdgesDisabled: false,
            imageSmootingDisabled: false,
            fx: ProveBildeFx.getDefaultFx(),
            ocd: {
                param: "none",
                level: 0
            }
        };
    }

    stopWatch(): void {
        if (this.#watchTimer !== null) {
            clearInterval(this.#watchTimer);
            this.#watchTimer = null;
        }
    }

    startWatch(): void {
        const timeDelta = !this.#options.date
            ? 0
            : Date.now() - this.#options.date.getTime();

        const renderFrame = (): void => {
            this.#provebildeCanvas.renderFrame(timeDelta, this.#options.ocd);
            this.#provebildeFx?.renderFrame();
        };

        renderFrame();
        this.stopWatch(); // Ensure no duplicates
        this.#watchTimer = setInterval(renderFrame, 100);
    }

    start(): void {
        const o = this.#options;
        this.#provebildeCanvas.renderInitial();
        this.#provebildeFx?.renderInitial();
        if (o.showDate || o.showTime) {
            this.startWatch();
        }
    }

    stop(): void {
        this.stopWatch();
    }
}
