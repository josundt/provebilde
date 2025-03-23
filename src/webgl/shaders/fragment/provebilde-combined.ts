export const provebildeCombinedFragmentShader = `
    precision highp float;
    varying vec2 texCoords;
    uniform sampler2D textureSampler;

    uniform float brightness;
    uniform float contrast;
    uniform float saturation;

    uniform float vignette_size;
    uniform float vignette_amount;

    uniform vec2  bulgepinch_texSize;
    uniform float bulgepinch_radius;
    uniform float bulgepinch_strength;
    uniform vec2  bulgepinch_center;



    vec3 adjustBrightness(vec3 color, float brightness) {
        return color + brightness;
    }

    vec3 adjustContrast(vec3 color, float contrast) {
        return 0.5 + (contrast + 1.0) * (color.rgb - 0.5);
    }

    vec3 adjustSaturation(vec3 color, float saturation) {
        // WCAG 2.1 relative luminance base
        const vec3 luminanceWeighting = vec3(0.2126, 0.7152, 0.0722);
        vec3 grayscaleColor = vec3(dot(color, luminanceWeighting));
        return mix(grayscaleColor, color, 1.0 + saturation);
    }

    vec3 vignette(vec3 color, float size, float amount) {
        float dist = distance(texCoords, vec2(0.5, 0.5));
        return color * smoothstep(0.8, size * 0.799, dist * (amount + size));
    }


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


        vec4 color = texture2D(textureSampler, coord / bulgepinch_texSize);

        color.rgb = adjustBrightness(color.rgb, brightness);
        color.rgb = adjustSaturation(color.rgb, saturation);
        color.rgb = adjustContrast(color.rgb, contrast);
        color.rgb = vignette(color.rgb, vignette_size, vignette_amount);

        gl_FragColor = color;

        vec2 clampedCoord = clamp(coord, vec2(0.0), bulgepinch_texSize);
        if (coord != clampedCoord) {
            /* fade to transparent if we are outside the image */
            gl_FragColor.a *= max(0.0, 1.0 - length(coord - clampedCoord));
        }


    }
`;
