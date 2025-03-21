import type { EdgeColor } from "./abstractions.ts";
import { pal } from "./constants.ts";
import { ProveBildeBakgrunn } from "./provebilde-bakgrunn.ts";
import { ProveBildeSirkel } from "./provebilde-sirkel.ts";

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
        this.options = options;
        this.ctx = ctx;

        const transp = "rgb(0 0 0 / 0)";
        const edgeColor: EdgeColor = options.noBlurEdges
            ? { lighten: transp, darken: transp }
            : defaultEdgeColor;
        this.background = new ProveBildeBakgrunn(ctx, edgeColor);
        this.circle = new ProveBildeSirkel(ctx, edgeColor);
        this.textVerticalAdjust = this.isSafari ? 0 : 2;
    }

    private get isSafari(): boolean {
        return navigator.userAgent.toLowerCase().includes("safari/");
    }

    private readonly options: ProveBildeOptions;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly background: ProveBildeBakgrunn;
    private readonly circle: ProveBildeSirkel;
    private watchTimer: number | null = 0;
    private readonly textVerticalAdjust: number = 2;

    private static setDefaultFont(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = "#fff";
        ctx.font = "32px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
    }

    private renderLogoText(text: string, cX: number, yOffset: number): void {
        const { ctx } = this;
        const [headerW, headerH] = [168, 42];

        ctx.save();
        ctx.translate(cX, yOffset + headerH / 2 + this.textVerticalAdjust);
        ProveBilde.setDefaultFont(ctx);
        ctx.fillText(text.toUpperCase(), 0, 0, headerW - 8);

        ctx.restore();
    }

    private renderTime(dt: Date, format: "date" | "time", cX: number): void {
        const { ctx } = this;
        ctx.save();

        const [w, h] = [164, 42];
        const [, palH] = pal;
        const cY = palH / 2;
        ctx.fillStyle = "#000";
        ctx.fillRect(cX, cY - h / 2, w, h);
        ProveBilde.setDefaultFont(ctx);
        ctx.wordSpacing = format === "date" ? "-5px" : "-3px";
        const textParts =
            format === "date"
                ? [dt.getDate(), dt.getMonth() + 1, dt.getFullYear() % 1_000]
                : [dt.getHours(), dt.getMinutes(), dt.getSeconds()];

        const formatted = textParts
            .map(p => p.toString().padStart(2, "0"))
            .join(format === "date" ? " - " : " : ");

        ctx.fillText(formatted, cX + w / 2, cY + this.textVerticalAdjust);

        ctx.restore();
    }

    stopWatch(): void {
        if (this.watchTimer !== null) {
            clearInterval(this.watchTimer);
            this.watchTimer = null;
        }
    }

    startWatch(): void {
        const renderDateAndTime = (): void => {
            const dt = new Date();
            if (this.options.showDate) {
                this.renderTime(dt, "date", 155);
            }
            if (this.options.showTime) {
                this.renderTime(dt, "time", 449);
            }
        };
        renderDateAndTime();
        this.stopWatch();
        this.watchTimer = setInterval(renderDateAndTime, 500);
    }

    start(): void {
        const { ctx } = this;

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        //ctx.scale(2, 2);

        this.background.render();
        this.circle.render();

        const [palW, palH] = pal;
        const [centerX] = [palW / 2, palH / 2];

        const o = this.options;
        if (o.headerText) {
            this.renderLogoText(o.headerText, centerX, 57);
        }
        if (o.footerText) {
            this.renderLogoText(o.footerText, centerX, 436);
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
