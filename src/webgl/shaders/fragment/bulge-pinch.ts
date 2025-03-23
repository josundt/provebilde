// Dependencies: warp-fragment

export const bulgePinchFragmentShader = `
    precision highp float;
    varying vec2 texCoords;
    uniform sampler2D textureSampler;

    uniform vec2  bulgepinch_texSize;
    uniform float bulgepinch_radius;
    uniform float bulgepinch_strength;
    uniform vec2  bulgepinch_center;

    void main() {
        vec2 coord = texCoords * bulgepinch_texSize;
        coord -= bulgepinch_center;
        float distance = length(coord);
        if (distance < bulgepinch_radius) {
            float percent = distance / bulgepinch_radius;
            if (bulgepinch_strength > 0.0) {
                coord *= mix(1.0, smoothstep(0.0, bulgepinch_radius / distance, percent), bulgepinch_strength * 0.75);
            } else {
                coord *= mix(1.0, pow(percent, 1.0 + bulgepinch_strength * 0.75) * bulgepinch_radius / distance, 1.0 - percent);
            }
        }
        coord += bulgepinch_center;
        gl_FragColor = texture2D(textureSampler, coord / bulgepinch_texSize);
        vec2 clampedCoord = clamp(coord, vec2(0.0), bulgepinch_texSize);
        if (coord != clampedCoord) {
            /* fade to transparent if we are outside the image */
            gl_FragColor.a *= max(0.0, 1.0 - length(coord - clampedCoord));
        }
    }
`;
