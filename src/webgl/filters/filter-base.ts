import type { UniformValue } from "../abstractions.ts";
import { WebGLUtil } from "../webgl-util.ts";
import type { IFilter } from "./abstractions.ts";

export const baseFragmentShader = `
  precision highp float;

  varying vec2 texCoords;
  uniform sampler2D textureSampler;

  void main() {
    vec4 color = texture2D(textureSampler, texCoords);
    gl_FragColor = color;
  }
`;

export class FilterBase<
    TParams extends Record<string, UniformValue> = Record<string, UniformValue>
> implements IFilter<TParams>
{
    constructor(
        fragmentShaderSource: string = baseFragmentShader,
        params?: TParams
    ) {
        this.fragmentShaderSource = fragmentShaderSource;
        if (params) {
            this.params = params;
        }
    }

    readonly params?: Readonly<TParams>;
    readonly fragmentShaderSource: string;

    #program?: WebGLProgram;

    getProgram(
        gl: WebGLRenderingContext,
        vertexShader: WebGLShader
    ): WebGLProgram {
        if (this.#program) {
            return this.#program;
        }

        const fragmentShader = WebGLUtil.compileFragmentShader(
            gl,
            this.fragmentShaderSource
        );

        return (this.#program = WebGLUtil.createProgram(
            gl,
            vertexShader,
            fragmentShader
        ));
    }
}
