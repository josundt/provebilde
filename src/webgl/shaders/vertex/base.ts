export const baseVertexShader = `
  attribute vec2 position;
  varying vec2 texCoords;

  void main() {
    texCoords = (position + 1.0) / 2.0;

    ////////////////////////////////////////
    // FLIP: UNCOMMENT LINE BELOW TO FLIP //
    ////////////////////////////////////////
    //texCoords.y = 1.0 - texCoords.y;

    gl_Position = vec4(position, 0, 1.0);
  }
`;
