declare const fx: any;

export function useWebGlCrtFilterOld(source: HTMLCanvasElement): void {
    const init = (): void => {
        let glcanvas: any;

        // Try to create a WebGL canvas (will fail if WebGL isn't supported)
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            glcanvas = fx.canvas();
        } catch {
            return;
        }

        // const srcctx = source.getContext("2d")!;

        const w = source.width;
        // const h = source.height;
        const hw = w / 2;
        const hh = source.height / 2;

        source.parentNode!.insertBefore(glcanvas, source);
        source.style.display = "none";
        // glcanvas.className = "game";

        const go = (): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const texture = glcanvas.texture(source);

            /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
            glcanvas
                .draw(texture)
                .bulgePinch(hw, hh, w * 0.75, 0.07) // orig w * 0.75, 0.12
                .vignette(0.25, 0.58) // orig 0.25, 0.74
                .update();
            /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
        };
        setInterval(go, 500);
    };

    const script = document.createElement("script");
    document.head.appendChild(script);
    script.onload = init;
    script.src = "https://unpkg.com/glfx-es6/dist/glfx-es6.js"; // or .min.js
}
