import type { UniformValue } from "../abstractions.ts";
import { FilterBase } from "./filter-base.ts";

const vignetteFragmentShader: string = `
    precision highp float;
    varying vec2 texCoords;
    uniform sampler2D textureSampler;

    uniform float size;
    uniform float amount;

    vec3 vignette(vec3 color, float size, float amount) {
        float dist = distance(texCoords, vec2(0.5, 0.5));
        return color * smoothstep(0.8, size * 0.799, dist * (amount + size));
    }

    void main() {
        vec4 color = texture2D(textureSampler, texCoords);

        color.rgb = vignette(color.rgb, size, amount);

        gl_FragColor = color;
    }
`;

export interface VignetteFilterParams extends Record<string, UniformValue> {
    size: number;
    amount: number;
}

export class VignetteFilter extends FilterBase<VignetteFilterParams> {
    constructor(params: VignetteFilterParams) {
        super(vignetteFragmentShader, params);
    }
}
