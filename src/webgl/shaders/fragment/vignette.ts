export const vignetteFragmentShader: string = `
    precision highp float;
    varying vec2 texCoords;
    uniform sampler2D textureSampler;

    uniform float vignette_size;
    uniform float vignette_amount;

    vec3 vignette(vec3 color, float size, float amount) {
        float dist = distance(texCoords, vec2(0.5, 0.5));
        return color * smoothstep(0.8, size * 0.799, dist * (amount + size));
    }

    void main() {
        vec4 color = texture2D(textureSampler, texCoords);

        color.rgb = vignette(color.rgb, vignette_size, vignette_amount);

        gl_FragColor = color;
    }
`;
