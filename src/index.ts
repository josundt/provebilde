import { initPlugin, type ProveBildePluginOptions } from "./plugin.ts";
import { useWebGlCrtFilter } from "./webgl-crt-filter.ts";

const options: ProveBildePluginOptions = {
    container: document.body,
    headerText: "jasMIN",
    footerText: "Retro TV",
    showDate: true,
    showTime: true,

    // date: new Date(1985, 4, 12, 1, 23, 35),

    blurredEdgesDisabled: false,
    imageSmootingDisabled: false
};

document.addEventListener("DOMContentLoaded", () => {
    const canvas = initPlugin(options);
    useWebGlCrtFilter(canvas);
});
