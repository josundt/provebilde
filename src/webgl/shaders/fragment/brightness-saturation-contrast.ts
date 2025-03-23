export const brightnessSaturationContrastFragmentShader = `
    precision highp float;
    varying vec2 texCoords;
    uniform sampler2D textureSampler;

    uniform float brightness;
    uniform float contrast;
    uniform float saturation;

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

    void main() {
        vec4 color = texture2D(textureSampler, texCoords);

        color.rgb = adjustBrightness(color.rgb, brightness);
        color.rgb = adjustSaturation(color.rgb, saturation);
        color.rgb = adjustContrast(color.rgb, contrast);

        gl_FragColor = color;
    }
`;
