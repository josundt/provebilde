import type { IFilter } from "./webgl/filters/abstractions.ts";
import {
    BrightnessSaturationContrastFilter,
    type BrightnessSaturationContrastFilterParams
} from "./webgl/filters/brightness-saturation-contrast.ts";
import {
    BulgePinchFilter,
    type BulgePinchFilterParams
} from "./webgl/filters/bulge-pinch.ts";
import {
    VignetteFilter,
    type VignetteFilterParams
} from "./webgl/filters/vignette.ts";
import { WebGLRenderer } from "./webgl/webgl-renderer.ts";

export interface ProvebildeFxOptions {
    brightnessSaturationContrast?: BrightnessSaturationContrastFilterParams;
    bulgePinch?: { strength: number };
    vignette?: VignetteFilterParams;
}

export class ProveBildeFx {
    constructor(ctx: CanvasRenderingContext2D, options?: ProvebildeFxOptions) {
        this.#ctx = ctx;
        this.#options = options;
    }

    readonly #ctx: CanvasRenderingContext2D;
    readonly #options?: Readonly<ProvebildeFxOptions> | undefined;
    #renderer?: WebGLRenderer;

    static getDefaultFx(): ProvebildeFxOptions {
        return {
            brightnessSaturationContrast: {
                brightness: 0,
                saturation: -0.7,
                contrast: 0.3
            },
            bulgePinch: {
                strength: 0.07
            },
            vignette: {
                size: 0.25,
                amount: 0.58
            }
        };
    }

    renderInitial(): void {
        const className = "provebilde-fx";
        const source = this.#ctx.canvas;
        let glCanvas = source.parentElement?.querySelector(
            `.${className}`
        ) as HTMLCanvasElement | null;
        if (glCanvas) {
            glCanvas.remove();
        }

        source.style.display = "none";
        glCanvas = document.createElement("canvas");
        glCanvas.className = className;
        glCanvas.width = source.width;
        glCanvas.height = source.height;
        source.parentNode!.insertBefore(glCanvas, source);

        const o = this.#options;
        const filters: IFilter[] = [];
        if (o?.brightnessSaturationContrast) {
            filters.push(
                new BrightnessSaturationContrastFilter(
                    o.brightnessSaturationContrast
                )
            );
        }
        if (o?.bulgePinch) {
            const filterParams = o.bulgePinch as BulgePinchFilterParams;
            filterParams.texSize = [source.width, source.height];
            filterParams.center = [source.width / 2, source.height / 2];
            filterParams.radius = source.width * 0.75;
            filters.push(new BulgePinchFilter(filterParams));
        }
        if (o?.vignette) {
            filters.push(new VignetteFilter(o.vignette));
        }

        if (filters.length) {
            this.#renderer = new WebGLRenderer(glCanvas, ...filters);
        }
    }

    renderFrame(): void {
        this.#renderer?.renderImage(this.#ctx.canvas);
    }
}
