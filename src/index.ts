import { initPlugin, type ProveBildePluginOptions } from "./plugin.ts";

const options: ProveBildePluginOptions = {
    container: document.body,
    headerText: "jasMIN",
    footerText: "Retro TV",
    showDate: true,
    showTime: true,

    // date: new Date(1985, 4, 12, 1, 23, 35),

    blurredEdgesDisabled: false,
    imageSmootingDisabled: false,
    fx: {
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
    }
};

document.addEventListener("DOMContentLoaded", () => {
    initPlugin(options);
});
