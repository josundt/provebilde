import type { EdgeColor } from "./abstractions.ts";
import { pal } from "./constants.ts";
import { ProveBildeCanvasBackground } from "./provebilde-canvas-background.ts";
import { ProveBildeCanvasCircle } from "./provebilde-canvas-circle.ts";
import { isSafari } from "./utils.ts";

export const defaultEdgeColor: EdgeColor = {
    lighten: "rgb(255 255 255 / 0.666)",
    darken: "rgb(0 0 0 / 0.333)"
};

export interface ProveBildeCanvasOptions {
    blurredEdgesDisabled?: boolean;
    headerText?: string;
    footerText?: string;
    showDate?: boolean;
    showTime?: boolean;
    imageSmootingDisabled?: boolean;
    date?: Date;
}

export interface OnScreenDisplay {
    param: "none" | "brightness" | "contrast" | "saturation";
    level: number;
}

export class ProveBildeCanvas {
    constructor(
        ctx: CanvasRenderingContext2D,
        options: ProveBildeCanvasOptions = {}
    ) {
        this.#options = options;
        this.#ctx = ctx;

        const transp = "rgb(0 0 0 / 0)";
        const edgeColor: EdgeColor = options.blurredEdgesDisabled
            ? { lighten: transp, darken: transp }
            : defaultEdgeColor;
        this.#background = new ProveBildeCanvasBackground(ctx, edgeColor);
        this.#circle = new ProveBildeCanvasCircle(ctx, edgeColor);
        const safari = isSafari(window);
        this.#textVerticalAdjust = safari ? 0 : 2;
        // this.#dateTimeHorizontalPadding = safari ? 16 : 8;
    }

    readonly #options: ProveBildeCanvasOptions;
    readonly #ctx: CanvasRenderingContext2D;
    readonly #background: ProveBildeCanvasBackground;
    readonly #circle: ProveBildeCanvasCircle;
    readonly #textVerticalAdjust: number;

    readonly #headFootHorizontalPadding: number = 6;

    #setDefaultFont(fillStyle: string = "#fff"): void {
        const ctx = this.#ctx;
        ctx.fillStyle = fillStyle;
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
        ctx.fillStyle = "#000";
        ctx.fillRect(
            -headerW / 2 + 1,
            -headerH / 2 - 1,
            headerW - 2,
            headerH - 2
        );
        this.#setDefaultFont();
        ctx.fillText(
            text.toUpperCase().trim(),
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
                ? [dt.getDate(), dt.getMonth() + 1, dt.getFullYear() % 100]
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

    #renderOsd(osd: OnScreenDisplay): void {
        const ctx = this.#ctx;
        ctx.save();

        const [palW, palH] = pal;
        const normalizedValue = Math.round(
            Math.max(-1, Math.min(1, osd.level)) * 20
        );
        ctx.fillStyle = "#0e0";
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#0b0";
        ctx.font = "bold 24px Arial, Helvetica, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.translate(palW / 2, palH / 1.25);
        for (let i = -20; i <= 20; i++) {
            let text: string;
            if (normalizedValue < 0) {
                text = i < normalizedValue || i > 0 ? "-" : "█";
            } else {
                text = i < 0 || i > normalizedValue ? "-" : "█";
            }
            ctx.fillText(text, i * 10, 0, 1000);
        }
        ctx.translate(0, 40);
        const paramText = (
            osd.param === "saturation" ? "color" : osd.param
        ).toUpperCase();
        ctx.fillText(paramText, 0, 0, 1000);
        ctx.strokeText(paramText, 0, 0, 1000);
        ctx.restore();
    }

    renderInitial(): void {
        const ctx = this.#ctx;

        if (this.#options.imageSmootingDisabled) {
            ctx.imageSmoothingEnabled = false;
        }

        ctx.restore();
    }

    renderFrame(timeDelta: number, osd: OnScreenDisplay): void {
        const dt = new Date(Date.now() - timeDelta);
        const o = this.#options;
        const [palW, palH] = pal;
        const [centerX] = [palW / 2, palH / 2];

        this.#background.render();
        this.#circle.render();

        if (o.showDate) {
            this.#renderTime(dt, "date", 155);
        }
        if (o.showTime) {
            this.#renderTime(dt, "time", 449);
        }
        if (typeof o.headerText === "string") {
            this.#renderHeaderOrFooterText(o.headerText, centerX, 57);
        }
        if (typeof o.footerText === "string") {
            this.#renderHeaderOrFooterText(o.footerText, centerX, 436);
        }
        if (osd.param !== "none") {
            this.#renderOsd(osd);
        }
    }
}
