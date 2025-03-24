import type { UniformValue } from "../abstractions.ts";
import { FilterBase } from "./filter-base.ts";

const bulgePinchFragmentShader = `
    precision highp float;
    varying vec2 texCoords;
    uniform sampler2D textureSampler;

    uniform vec2  texSize;
    uniform float radius;
    uniform float strength;
    uniform vec2  center;

    void main() {
        vec2 coord = texCoords * texSize;
        coord -= center;
        float distance = length(coord);
        if (distance < radius) {
            float percent = distance / radius;
            if (strength > 0.0) {
                coord *= mix(1.0, smoothstep(0.0, radius / distance, percent), strength * 0.75);
            } else {
                coord *= mix(1.0, pow(percent, 1.0 + strength * 0.75) * radius / distance, 1.0 - percent);
            }
        }
        coord += center;
        gl_FragColor = texture2D(textureSampler, coord / texSize);
        vec2 clampedCoord = clamp(coord, vec2(0.0), texSize);
        if (coord != clampedCoord) {
            /* fade to transparent if we are outside the image */
            gl_FragColor.a *= max(0.0, 1.0 - length(coord - clampedCoord));
        }
    }
`;

export interface BulgePinchFilterParams extends Record<string, UniformValue> {
    texSize: [w: number, h: number];
    center: [x: number, y: number];
    radius: number;
    strength: number;
}

export class BulgePinchFilter extends FilterBase<BulgePinchFilterParams> {
    constructor(params: BulgePinchFilterParams) {
        super(bulgePinchFragmentShader, params);
    }
}
