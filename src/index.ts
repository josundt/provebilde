import {
    ProveBildePlugin,
    type ProveBildePluginOptions
} from "./provebilde-plugin.ts";

const options: ProveBildePluginOptions = {
    container: document.body,
    headerText: "JASMIN",
    footerText: "RETRO TV",
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
    },
    ocd: {
        param: "none",
        level: 0
    }
};

document.addEventListener("DOMContentLoaded", () => {
    ProveBildePlugin.create(options);
});
