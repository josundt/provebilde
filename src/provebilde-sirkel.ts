import type { EdgeColor, Rect } from "./abstractions.ts";
import { pal } from "./constants.ts";
import { createOffscreenCanvasContext } from "./utils.ts";

export class ProveBildeSirkel {
    constructor(ctx: CanvasRenderingContext2D, edgeColor: EdgeColor) {
        this.edgeColor = edgeColor;
        this.ctx = ctx;

        const [palW, palH] = pal;
        const [fW, fgH] = [84 * 6, 84 * 6];
        const [fgX, fgY] = [palW / 2 - fW / 2, palH / 2 - fgH / 2];
        this.rect = [fgX, fgY, fW, fgH];
    }

    private readonly edgeColor: EdgeColor;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly rect: Rect;

    private translate<TReturn>(
        x: number,
        y: number,
        callback: () => TReturn
    ): TReturn {
        const { ctx } = this;
        ctx.save();
        ctx.translate(x, y);
        const result = callback();
        ctx.restore();
        return result;
    }

    private createGradientPattern(width: number): CanvasPattern {
        const ctx = createOffscreenCanvasContext(width, 1);
        const gradient = ctx.createLinearGradient(0, 0, width, 1);
        gradient.addColorStop(0, "#000");
        gradient.addColorStop(0.5, "#fff");
        gradient.addColorStop(1, "#000");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, 1);
        return ctx.createPattern(ctx.canvas, "repeat")!;
    }

    private renderTopRow(): number {
        const { ctx } = this;
        const [, , fW] = this.rect;
        const h = 21;
        ctx.fillStyle = "#fff";
        ctx.fillRect(-fW / 2, 0, fW, h);
        return h;
    }

    private renderHeaderRow(): number {
        const { ctx } = this;
        const [, , fW] = this.rect;
        const h = 42;
        const w = 168;
        ctx.fillStyle = "#fff";
        ctx.fillRect(-fW / 2, 0, fW, h);
        ctx.fillStyle = "#000";
        ctx.fillRect(-w / 2, 0, w, h);
        return h;
    }

    private renderReflectionCheckRow(inverse?: boolean): number {
        const { ctx } = this;
        const [, , fW] = this.rect;
        const h = 42;

        // Background rect
        ctx.fillStyle = inverse ? "#000" : "#fff";
        ctx.fillRect(-fW / 2, 0, fW, h);

        ctx.fillStyle = inverse ? "#fff" : "#000";

        // Left rect
        ctx.fillRect(-fW / 2, 0, 126, h);
        // Right rect
        ctx.fillRect(fW / 2 - 126, 0, 126, h);

        // Reflection bar
        ctx.fillRect(-fW / 2 + 145, 0, 4, h);
        // Reflection bar Blur borders
        ctx.fillStyle = inverse
            ? "rgb(0 0 0 / 0.333)"
            : "rgb(255 255 255 / 0.333)";
        ctx.fillRect(-fW / 2 + 145, 0, 1, h);
        ctx.fillRect(-fW / 2 + 148, 0, 1, h);

        return h;
    }

    private renderSquareWave75Row(): number {
        const { ctx } = this;
        const itemW = 30;
        const h = 42;
        const [, , fW] = this.rect;

        ctx.beginPath();
        ctx.rect(-fW / 2, 0, fW, h);
        ctx.clip();

        for (let i = 0, x = -9 * itemW; i < 18; i++, x += itemW) {
            ctx.fillStyle = i % 2 === 0 ? "#bfbfbf" : "#000";
            ctx.fillRect(x, 0, itemW, h);
        }

        ctx.closePath();

        return h;
    }

    private renderColoBar75Row(): number {
        const { ctx } = this;
        const h = 84;
        const itemW = 84;
        const colors = [
            "#bfbf00",
            "#00bfbf",
            "#00bf00",
            "#bf00bf",
            "#bf0000",
            "#0000bf"
        ];
        for (const [i, color] of colors.entries()) {
            const x = (i - 3) * itemW;
            ctx.fillStyle = color;
            ctx.fillRect(x, 0, itemW, h);
        }
        return h;
    }

    private renderCrossedLines(): number {
        const { ctx } = this;
        const [, , fW] = this.rect;
        const h = 42;
        const itemW = 42;

        // Black background
        ctx.fillStyle = "#000";
        ctx.fillRect(-fW / 2, 0, fW, h);

        // Horizontal line
        ctx.fillStyle = "#fff";
        ctx.fillRect(-fW / 2, h / 2 - 1, fW, 2);

        for (let x = -itemW * 6.5 - 2; x < itemW * 6.5; x += itemW) {
            // Line
            ctx.fillRect(x, 0, 4, h);

            // Darkened edges:
            ctx.save();
            ctx.fillStyle = this.edgeColor.darken;
            ctx.fillRect(x, 0, 1, h);
            ctx.fillRect(x + 3, 0, 1, h);
            ctx.restore();
        }

        return h;
    }

    private renderDefinitionLinesRow(): number {
        const { ctx } = this;
        const h = 84;
        const itemW = 84;
        const [, , fW] = this.rect;

        ctx.beginPath();
        ctx.rect(-fW / 2, 0, fW, h);
        ctx.clip();

        let x = -3.5 * itemW;
        const pixelFactor = 12;
        const squares = ["#000", 0.8, 1.8, 2.8, 3.8, 4.8, "#000"];
        for (const fillInfo of squares) {
            ctx.fillStyle =
                typeof fillInfo === "string"
                    ? fillInfo
                    : this.createGradientPattern(pixelFactor / fillInfo);

            ctx.translate(x, 0);
            ctx.fillRect(0, 0, itemW, h);
            ctx.translate(-x, 0);
            x += itemW;
        }

        ctx.closePath();

        return h;
    }

    private renderGrayScaleStairCaseRow(): number {
        const { ctx } = this;
        const h = 42;
        const itemW = 84;

        let x = -3 * itemW;
        for (let i = 0; i < 6; i++) {
            const lightness = 51 * i;
            const hex = Math.round(lightness).toString(16).padStart(2, "0");
            ctx.fillStyle = `#${hex}${hex}${hex}`;
            ctx.fillRect(x, 0, itemW, h);
            x += itemW;
        }
        return h;
    }

    private renderColorStep75Row(): number {
        const { ctx } = this;
        const h = 65;
        const itemW = 40;
        const [, , fW] = this.rect;

        ctx.fillStyle = "#bfbf00";
        ctx.fillRect(-fW / 2, 0, fW, h);

        ctx.fillStyle = "rgb(185 25 18)";
        ctx.fillRect(-itemW / 2, 0, itemW, h);

        ctx.fillStyle = "rgb(255 255 255 / 0.333)";
        ctx.fillRect(-itemW / 2, 0, 1, h);
        ctx.fillRect(itemW / 2 - 1, 0, 1, h);

        return h;
    }

    private renderCrossHair(): number {
        const { ctx } = this;
        const h = 42 * 3;
        const itemW = 38;

        // Black background
        ctx.fillStyle = "#000";
        ctx.fillRect(-itemW / 2, 0, itemW, h);
        // Darkened edges
        ctx.save();
        ctx.fillStyle = this.edgeColor.darken;
        ctx.fillRect(-itemW / 2 - 1, 0, 1, 42);
        ctx.fillRect(itemW / 2, 0, 1, 42);
        ctx.fillRect(-itemW / 2 - 1, 42 * 2, 1, 42);
        ctx.fillRect(itemW / 2, 42 * 2, 1, 42);
        ctx.restore();

        ctx.fillStyle = "#fff";

        // Horizontal line
        ctx.fillRect(-itemW / 2, h / 2 - 1, itemW, 2);

        // Vertical line
        ctx.fillRect(-2, 0, 4, h);

        // Darkened edges:
        ctx.save();
        ctx.fillStyle = this.edgeColor.darken;
        ctx.fillRect(-2, 0, 1, h);
        ctx.fillRect(1, 0, 1, h);
        ctx.restore();

        return h;
    }

    private renderCompleteForground(y: number, cX: number): void {
        const trans = this.translate.bind(this);

        // Row 1
        y += trans(cX, y, () => this.renderTopRow());

        // Row 2
        y += trans(cX, y, () => this.renderHeaderRow());

        // Row 3
        y += trans(cX, y, () => this.renderReflectionCheckRow(false));

        // Row 4
        y += trans(cX, y, () => this.renderSquareWave75Row());

        // Row 5
        y += trans(cX, y, () => this.renderColoBar75Row());

        // Row 6
        y += trans(cX, y, () => this.renderCrossedLines());

        // Row 7
        y += trans(cX, y, () => this.renderDefinitionLinesRow());

        // Row 8
        y += trans(cX, y, () => this.renderGrayScaleStairCaseRow());

        // Row 9
        y += trans(cX, y, () => this.renderReflectionCheckRow(true));

        // Row 10
        trans(cX, y, () => this.renderColorStep75Row());

        // Move y to top of crosshair
        y = pal[1] / 2 - 63;
        // Render crosshair
        trans(cX, y, () => this.renderCrossHair());
    }

    render(): void {
        const [palW, palH] = pal;
        const [centerX, centerY] = [palW / 2, palH / 2];
        const radius = 84 * 3;

        // Circle clip
        const { ctx } = this;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();

        const foreGroundYOffset = (palH - radius * 2) / 2;
        this.renderCompleteForground(foreGroundYOffset, centerX);
        ctx.closePath();
    }
}
