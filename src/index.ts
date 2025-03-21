import { initPlugin, type ProveBildePluginOptions } from "./plugin.ts";

const options: ProveBildePluginOptions = {
    containerSelector: "body",
    headerText: "jasMIN",
    footerText: "Retro TV",
    showDate: true,
    showTime: true,

    blurredEdgesDisabled: false,
    imageSmootingDisabled: false
};

document.addEventListener("DOMContentLoaded", () => initPlugin(options));
