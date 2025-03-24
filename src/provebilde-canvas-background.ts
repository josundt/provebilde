import type { Coord, EdgeColor, Size } from "./abstractions.ts";
import { pal } from "./constants.ts";
import { createOffscreenCanvasContext } from "./utils.ts";

export class ProveBildeCanvasBackground {
    constructor(ctx: CanvasRenderingContext2D, edgeColor: EdgeColor) {
        this.#edgeColor = edgeColor;
        this.#ctx = ctx;
        [this.#leftGridStripesPattern, this.#rightGridStripesPattern] =
            this.#createGridStripePatterns(
                ["#b85a7a", "#3c9a7a"],
                ["#7a64e9", "#7a900b"]
            );
    }

    readonly #ctx: CanvasRenderingContext2D;
    readonly #edgeColor: EdgeColor;

    readonly #leftGridStripesPattern: CanvasPattern;
    readonly #rightGridStripesPattern: CanvasPattern;

    readonly #gridSquareSize: number = 42;
    readonly #defaultGray: string = "#7a7a7a";
    readonly #gridOffset: Coord = [-15, -27];

    get #gridSquareColCount(): number {
        const [w] = pal;
        const [offsetX] = this.#gridOffset;
        const size = this.#gridSquareSize;
        return Math.ceil((w - offsetX) / size);
    }

    get #gridSquareRowCount(): number {
        const [, h] = pal;
        const [, offsetY] = this.#gridOffset;
        const size = this.#gridSquareSize;
        return Math.ceil((h - offsetY) / size);
    }

    #drawGridSquare(fillStyle: string | CanvasPattern): void {
        const size = this.#gridSquareSize;
        const ctx = this.#ctx;
        ctx.save();

        // Draw white outline
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, size, size);

        // Draw fill
        ctx.fillStyle = fillStyle;
        ctx.fillRect(1, 1, size - 2, size - 2);

        // Draw side "blur" borders
        ctx.fillStyle = this.#edgeColor.lighten;
        ctx.fillRect(1, 1, 1, size - 2);
        ctx.fillRect(size - 2, 1, 1, size);

        ctx.restore();
    }

    #getGridSquareFill(...offset: Coord): string | CanvasPattern {
        const [cols, rows] = [
            this.#gridSquareColCount,
            this.#gridSquareRowCount
        ];
        const [x, y] = offset;
        const [gridOffsetX, gridOffsetY] = this.#gridOffset;
        const horSquareIndex = (x - gridOffsetX) / this.#gridSquareSize;
        const verSquareIndex = (y - gridOffsetY) / this.#gridSquareSize;
        const isOutsideHorBounds =
            horSquareIndex === 0 || horSquareIndex >= cols - 1;
        const isOutsideVerBounds =
            verSquareIndex === 0 || verSquareIndex >= rows - 1;
        const isSecondLeftMostSquare = horSquareIndex === 1;
        const isSecondRightMostSquare = horSquareIndex === cols - 2;
        const isSecondTopMostSquare = verSquareIndex === 1;
        const isSecondBottomMostSquare = verSquareIndex === rows - 2;

        let result: string | CanvasPattern;
        if (isOutsideHorBounds || isOutsideVerBounds) {
            const isEven = (horSquareIndex + verSquareIndex) % 2 === 0;
            result = isEven ? "#fff" : "#000";
        } else if (isSecondLeftMostSquare) {
            if (isSecondTopMostSquare) {
                result = this.#makeHalfGridStripePattern(
                    this.#leftGridStripesPattern,
                    "top"
                );
            } else if (isSecondBottomMostSquare) {
                result = this.#makeHalfGridStripePattern(
                    this.#leftGridStripesPattern,
                    "bottom"
                );
            } else {
                result = this.#leftGridStripesPattern;
            }
        } else if (isSecondRightMostSquare) {
            if (isSecondTopMostSquare) {
                result = this.#makeHalfGridStripePattern(
                    this.#rightGridStripesPattern,
                    "top"
                );
            } else if (isSecondBottomMostSquare) {
                result = this.#makeHalfGridStripePattern(
                    this.#rightGridStripesPattern,
                    "bottom"
                );
            } else {
                result = this.#rightGridStripesPattern;
            }
        } else {
            result = this.#defaultGray;
        }
        return result;
    }

    #createGridStripePatterns(
        ...palettes: Array<[color1: string, color2: string]>
    ): CanvasPattern[] {
        const ctx = createOffscreenCanvasContext(1, 4);
        return palettes.map(([color1, color2]) => {
            ctx.fillStyle = color1;
            ctx.fillRect(0, 0, 1, 2);
            ctx.fillStyle = color2;
            ctx.fillRect(0, 2, 1, 2);
            return ctx.createPattern(ctx.canvas, "repeat")!;
        });
    }

    #makeHalfGridStripePattern(
        stripePattern: CanvasPattern,
        noStripesAt: "top" | "bottom"
    ): CanvasPattern {
        const ctx = createOffscreenCanvasContext(
            this.#gridSquareSize,
            this.#gridSquareSize
        );
        ctx.fillStyle = stripePattern;
        ctx.fillRect(0, 0, this.#gridSquareSize, this.#gridSquareSize);
        ctx.fillStyle = this.#defaultGray;
        if (noStripesAt === "top") {
            ctx.fillRect(0, 0, this.#gridSquareSize, this.#gridSquareSize / 2);
        } else {
            ctx.fillRect(
                0,
                this.#gridSquareSize / 2,
                this.#gridSquareSize,
                this.#gridSquareSize / 2
            );
        }
        ctx.fill();
        return ctx.createPattern(ctx.canvas, "repeat")!;
    }

    #drawGrid(): void {
        const ctx = this.#ctx;
        ctx.save();

        // Render white background
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, ...pal);

        // Render grid squares
        const [palW, palH] = pal;
        const [gridOffsetX, gridOffsetY] = this.#gridOffset;
        for (
            let transY = gridOffsetY;
            transY < palH;
            transY += this.#gridSquareSize
        ) {
            for (
                let transX = gridOffsetX;
                transX < palW;
                transX += this.#gridSquareSize
            ) {
                ctx.save();
                ctx.translate(transX, transY);
                this.#drawGridSquare(this.#getGridSquareFill(transX, transY));
                ctx.restore();
            }
        }
        ctx.restore();
    }

    #drawColorBar(color1: string, color2: string): Size {
        const ctx = this.#ctx;
        ctx.save();

        const squareSize = this.#gridSquareSize;
        const border = 2;

        const w1 = squareSize - border / 2;
        const w = squareSize * 2 - border;
        const h1 = squareSize * 3.5 + border;
        const h2 = squareSize * 2 - border;
        const h = h1 + h2;

        // Color 1 rects
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, w1 + 1, squareSize * 2 - border);
        ctx.fillRect(0, w - 1, squareSize - border, h1 + 1);

        // Color 2 rect
        ctx.fillStyle = color2;
        ctx.fillRect(w1, 0, squareSize - border / 2, h2);

        // Draw side "blur" borders
        ctx.fillStyle = this.#edgeColor.lighten;
        ctx.fillRect(0, 0, border, h1 + h2);
        ctx.fillRect(w - border, 0, 4, h1 + h2);
        ctx.fillRect(w1 - border, h2, 4, h1);
        ctx.restore();

        return [w, h];
    }

    #drawColorBars(): void {
        const ctx = this.#ctx;
        const squareSize = this.#gridSquareSize;
        const [gridOffsetX, gridOffsetY] = this.#gridOffset;
        const border = 2;

        let x = gridOffsetX + squareSize * 2 + border / 2;
        const y = gridOffsetY + squareSize * 2 + border / 2;

        // Top left
        ctx.save();
        ctx.translate(x, y);
        const [, h] = this.#drawColorBar("#3c9a7a", "#577ad6");

        // Bottom left
        ctx.translate(0, h * 2 - border);
        ctx.scale(1, -1);
        this.#drawColorBar("#b85a7a", "#9d7a1e");
        ctx.restore();

        x += squareSize * 14 - border;

        // Top right
        ctx.save();
        ctx.translate(x + squareSize, y);
        ctx.scale(-1, 1);
        this.#drawColorBar("#577ad6", "#7a900b");

        // Bottom right
        ctx.translate(0, h * 2 - border);
        ctx.scale(1, -1);
        this.#drawColorBar("#9d7a1e", "#7a64e9");
        ctx.restore();

        ctx.restore();
    }

    render(): void {
        this.#drawGrid();
        this.#drawColorBars();
    }
}
