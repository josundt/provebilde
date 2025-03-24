import type { UniformValue } from "../abstractions.ts";

export interface IFilter<
    TUniforms extends Record<string, UniformValue> = Record<
        string,
        UniformValue
    >
> {
    readonly fragmentShaderSource: string;
    readonly params?: Readonly<TUniforms>;
    getProgram(
        gl: WebGLRenderingContext,
        vertexShader: WebGLShader
    ): WebGLProgram;
}
