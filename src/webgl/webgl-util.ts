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

    /**
      Bind the active array buffer.
     * @param gl The WebGLRenderingContext
     * @param program The WebGLProgram
     * @param vertices The array to bind
     */
    static setBufferAndSetPositionAttribute(
        gl: WebGLRenderingContext,
        program: WebGLProgram,
        vertices: Float32Array
    ): void {
        // Bind the active array buffer.
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Set and enable our array buffer as the program's "position" variable
        const positionLocation = gl.getAttribLocation(program!, "position");
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLocation);
    }

    static setImageTexture(
        gl: WebGLRenderingContext,
        image:
            | ImageData
            | HTMLImageElement
            | HTMLCanvasElement
            | OffscreenCanvas
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

    static compileVertexShader(
        gl: WebGLRenderingContext,
        shaderSource: string
    ): WebGLShader {
        return this.#compileShader(gl, shaderSource, gl.VERTEX_SHADER);
    }

    static compileFragmentShader(
        gl: WebGLRenderingContext,
        shaderSource: string
    ): WebGLShader {
        return this.#compileShader(gl, shaderSource, gl.FRAGMENT_SHADER);
    }

    static compileFragmentShaders(
        gl: WebGLRenderingContext,
        ...shaderSources: string[]
    ): WebGLShader[] {
        return shaderSources.map(source =>
            this.compileFragmentShader(gl, source)
        );
    }

    static clamp(minValue: number, value: number, maxValue: number): number {
        return Math.min(Math.max(value, minValue), maxValue);
    }
}
