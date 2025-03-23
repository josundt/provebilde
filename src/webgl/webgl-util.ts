export class WebGLUtil {
    static createProgram(
        gl: WebGLRenderingContext,
        ...shaders: WebGLShader[]
    ): WebGLProgram {
        const program = gl.createProgram();
        for (const shader of shaders) {
            gl.attachShader(program, shader);
        }
        gl.linkProgram(program);
        return program;
    }

    static setImageTexture(
        gl: WebGLRenderingContext,
        image: ImageData | HTMLImageElement | HTMLCanvasElement
    ): void {
        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    static #compileShader(
        gl: WebGLRenderingContext,
        shaderSource: string,
        type:
            | WebGLRenderingContext["VERTEX_SHADER"]
            | WebGL2RenderingContext["FRAGMENT_SHADER"]
    ): WebGLShader {
        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const log =
                gl
                    .getShaderInfoLog(shader)
                    // eslint-disable-next-line no-control-regex
                    ?.replace(/[\u0000]/u, "") ?? ""?.trim();
            const logMessages = log.split(/\r?\n/u).filter(s => !!s);
            const lastMessage = !logMessages.length
                ? "no message"
                : logMessages[logMessages.length - 1];
            throw new Error(
                `Shader failed to compile: ${lastMessage ?? "no message"}`
            );
        }

        return shader;
    }

    static compileVertexShaders(
        gl: WebGLRenderingContext,
        ...shaderSources: string[]
    ): WebGLShader[] {
        return shaderSources.map(source =>
            this.#compileShader(gl, source, gl.VERTEX_SHADER)
        );
    }

    static compileFragmentShaders(
        gl: WebGLRenderingContext,
        ...shaderSources: string[]
    ): WebGLShader[] {
        return shaderSources.map(source =>
            this.#compileShader(gl, source, gl.FRAGMENT_SHADER)
        );
    }

    static clamp(minValue: number, value: number, maxValue: number): number {
        return Math.min(Math.max(value, minValue), maxValue);
    }
}
