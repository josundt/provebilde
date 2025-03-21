import type { EdgeColor } from "./abstractions.ts";
import { pal } from "./constants.ts";
import { ProveBildeBakgrunn } from "./provebilde-bakgrunn.ts";
import { ProveBildeSirkel } from "./provebilde-sirkel.ts";
import { isSafari } from "./utils.ts";

export interface ProveBildeOptions {
    noBlurEdges?: boolean;
    headerText?: string;
    footerText?: string;
    showDate?: boolean;
    showTime?: boolean;
}

export const defaultEdgeColor: EdgeColor = {
    lighten: "rgb(255 255 255 / 0.666)",
    darken: "rgb(0 0 0 / 0.333)"
};

export class ProveBilde {
    constructor(
        ctx: CanvasRenderingContext2D,
        options: ProveBildeOptions = {}
    ) {
        this.#options = options;
        this.#ctx = ctx;

        const transp = "rgb(0 0 0 / 0)";
        const edgeColor: EdgeColor = options.noBlurEdges
            ? { lighten: transp, darken: transp }
            : defaultEdgeColor;
        this.#background = new ProveBildeBakgrunn(ctx, edgeColor);
        this.#circle = new ProveBildeSirkel(ctx, edgeColor);
        const safari = isSafari(window);
        this.#textVerticalAdjust = safari ? 0 : 2;
        // this.#dateTimeHorizontalPadding = safari ? 16 : 8;
    }

    readonly #options: ProveBildeOptions;
    readonly #ctx: CanvasRenderingContext2D;
    readonly #background: ProveBildeBakgrunn;
    readonly #circle: ProveBildeSirkel;
    readonly #headFootHorizontalPadding: number = 6;

    #watchTimer: number | null = 0;

    readonly #textVerticalAdjust: number;

    // readonly #dateTimeHorizontalPadding: number;;
    #setDefaultFont(): void {
        const ctx = this.#ctx;
        ctx.fillStyle = "#fff";
        ctx.font = "32px Arial, Helvetica, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
    }

    #fillTextMonoSpaced(
        ...fillArgs: Required<Parameters<CanvasRenderingContext2D["fillText"]>>
    ): void {
        const ctx = this.#ctx;
        ctx.save();
        const [text, x, y, maxWidth] = fillArgs;
        const charWidth = maxWidth / text.length;
        const currX = x - (text.length * charWidth) / 2;

        ctx.translate(maxWidth / 2 - 3, 0);

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            ctx.translate(charWidth, 0);
            ctx.fillText(char, currX, y + this.#textVerticalAdjust, charWidth);
        }

        ctx.restore();
    }

    #renderHeaderOrFooterText(text: string, cX: number, yOffset: number): void {
        const ctx = this.#ctx;
        const [headerW, headerH] = [168, 42];

        ctx.save();
        ctx.translate(cX, yOffset + headerH / 2 + this.#textVerticalAdjust);
        this.#setDefaultFont();
        ctx.fillText(
            text.toUpperCase(),
            0,
            0,
            headerW - this.#headFootHorizontalPadding * 2
        );

        ctx.restore();
    }

    #renderTime(dt: Date, format: "date" | "time", cX: number): void {
        const ctx = this.#ctx;
        ctx.save();

        const [w, h] = [164, 42];
        const [, palH] = pal;
        const cY = palH / 2;
        ctx.fillStyle = "#000";
        ctx.fillRect(cX, cY - h / 2, w, h);
        this.#setDefaultFont();
        const textParts =
            format === "date"
                ? [dt.getDate(), dt.getMonth() + 1, dt.getFullYear() % 1_000]
                : [dt.getHours(), dt.getMinutes(), dt.getSeconds()];

        const formatted = textParts
            .map(p => p.toString().padStart(2, "0"))
            .join(format === "date" ? "-" : ":");

        this.#fillTextMonoSpaced(
            formatted,
            cX,
            cY,
            w - this.#headFootHorizontalPadding * 2
        );

        ctx.restore();
    }

    stopWatch(): void {
        if (this.#watchTimer !== null) {
            clearInterval(this.#watchTimer);
            this.#watchTimer = null;
        }
    }

    startWatch(): void {
        const renderDateAndTime = (): void => {
            const dt = new Date();
            if (this.#options.showDate) {
                this.#renderTime(dt, "date", 155);
            }
            if (this.#options.showTime) {
                this.#renderTime(dt, "time", 449);
            }
        };
        renderDateAndTime();
        this.stopWatch();
        this.#watchTimer = setInterval(renderDateAndTime, 500);
    }

    start(): void {
        const ctx = this.#ctx;

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        this.#background.render();
        this.#circle.render();

        const [palW, palH] = pal;
        const [centerX] = [palW / 2, palH / 2];

        const o = this.#options;
        if (o.headerText) {
            this.#renderHeaderOrFooterText(o.headerText, centerX, 57);
        }
        if (o.footerText) {
            this.#renderHeaderOrFooterText(o.footerText, centerX, 436);
        }

        if (o.showDate || o.showTime) {
            this.startWatch();
        }

        ctx.restore();
    }

    stop(): void {
        this.stopWatch();
    }
}
