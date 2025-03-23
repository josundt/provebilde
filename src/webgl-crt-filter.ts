import { WebGLRenderer } from "./webgl/webgl-renderer.ts";

export function useWebGlCrtFilter(source: HTMLCanvasElement): void {
    const glcanvas = document.createElement("canvas");
    glcanvas.width = source.width;
    glcanvas.height = source.height;
    source.parentNode!.insertBefore(glcanvas, source);
    source.style.display = "none";
    const glUtil = new WebGLRenderer(glcanvas);

    const go = (): void => {
        glUtil.renderImage(source);
        requestAnimationFrame(go);
    };
    setInterval(go, 500);
}
