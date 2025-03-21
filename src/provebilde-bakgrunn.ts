import type { Coord, EdgeColor } from "./abstractions.ts";
import { pal } from "./constants.ts";
import { createOffscreenCanvasContext } from "./utils.ts";

export class ProveBildeBakgrunn {
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

    readonly #gridSquareSize: number = 42;
    readonly #leftGridStripesPattern: CanvasPattern;
    readonly #rightGridStripesPattern: CanvasPattern;
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

    #drawLeftColorBar(): void {
        const ctx = this.#ctx;
        ctx.save();
        const colors: [string, string, string, string] = [
            "#3c9a7a",
            "#577ad6",
            "#b85a7a",
            "#9d7a1e"
        ];
        const squareSize = this.#gridSquareSize;
        const [gridOffsetX, gridOffsetY] = this.#gridOffset;
        const border = 2;

        // Left 1/4:
        [ctx.fillStyle] = colors;
        ctx.fillRect(
            gridOffsetX + squareSize * 2 + border / 2,
            gridOffsetY + squareSize * 2 + border / 2,
            squareSize - border / 2,
            squareSize * 2 - border
        );
        ctx.fillRect(
            gridOffsetX + squareSize * 2 + border / 2,
            gridOffsetY + squareSize * 4 - border / 2,
            squareSize - border,
            squareSize * 3.5 + border
        );

        // Left 2/4
        [, ctx.fillStyle] = colors;
        ctx.fillRect(
            gridOffsetX + squareSize * 3,
            gridOffsetY + squareSize * 2 + border / 2,
            squareSize - border / 2,
            squareSize * 2 - border
        );

        // Left 3/4
        [, , ctx.fillStyle] = colors;
        ctx.fillRect(
            gridOffsetX + squareSize * 2 + border / 2,
            gridOffsetY + squareSize * 7.5 - border / 2,
            squareSize - border,
            squareSize * 3.5 + border
        );
        ctx.fillRect(
            gridOffsetX + squareSize * 2 + border / 2,
            gridOffsetY + squareSize * 11 + border / 2,
            squareSize - border / 2,
            squareSize * 2 - border
        );

        // Left 4/4
        [, , , ctx.fillStyle] = colors;
        ctx.fillRect(
            gridOffsetX + squareSize * 3,
            gridOffsetY + squareSize * 11 + border / 2,
            squareSize - border / 2,
            squareSize * 2 - border
        );

        // Draw side "blur" borders
        ctx.fillStyle = this.#edgeColor.lighten;

        ctx.fillRect(
            gridOffsetX + squareSize * 2 + border / 2,
            gridOffsetY + squareSize * 2 + border / 2,
            1,
            squareSize * 11 - border
        );
        ctx.fillRect(
            gridOffsetX + squareSize * 4 - border,
            gridOffsetY + squareSize * 2 + border / 2,
            1,
            squareSize * 2 - border
        );
        ctx.fillRect(
            gridOffsetX + squareSize * 3 - border,
            gridOffsetY + squareSize * 4 - border / 2,
            1,
            squareSize * 7 + border
        );
        ctx.fillRect(
            gridOffsetX + squareSize * 4 - border,
            gridOffsetY + squareSize * 11 + border / 2,
            1,
            squareSize * 2 - border
        );
        ctx.restore();
    }

    #drawRightColorBar(): void {
        const ctx = this.#ctx;
        ctx.save();
        const colors: [string, string, string, string] = [
            "#577ad6",
            "#7a900b",
            "#9d7a1e",
            "#7a64e9"
        ];
        const squareSize = this.#gridSquareSize;
        const [gridOffsetX, gridOffsetY] = this.#gridOffset;
        const border = 2;

        // Right 1/4
        [ctx.fillStyle] = colors;
        ctx.fillRect(
            gridOffsetX + squareSize * 15 + border / 2,
            gridOffsetY + squareSize * 2 + border / 2,
            squareSize - border / 2,
            squareSize * 2 - border
        );

        // Right 2/4:
        [, ctx.fillStyle] = colors;
        ctx.fillRect(
            gridOffsetX + squareSize * 16,
            gridOffsetY + squareSize * 2 + border / 2,
            squareSize - border / 2,
            squareSize * 2 - border
        );
        ctx.fillRect(
            gridOffsetX + squareSize * 16 + border / 2,
            gridOffsetY + squareSize * 4 - border / 2,
            squareSize - border,
            squareSize * 3.5 + border
        );

        // Right 3/4
        [, , ctx.fillStyle] = colors;
        ctx.fillRect(
            gridOffsetX + squareSize * 15 + border / 2,
            gridOffsetY + squareSize * 11 + border / 2,
            squareSize - border / 2,
            squareSize * 2 - border
        );

        // Right 4/4
        [, , , ctx.fillStyle] = colors;
        ctx.fillRect(
            gridOffsetX + squareSize * 16 + border / 2,
            gridOffsetY + squareSize * 7.5 - border / 2,
            squareSize - border,
            squareSize * 3.5 + border
        );
        ctx.fillRect(
            gridOffsetX + squareSize * 16,
            gridOffsetY + squareSize * 11 + border / 2,
            squareSize - border / 2,
            squareSize * 2 - border
        );

        // Draw side "blur" borders
        ctx.fillStyle = this.#edgeColor.lighten;

        ctx.fillRect(
            gridOffsetX + squareSize * 15 + border / 2,
            gridOffsetY + squareSize * 2 + border / 2,
            1,
            squareSize * 2 - border
        );
        ctx.fillRect(
            gridOffsetX + squareSize * 17 - border,
            gridOffsetY + squareSize * 2 + border / 2,
            1,
            squareSize * 11 - border
        );
        ctx.fillRect(
            gridOffsetX + squareSize * 16 + border / 2,
            gridOffsetY + squareSize * 4 - border / 2,
            1,
            squareSize * 7 + border
        );
        ctx.fillRect(
            gridOffsetX + squareSize * 15 + border / 2,
            gridOffsetY + squareSize * 11 + border / 2,
            1,
            squareSize * 2 - border
        );
        ctx.restore();
    }

    render(): void {
        this.#drawGrid();
        this.#drawLeftColorBar();
        this.#drawRightColorBar();
    }
}
