import type { UniformValue, WebGLConstant } from "./abstractions.ts";
import type { IFilter } from "./filters/abstractions.ts";
import { FilterBase } from "./filters/filter-base.ts";
import type { ILogger } from "./logger.ts";
import { baseVertexShaderFlipped } from "./shaders/vertex/base-flipped.ts";
import { WebGLUtil } from "./webgl-util.ts";

////////////////////////////////////////////////////////////////////////////////////////////
// Reference: https://medium.com/eureka-engineering/image-processing-with-webgl-c2af552e8df0
////////////////////////////////////////////////////////////////////////////////////////////

type TypeLocationInfo = [type: number, location: WebGLUniformLocation];

export class WebGLRenderer {
    constructor(
        canvas: HTMLCanvasElement = document.createElement("canvas"),
        ...filters: IFilter[]
    ) {
        const gl = canvas.getContext("webgl");
        if (!gl) {
            throw new Error("WebGL not supported");
        }

        // Ensure we use base fragment shader if no filters are provided
        if (!filters.length) {
            filters.push(new FilterBase());
        }

        this.#gl = gl;
        this.#logger = console;
        this.#filters = filters;
    }

    readonly #gl: WebGLRenderingContext;
    readonly #filters: IFilter[];
    readonly #logger: ILogger;

    #currentProgram: WebGLProgram | null = null;
    readonly #vertices: Float32Array = new Float32Array([
        -1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1
    ]);
    #vertexShader: WebGLShader | null = null;

    #programUniformLocations: Map<string, TypeLocationInfo> = new Map();

    #useProgram(program: WebGLProgram): WebGLProgram {
        const gl = this.#gl;
        gl.useProgram(program);
        this.#currentProgram = program;
        this.#programUniformLocations = WebGLRenderer.#getUniforms(gl, program);
        return this.#currentProgram;
    }

    static #getUniforms(
        gl: WebGLRenderingContext,
        program: WebGLProgram
    ): Map<string, TypeLocationInfo> {
        const result = new Map<string, TypeLocationInfo>();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

        for (let i = 0; i < numUniforms; i++) {
            const info = gl.getActiveUniform(program, i);
            if (info === null) {
                throw new Error(`Couldn't get uniform at index: ${i}.`);
            }
            const location = gl.getUniformLocation(program, info.name);
            if (location) {
                result.set(info.name, [info.type, location]);
            }
        }

        return result;
    }

    // eslint-disable-next-line complexity
    #setUniform(name: string, value: UniformValue): void {
        const gl = this.#gl;
        const [type, location] =
            this.#programUniformLocations.get(name) ??
            ([undefined, undefined] as const);

        const getTypeAndLengthDesc = (t: string, length?: number): string =>
            `${t}${length ? `[${length}]` : ""}`;

        const logWrongType = (
            nm: string,
            glEnumName: WebGLConstant,
            expectedType: string,
            actualType: string,
            expectedLength?: number,
            actualLength?: number
        ): void =>
            this.#logger.warn(
                `Wrong type for uniform '${nm}' (${glEnumName})  Expected: ${getTypeAndLengthDesc(expectedType, expectedLength)}, Actual: ${getTypeAndLengthDesc(actualType, actualLength)}`
            );

        const tryEnsureTypedArray = <T extends Float32Array | Int32Array>(
            arr: UniformValue,
            convert: (a: number[]) => T
        ): T | UniformValue => {
            if (arr instanceof Float32Array || arr instanceof Int32Array) {
                return arr;
            }
            return Array.isArray(arr) ? convert(arr) : arr;
        };

        switch (type) {
            case undefined: {
                this.#logger.warn(`Unknown uniform name: ${name}`);
                break;
            }
            case gl.FLOAT: {
                if (typeof value !== "number") {
                    logWrongType(name, "FLOAT", "number", typeof value);
                    break;
                }
                gl.uniform1fv(location, [value]);
                break;
            }
            case gl.FLOAT_VEC2: {
                const nValue = tryEnsureTypedArray(
                    value,
                    a => new Float32Array(a)
                );
                if (!(nValue instanceof Float32Array) || nValue.length !== 2) {
                    logWrongType(
                        name,
                        "FLOAT_VEC2",
                        "Float32Array",
                        typeof nValue,
                        2,
                        typeof nValue === "object" && "length" in nValue
                            ? nValue.length
                            : undefined
                    );
                    break;
                }
                gl.uniform2fv(location, nValue);
                break;
            }
            case gl.FLOAT_VEC3: {
                const nValue = tryEnsureTypedArray(
                    value,
                    a => new Float32Array(a)
                );
                if (!(nValue instanceof Float32Array) || nValue.length !== 3) {
                    logWrongType(
                        name,
                        "FLOAT_VEC3",
                        "Float32Array",
                        typeof nValue,
                        3,
                        typeof nValue === "object" && "length" in nValue
                            ? nValue.length
                            : undefined
                    );
                    break;
                }
                gl.uniform3fv(location, nValue);
                break;
            }
            case gl.FLOAT_VEC4: {
                const nValue = tryEnsureTypedArray(
                    value,
                    a => new Float32Array(a)
                );
                if (!(nValue instanceof Float32Array) || nValue.length !== 4) {
                    logWrongType(
                        name,
                        "FLOAT_VEC4",
                        "Float32Array",
                        typeof nValue,
                        4,
                        typeof nValue === "object" && "length" in nValue
                            ? nValue.length
                            : undefined
                    );
                    break;
                }
                gl.uniform4fv(location, nValue);
                break;
            }
            case gl.BOOL:
            case gl.INT: {
                if (typeof value !== "number") {
                    logWrongType(
                        name,
                        type === gl.BOOL ? "BOOL" : "INT",
                        "number",
                        typeof value
                    );
                    break;
                }
                gl.uniform1iv(location, [value]);
                break;
            }
            case gl.BOOL_VEC2:
            case gl.INT_VEC2: {
                const nValue = tryEnsureTypedArray(
                    value,
                    a => new Int32Array(a)
                );
                if (!(nValue instanceof Int32Array) || nValue.length !== 2) {
                    logWrongType(
                        name,
                        type === gl.BOOL_VEC2 ? "BOOL_VEC2" : "INT_VEC2",
                        "Int32Array",
                        typeof nValue,
                        2,
                        typeof nValue === "object" && "length" in nValue
                            ? nValue.length
                            : undefined
                    );
                    break;
                }
                gl.uniform2iv(location, nValue);
                break;
            }
            case gl.BOOL_VEC3:
            case gl.INT_VEC3: {
                const nValue = tryEnsureTypedArray(
                    value,
                    a => new Int32Array(a)
                );
                if (!(nValue instanceof Int32Array) || nValue.length !== 3) {
                    logWrongType(
                        name,
                        type === gl.BOOL_VEC3 ? "BOOL_VEC3" : "INT_VEC3",
                        "Int32Array",
                        typeof nValue,
                        3,
                        typeof nValue === "object" && "length" in nValue
                            ? nValue.length
                            : undefined
                    );
                    break;
                }
                gl.uniform3iv(location, nValue);
                break;
            }
            case gl.BOOL_VEC4:
            case gl.INT_VEC4: {
                const nValue = tryEnsureTypedArray(
                    value,
                    a => new Int32Array(a)
                );
                if (!(nValue instanceof Int32Array) || nValue.length !== 4) {
                    logWrongType(
                        name,
                        type === gl.BOOL_VEC4 ? "BOOL_VEC4" : "INT_VEC4",
                        "Int32Array",
                        typeof nValue,
                        4,
                        typeof nValue === "object" && "length" in nValue
                            ? nValue.length
                            : undefined
                    );
                    break;
                }
                gl.uniform4iv(location, nValue);
                break;
            }
            default: {
                this.#logger.warn(`Unknown uniform type: ${type}`);
            }
        }
    }

    #getVertexShader(): WebGLShader {
        if (this.#vertexShader) {
            return this.#vertexShader;
        }

        const vertexShader = WebGLUtil.compileVertexShader(
            this.#gl,
            baseVertexShaderFlipped
        );

        return (this.#vertexShader = vertexShader);
    }

    renderImage(
        image: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas
    ): void {
        const gl = this.#gl;

        const [w, h] = [gl.drawingBufferWidth, gl.drawingBufferHeight];

        // Set the viewport to cover the canvas
        gl.viewport(0, 0, w, h);

        const vertexShader = this.#getVertexShader();

        for (const filter of this.#filters) {
            // Enable the program
            const program = this.#useProgram(
                filter.getProgram(gl, vertexShader)
            );

            // Bind the active array buffer and set position attribute
            WebGLUtil.setBufferAndSetPositionAttribute(
                gl,
                program,
                this.#vertices
            );

            // Create a texture
            WebGLUtil.setImageTexture(gl, image);

            // Load uniforms (parameters) for the fragment shaders
            for (const [name, value] of Object.entries(filter.params ?? {})) {
                this.#setUniform(name, value);
            }

            // Draw our 6 VERTICES as 2 triangles
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            image = this.#gl.canvas;
        }
    }
}
