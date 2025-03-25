(() => {
  // src/constants.ts
  var pal = [768, 576];

  // src/utils.ts
  function debounce(func, wait, immediate = false) {
    let timeout = null;
    return (...args) => {
      const later = () => {
        timeout = null;
        if (!immediate) {
          func(...args);
        }
      };
      const callNow = immediate && !timeout;
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(later, wait);
      if (callNow) {
        func(...args);
      }
    };
  }
  function createOffscreenCanvasContext(...size) {
    let result;
    if ("OffscreenCanvas" in self) {
      result = new OffscreenCanvas(...size).getContext("2d");
    } else {
      const canvas = document.createElement("canvas");
      [canvas.width, canvas.height] = size;
      return canvas.getContext("2d");
    }
    return result;
  }
  function isSafari(win) {
    return window.navigator.userAgent.includes("Mac OS X") && window.navigator.userAgent.includes("Safari");
  }
  var isFullScreen = false;
  var fullScreenTogglePromise = null;
  function toggleFullScreen(elem) {
    if (fullScreenTogglePromise) {
      return;
    }
    if (isFullScreen) {
      fullScreenTogglePromise = document.exitFullscreen();
    } else {
      fullScreenTogglePromise = elem.requestFullscreen();
    }
    fullScreenTogglePromise.then(() => {
      isFullScreen = !isFullScreen;
    }).finally(() => fullScreenTogglePromise = null);
  }

  // src/provebilde-canvas-background.ts
  var ProveBildeCanvasBackground = class {
    constructor(ctx, edgeColor) {
      this.#edgeColor = edgeColor;
      this.#ctx = ctx;
      [this.#leftGridStripesPattern, this.#rightGridStripesPattern] = this.#createGridStripePatterns(
        ["#b85a7a", "#3c9a7a"],
        ["#7a64e9", "#7a900b"]
      );
    }
    #ctx;
    #edgeColor;
    #leftGridStripesPattern;
    #rightGridStripesPattern;
    #gridSquareSize = 42;
    #defaultGray = "#7a7a7a";
    #gridOffset = [-15, -27];
    get #gridSquareColCount() {
      const [w] = pal;
      const [offsetX] = this.#gridOffset;
      const size = this.#gridSquareSize;
      return Math.ceil((w - offsetX) / size);
    }
    get #gridSquareRowCount() {
      const [, h] = pal;
      const [, offsetY] = this.#gridOffset;
      const size = this.#gridSquareSize;
      return Math.ceil((h - offsetY) / size);
    }
    #drawGridSquare(fillStyle) {
      const size = this.#gridSquareSize;
      const ctx = this.#ctx;
      ctx.save();
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = fillStyle;
      ctx.fillRect(1, 1, size - 2, size - 2);
      ctx.fillStyle = this.#edgeColor.lighten;
      ctx.fillRect(1, 1, 1, size - 2);
      ctx.fillRect(size - 2, 1, 1, size);
      ctx.restore();
    }
    #getGridSquareFill(...offset) {
      const [cols, rows] = [
        this.#gridSquareColCount,
        this.#gridSquareRowCount
      ];
      const [x, y] = offset;
      const [gridOffsetX, gridOffsetY] = this.#gridOffset;
      const horSquareIndex = (x - gridOffsetX) / this.#gridSquareSize;
      const verSquareIndex = (y - gridOffsetY) / this.#gridSquareSize;
      const isOutsideHorBounds = horSquareIndex === 0 || horSquareIndex >= cols - 1;
      const isOutsideVerBounds = verSquareIndex === 0 || verSquareIndex >= rows - 1;
      const isSecondLeftMostSquare = horSquareIndex === 1;
      const isSecondRightMostSquare = horSquareIndex === cols - 2;
      const isSecondTopMostSquare = verSquareIndex === 1;
      const isSecondBottomMostSquare = verSquareIndex === rows - 2;
      let result;
      if (isOutsideHorBounds || isOutsideVerBounds) {
        const isEven = (horSquareIndex + verSquareIndex) % 2 === 0;
        result = isEven ? "#fff" : "#000";
      } else if (isSecondLeftMostSquare) {
        if (isSecondTopMostSquare) {
          result = this.#makeHalfGridStripePattern(
            this.#leftGridStripesPattern,
            "top"
          );
        } else if (isSecondBottomMostSquare) {
          result = this.#makeHalfGridStripePattern(
            this.#leftGridStripesPattern,
            "bottom"
          );
        } else {
          result = this.#leftGridStripesPattern;
        }
      } else if (isSecondRightMostSquare) {
        if (isSecondTopMostSquare) {
          result = this.#makeHalfGridStripePattern(
            this.#rightGridStripesPattern,
            "top"
          );
        } else if (isSecondBottomMostSquare) {
          result = this.#makeHalfGridStripePattern(
            this.#rightGridStripesPattern,
            "bottom"
          );
        } else {
          result = this.#rightGridStripesPattern;
        }
      } else {
        result = this.#defaultGray;
      }
      return result;
    }
    #createGridStripePatterns(...palettes) {
      const ctx = createOffscreenCanvasContext(1, 4);
      return palettes.map(([color1, color2]) => {
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, 1, 2);
        ctx.fillStyle = color2;
        ctx.fillRect(0, 2, 1, 2);
        return ctx.createPattern(ctx.canvas, "repeat");
      });
    }
    #makeHalfGridStripePattern(stripePattern, noStripesAt) {
      const ctx = createOffscreenCanvasContext(
        this.#gridSquareSize,
        this.#gridSquareSize
      );
      ctx.fillStyle = stripePattern;
      ctx.fillRect(0, 0, this.#gridSquareSize, this.#gridSquareSize);
      ctx.fillStyle = this.#defaultGray;
      if (noStripesAt === "top") {
        ctx.fillRect(0, 0, this.#gridSquareSize, this.#gridSquareSize / 2);
      } else {
        ctx.fillRect(
          0,
          this.#gridSquareSize / 2,
          this.#gridSquareSize,
          this.#gridSquareSize / 2
        );
      }
      ctx.fill();
      return ctx.createPattern(ctx.canvas, "repeat");
    }
    #drawGrid() {
      const ctx = this.#ctx;
      ctx.save();
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, ...pal);
      const [palW, palH] = pal;
      const [gridOffsetX, gridOffsetY] = this.#gridOffset;
      for (let transY = gridOffsetY; transY < palH; transY += this.#gridSquareSize) {
        for (let transX = gridOffsetX; transX < palW; transX += this.#gridSquareSize) {
          ctx.save();
          ctx.translate(transX, transY);
          this.#drawGridSquare(this.#getGridSquareFill(transX, transY));
          ctx.restore();
        }
      }
      ctx.restore();
    }
    #drawColorBar(color1, color2) {
      const ctx = this.#ctx;
      ctx.save();
      const squareSize = this.#gridSquareSize;
      const border = 2;
      const w1 = squareSize - border / 2;
      const w = squareSize * 2 - border;
      const h1 = squareSize * 3.5 + border;
      const h2 = squareSize * 2 - border;
      const h = h1 + h2;
      ctx.fillStyle = color1;
      ctx.fillRect(0, 0, w1 + 1, squareSize * 2 - border);
      ctx.fillRect(0, w - 1, squareSize - border, h1 + 1);
      ctx.fillStyle = color2;
      ctx.fillRect(w1, 0, squareSize - border / 2, h2);
      ctx.fillStyle = this.#edgeColor.lighten;
      ctx.fillRect(0, 0, border, h1 + h2);
      ctx.fillRect(w - border, 0, 4, h1 + h2);
      ctx.fillRect(w1 - border, h2, 4, h1);
      ctx.restore();
      return [w, h];
    }
    #drawColorBars() {
      const ctx = this.#ctx;
      const squareSize = this.#gridSquareSize;
      const [gridOffsetX, gridOffsetY] = this.#gridOffset;
      const border = 2;
      let x = gridOffsetX + squareSize * 2 + border / 2;
      const y = gridOffsetY + squareSize * 2 + border / 2;
      ctx.save();
      ctx.translate(x, y);
      const [, h] = this.#drawColorBar("#3c9a7a", "#577ad6");
      ctx.translate(0, h * 2 - border);
      ctx.scale(1, -1);
      this.#drawColorBar("#b85a7a", "#9d7a1e");
      ctx.restore();
      x += squareSize * 14 - border;
      ctx.save();
      ctx.translate(x + squareSize, y);
      ctx.scale(-1, 1);
      this.#drawColorBar("#577ad6", "#7a900b");
      ctx.translate(0, h * 2 - border);
      ctx.scale(1, -1);
      this.#drawColorBar("#9d7a1e", "#7a64e9");
      ctx.restore();
      ctx.restore();
    }
    render() {
      this.#drawGrid();
      this.#drawColorBars();
    }
  };

  // src/provebilde-canvas-circle.ts
  var ProveBildeCanvasCircle = class {
    constructor(ctx, edgeColor) {
      this.#edgeColor = edgeColor;
      this.#ctx = ctx;
      const [palW, palH] = pal;
      const [fW, fgH] = [84 * 6, 84 * 6];
      const [fgX, fgY] = [palW / 2 - fW / 2, palH / 2 - fgH / 2];
      this.#rect = [fgX, fgY, fW, fgH];
    }
    #ctx;
    #edgeColor;
    #rect;
    #translate(x, y, callback) {
      const ctx = this.#ctx;
      ctx.save();
      ctx.translate(x, y);
      const result = callback();
      ctx.restore();
      return result;
    }
    #createGradientPattern(width) {
      const ctx = createOffscreenCanvasContext(width, 1);
      const gradient = ctx.createLinearGradient(0, 0, width, 1);
      gradient.addColorStop(0, "#000");
      gradient.addColorStop(0.5, "#fff");
      gradient.addColorStop(1, "#000");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, 1);
      return ctx.createPattern(ctx.canvas, "repeat");
    }
    #renderTopRow() {
      const ctx = this.#ctx;
      const [, , fW] = this.#rect;
      const h = 21;
      ctx.fillStyle = "#fff";
      ctx.fillRect(-fW / 2, 0, fW, h);
      return h;
    }
    #renderHeaderRow() {
      const ctx = this.#ctx;
      const [, , fW] = this.#rect;
      const h = 42;
      const w = 168;
      ctx.fillStyle = "#fff";
      ctx.fillRect(-fW / 2, 0, fW, h);
      ctx.fillStyle = "#000";
      ctx.fillRect(-w / 2, 0, w, h);
      return h;
    }
    #renderReflectionCheckRow(inverse) {
      const ctx = this.#ctx;
      const [, , fW] = this.#rect;
      const h = 42;
      const stops = [
        -fW / 2,
        // start
        -fW / 2 + 126,
        // left rect end
        -fW / 2 + 145,
        // reflection bar start
        -fW / 2 + 149,
        // reflection bar end
        fW / 2 - 126,
        // right rect start
        fW / 2
        // end
      ];
      for (const [i, stop] of stops.entries()) {
        if (i === 0) {
          continue;
        }
        const prevStop = stops[i - 1];
        ctx.fillStyle = i % 2 === 0 ? inverse ? "#000" : "#fff" : inverse ? "#fff" : "#000";
        ctx.fillRect(stop, 0, prevStop - stop, h + 1);
      }
      ctx.fillStyle = inverse ? "rgb(0 0 0 / 0.333)" : "rgb(255 255 255 / 0.333)";
      ctx.fillRect(stops[2], 0, 1, h + 1);
      ctx.fillRect(stops[3] - 1, 0, 1, h + 1);
      return h;
    }
    #renderSquareWave75Row() {
      const ctx = this.#ctx;
      const itemW = 30;
      const h = 42;
      const [, , fW] = this.#rect;
      ctx.beginPath();
      ctx.rect(-fW / 2, 0, fW, h + 1);
      ctx.clip();
      for (let i = 0, x = -9 * itemW; i < 18; i++, x += itemW) {
        ctx.fillStyle = i % 2 === 0 ? "#bfbfbf" : "#000";
        ctx.fillRect(x, 0, itemW + 1, h + 1);
      }
      ctx.closePath();
      return h;
    }
    #renderColoBar75Row() {
      const ctx = this.#ctx;
      const h = 84;
      const itemW = 84;
      const colors = [
        "#bfbf00",
        "#00bfbf",
        "#00bf00",
        "#bf00bf",
        "#bf0000",
        "#0000bf"
      ];
      for (const [i, color] of colors.entries()) {
        const x = (i - 3) * itemW;
        ctx.fillStyle = color;
        ctx.fillRect(x, 0, itemW + 1, h + 1);
      }
      return h;
    }
    #renderCrossedLines() {
      const ctx = this.#ctx;
      const [, , fW] = this.#rect;
      const h = 42;
      const itemW = 42;
      ctx.fillStyle = "#000";
      ctx.fillRect(-fW / 2, 0, fW, h + 1);
      ctx.fillStyle = "#fff";
      ctx.fillRect(-fW / 2, h / 2 - 1, fW, 2);
      for (let x = -itemW * 6.5 - 2; x < itemW * 6.5; x += itemW) {
        ctx.fillRect(x, 0, 4, h);
        ctx.save();
        ctx.fillStyle = this.#edgeColor.darken;
        ctx.fillRect(x, 0, 1, h);
        ctx.fillRect(x + 3, 0, 1, h);
        ctx.restore();
      }
      return h;
    }
    #renderDefinitionLinesRow() {
      const ctx = this.#ctx;
      const h = 84;
      const itemW = 84;
      const [, , fW] = this.#rect;
      ctx.beginPath();
      ctx.rect(-fW / 2, 0, fW, h);
      ctx.clip();
      let x = -3.5 * itemW;
      const pixelFactor = 12;
      const squares = ["#000", 0.8, 1.8, 2.8, 3.8, 4.8, "#000"];
      for (const fillInfo of squares) {
        ctx.fillStyle = typeof fillInfo === "string" ? fillInfo : this.#createGradientPattern(pixelFactor / fillInfo);
        ctx.translate(x, 0);
        ctx.fillRect(0, 0, itemW, h + 1);
        ctx.translate(-x, 0);
        x += itemW;
      }
      ctx.closePath();
      return h;
    }
    #renderGrayScaleStairCaseRow() {
      const ctx = this.#ctx;
      const h = 42;
      const itemW = 84;
      let x = -3 * itemW;
      for (let i = 0; i < 6; i++) {
        const lightness = 51 * i;
        const hex = Math.round(lightness).toString(16).padStart(2, "0");
        ctx.fillStyle = `#${hex}${hex}${hex}`;
        ctx.fillRect(x, 0, itemW + 1, h + 1);
        x += itemW;
      }
      return h;
    }
    #renderColorStep75Row() {
      const ctx = this.#ctx;
      const h = 65;
      const itemW = 40;
      const [, , fW] = this.#rect;
      ctx.fillStyle = "#bfbf00";
      ctx.fillRect(-fW / 2, 0, fW, h);
      ctx.fillStyle = "rgb(185 25 18)";
      ctx.fillRect(-itemW / 2, 0, itemW, h);
      ctx.fillStyle = "rgb(255 255 255 / 0.333)";
      ctx.fillRect(-itemW / 2, 0, 1, h);
      ctx.fillRect(itemW / 2 - 1, 0, 1, h);
      return h;
    }
    #renderCrossHair() {
      const ctx = this.#ctx;
      const h = 42 * 3;
      const itemW = 38;
      ctx.fillStyle = "#000";
      ctx.fillRect(-itemW / 2, 0, itemW, h);
      ctx.save();
      ctx.fillStyle = this.#edgeColor.darken;
      ctx.fillRect(-itemW / 2 - 1, 0, 1, 42);
      ctx.fillRect(itemW / 2, 0, 1, 42);
      ctx.fillRect(-itemW / 2 - 1, 42 * 2, 1, 42);
      ctx.fillRect(itemW / 2, 42 * 2, 1, 42);
      ctx.restore();
      ctx.fillStyle = "#fff";
      ctx.fillRect(-itemW / 2, h / 2 - 1, itemW, 2);
      ctx.fillRect(-2, 0, 4, h);
      ctx.save();
      ctx.fillStyle = this.#edgeColor.darken;
      ctx.fillRect(-2, 0, 1, h);
      ctx.fillRect(1, 0, 1, h);
      ctx.restore();
      return h;
    }
    #renderCompleteForground(y, cX) {
      const trans = this.#translate.bind(this);
      this.#ctx.save();
      this.#ctx.fillStyle = "#fff";
      this.#ctx.fillRect(...this.#rect);
      this.#ctx.restore();
      y += trans(cX, y, () => this.#renderTopRow());
      y += trans(cX, y, () => this.#renderHeaderRow());
      y += trans(cX, y, () => this.#renderReflectionCheckRow(false));
      y += trans(cX, y, () => this.#renderSquareWave75Row());
      y += trans(cX, y, () => this.#renderColoBar75Row());
      y += trans(cX, y, () => this.#renderCrossedLines());
      y += trans(cX, y, () => this.#renderDefinitionLinesRow());
      y += trans(cX, y, () => this.#renderGrayScaleStairCaseRow());
      y += trans(cX, y, () => this.#renderReflectionCheckRow(true));
      trans(cX, y, () => this.#renderColorStep75Row());
      y = pal[1] / 2 - 63;
      trans(cX, y, () => this.#renderCrossHair());
    }
    render() {
      const [palW, palH] = pal;
      const [centerX, centerY] = [palW / 2, palH / 2];
      const radius = 84 * 3;
      const ctx = this.#ctx;
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();
      const foreGroundYOffset = (palH - radius * 2) / 2;
      this.#renderCompleteForground(foreGroundYOffset, centerX);
      ctx.restore();
    }
  };

  // src/provebilde-canvas.ts
  var defaultEdgeColor = {
    lighten: "rgb(255 255 255 / 0.666)",
    darken: "rgb(0 0 0 / 0.333)"
  };
  var ProveBildeCanvas = class {
    constructor(ctx, options2 = {}) {
      this.#options = options2;
      this.#ctx = ctx;
      const transp = "rgb(0 0 0 / 0)";
      const edgeColor = options2.blurredEdgesDisabled ? { lighten: transp, darken: transp } : defaultEdgeColor;
      this.#background = new ProveBildeCanvasBackground(ctx, edgeColor);
      this.#circle = new ProveBildeCanvasCircle(ctx, edgeColor);
      const safari = isSafari(window);
      this.#textVerticalAdjust = safari ? 0 : 2;
    }
    #options;
    #ctx;
    #background;
    #circle;
    #textVerticalAdjust;
    #headFootHorizontalPadding = 6;
    #setDefaultFont(fillStyle = "#fff") {
      const ctx = this.#ctx;
      ctx.fillStyle = fillStyle;
      ctx.font = "32px Arial, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    }
    #fillTextMonoSpaced(...fillArgs) {
      const ctx = this.#ctx;
      ctx.save();
      const [text, x, y, maxWidth] = fillArgs;
      const charWidth = maxWidth / text.length;
      const currX = x - text.length * charWidth / 2;
      ctx.translate(maxWidth / 2 - 3, 0);
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        ctx.translate(charWidth, 0);
        ctx.fillText(char, currX, y + this.#textVerticalAdjust, charWidth);
      }
      ctx.restore();
    }
    #renderHeaderOrFooterText(text, cX, yOffset) {
      const ctx = this.#ctx;
      const [headerW, headerH] = [168, 42];
      ctx.save();
      ctx.translate(cX, yOffset + headerH / 2 + this.#textVerticalAdjust);
      ctx.fillStyle = "#000";
      ctx.fillRect(
        -headerW / 2 + 1,
        -headerH / 2 - 1,
        headerW - 2,
        headerH - 2
      );
      this.#setDefaultFont();
      ctx.fillText(
        text.toUpperCase().trim(),
        0,
        0,
        headerW - this.#headFootHorizontalPadding * 2
      );
      ctx.restore();
    }
    #renderTime(dt, format, cX) {
      const ctx = this.#ctx;
      ctx.save();
      const [w, h] = [164, 42];
      const [, palH] = pal;
      const cY = palH / 2;
      ctx.fillStyle = "#000";
      ctx.fillRect(cX, cY - h / 2, w, h);
      this.#setDefaultFont();
      const textParts = format === "date" ? [dt.getDate(), dt.getMonth() + 1, dt.getFullYear() % 100] : [dt.getHours(), dt.getMinutes(), dt.getSeconds()];
      const formatted = textParts.map((p) => p.toString().padStart(2, "0")).join(format === "date" ? "-" : ":");
      this.#fillTextMonoSpaced(
        formatted,
        cX,
        cY,
        w - this.#headFootHorizontalPadding * 2
      );
      ctx.restore();
    }
    #renderOsd(osd) {
      const ctx = this.#ctx;
      ctx.save();
      const [palW, palH] = pal;
      const normalizedValue = Math.round(
        Math.max(-1, Math.min(1, osd.level)) * 20
      );
      ctx.fillStyle = "#0e0";
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#0b0";
      ctx.font = "bold 24px Arial, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.translate(palW / 2, palH / 1.25);
      for (let i = -20; i <= 20; i++) {
        let text;
        if (normalizedValue < 0) {
          text = i < normalizedValue || i > 0 ? "-" : "\u2588";
        } else {
          text = i < 0 || i > normalizedValue ? "-" : "\u2588";
        }
        ctx.fillText(text, i * 10, 0, 1e3);
      }
      ctx.translate(0, 40);
      const paramText = (osd.param === "saturation" ? "color" : osd.param).toUpperCase();
      ctx.fillText(paramText, 0, 0, 1e3);
      ctx.strokeText(paramText, 0, 0, 1e3);
      ctx.restore();
    }
    renderInitial() {
      const ctx = this.#ctx;
      if (this.#options.imageSmootingDisabled) {
        ctx.imageSmoothingEnabled = false;
      }
      ctx.restore();
    }
    renderFrame(timeDelta, osd) {
      const dt = new Date(Date.now() - timeDelta);
      const o = this.#options;
      const [palW, palH] = pal;
      const [centerX] = [palW / 2, palH / 2];
      this.#background.render();
      this.#circle.render();
      if (o.showDate) {
        this.#renderTime(dt, "date", 155);
      }
      if (o.showTime) {
        this.#renderTime(dt, "time", 449);
      }
      if (typeof o.headerText === "string") {
        this.#renderHeaderOrFooterText(o.headerText, centerX, 57);
      }
      if (typeof o.footerText === "string") {
        this.#renderHeaderOrFooterText(o.footerText, centerX, 436);
      }
      if (osd.param !== "none") {
        this.#renderOsd(osd);
      }
    }
  };

  // src/webgl/webgl-util.ts
  var WebGLUtil = class {
    static createProgram(gl, ...shaders) {
      const program = gl.createProgram();
      for (const shader of shaders) {
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      return program;
    }
    /**
      Bind the active array buffer.
     * @param gl The WebGLRenderingContext
     * @param program The WebGLProgram
     * @param vertices The array to bind
     */
    static setBufferAndSetPositionAttribute(gl, program, vertices) {
      const vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      const positionLocation = gl.getAttribLocation(program, "position");
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(positionLocation);
    }
    static setImageTexture(gl, image) {
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    static #compileShader(gl, shaderSource, type) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, shaderSource);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader)?.replace(/[\u0000]/u, "") ?? ""?.trim();
        const logMessages = log.split(/\r?\n/u).filter((s) => !!s);
        const lastMessage = !logMessages.length ? "no message" : logMessages[logMessages.length - 1];
        throw new Error(
          `Shader failed to compile: ${lastMessage ?? "no message"}`
        );
      }
      return shader;
    }
    static compileVertexShader(gl, shaderSource) {
      return this.#compileShader(gl, shaderSource, gl.VERTEX_SHADER);
    }
    static compileFragmentShader(gl, shaderSource) {
      return this.#compileShader(gl, shaderSource, gl.FRAGMENT_SHADER);
    }
    static compileFragmentShaders(gl, ...shaderSources) {
      return shaderSources.map(
        (source) => this.compileFragmentShader(gl, source)
      );
    }
    static clamp(minValue, value, maxValue) {
      return Math.min(Math.max(value, minValue), maxValue);
    }
  };

  // src/webgl/filters/filter-base.ts
  var baseFragmentShader = `
  precision highp float;

  varying vec2 texCoords;
  uniform sampler2D textureSampler;

  void main() {
    vec4 color = texture2D(textureSampler, texCoords);
    gl_FragColor = color;
  }
`;
  var FilterBase = class {
    constructor(fragmentShaderSource = baseFragmentShader, params) {
      this.fragmentShaderSource = fragmentShaderSource;
      if (params) {
        this.params = params;
      }
    }
    #program;
    getProgram(gl, vertexShader) {
      if (this.#program) {
        return this.#program;
      }
      const fragmentShader = WebGLUtil.compileFragmentShader(
        gl,
        this.fragmentShaderSource
      );
      return this.#program = WebGLUtil.createProgram(
        gl,
        vertexShader,
        fragmentShader
      );
    }
  };

  // src/webgl/filters/brightness-saturation-contrast.ts
  var brightnessSaturationContrastFragmentShader = `
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
  var BrightnessSaturationContrastFilter = class extends FilterBase {
    constructor(params) {
      super(brightnessSaturationContrastFragmentShader, params);
    }
  };

  // src/webgl/filters/bulge-pinch.ts
  var bulgePinchFragmentShader = `
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
  var BulgePinchFilter = class extends FilterBase {
    constructor(params) {
      super(bulgePinchFragmentShader, params);
    }
  };

  // src/webgl/filters/vignette.ts
  var vignetteFragmentShader = `
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
  var VignetteFilter = class extends FilterBase {
    constructor(params) {
      super(vignetteFragmentShader, params);
    }
  };

  // src/webgl/shaders/vertex/base-flipped.ts
  var baseVertexShaderFlipped = `
  attribute vec2 position;
  varying vec2 texCoords;

  void main() {
    texCoords = (position + 1.0) / 2.0;

    ////////////////////////////////////////
    // FLIP: UNCOMMENT LINE BELOW TO FLIP //
    ////////////////////////////////////////
    texCoords.y = 1.0 - texCoords.y;

    gl_Position = vec4(position, 0, 1.0);
  }
`;

  // src/webgl/webgl-renderer.ts
  var WebGLRenderer = class _WebGLRenderer {
    constructor(canvas = document.createElement("canvas"), ...filters) {
      const gl = canvas.getContext("webgl");
      if (!gl) {
        throw new Error("WebGL not supported");
      }
      if (!filters.length) {
        filters.push(new FilterBase());
      }
      this.#gl = gl;
      this.#logger = console;
      this.#filters = filters;
    }
    #gl;
    #filters;
    #logger;
    #currentProgram = null;
    #vertices = new Float32Array([
      -1,
      -1,
      -1,
      1,
      1,
      1,
      -1,
      -1,
      1,
      1,
      1,
      -1
    ]);
    #vertexShader = null;
    #programUniformLocations = /* @__PURE__ */ new Map();
    #useProgram(program) {
      const gl = this.#gl;
      gl.useProgram(program);
      this.#currentProgram = program;
      this.#programUniformLocations = _WebGLRenderer.#getUniforms(gl, program);
      return this.#currentProgram;
    }
    static #getUniforms(gl, program) {
      const result = /* @__PURE__ */ new Map();
      const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < numUniforms; i++) {
        const info = gl.getActiveUniform(program, i);
        if (info === null) {
          throw new Error(`Couldn't get uniform at index: ${i}.`);
        }
        const location = gl.getUniformLocation(program, info.name);
        if (location) {
          result.set(info.name, [info.type, location]);
        }
      }
      return result;
    }
    // eslint-disable-next-line complexity
    #setUniform(name, value) {
      const gl = this.#gl;
      const [type, location] = this.#programUniformLocations.get(name) ?? [void 0, void 0];
      const getTypeAndLengthDesc = (t, length) => `${t}${length ? `[${length}]` : ""}`;
      const logWrongType = (nm, glEnumName, expectedType, actualType, expectedLength, actualLength) => this.#logger.warn(
        `Wrong type for uniform '${nm}' (${glEnumName})  Expected: ${getTypeAndLengthDesc(expectedType, expectedLength)}, Actual: ${getTypeAndLengthDesc(actualType, actualLength)}`
      );
      const tryEnsureTypedArray = (arr, convert) => {
        if (arr instanceof Float32Array || arr instanceof Int32Array) {
          return arr;
        }
        return Array.isArray(arr) ? convert(arr) : arr;
      };
      switch (type) {
        case void 0: {
          this.#logger.warn(`Unknown uniform name: ${name}`);
          break;
        }
        case gl.FLOAT: {
          if (typeof value !== "number") {
            logWrongType(name, "FLOAT", "number", typeof value);
            break;
          }
          gl.uniform1fv(location, [value]);
          break;
        }
        case gl.FLOAT_VEC2: {
          const nValue = tryEnsureTypedArray(
            value,
            (a) => new Float32Array(a)
          );
          if (!(nValue instanceof Float32Array) || nValue.length !== 2) {
            logWrongType(
              name,
              "FLOAT_VEC2",
              "Float32Array",
              typeof nValue,
              2,
              typeof nValue === "object" && "length" in nValue ? nValue.length : void 0
            );
            break;
          }
          gl.uniform2fv(location, nValue);
          break;
        }
        case gl.FLOAT_VEC3: {
          const nValue = tryEnsureTypedArray(
            value,
            (a) => new Float32Array(a)
          );
          if (!(nValue instanceof Float32Array) || nValue.length !== 3) {
            logWrongType(
              name,
              "FLOAT_VEC3",
              "Float32Array",
              typeof nValue,
              3,
              typeof nValue === "object" && "length" in nValue ? nValue.length : void 0
            );
            break;
          }
          gl.uniform3fv(location, nValue);
          break;
        }
        case gl.FLOAT_VEC4: {
          const nValue = tryEnsureTypedArray(
            value,
            (a) => new Float32Array(a)
          );
          if (!(nValue instanceof Float32Array) || nValue.length !== 4) {
            logWrongType(
              name,
              "FLOAT_VEC4",
              "Float32Array",
              typeof nValue,
              4,
              typeof nValue === "object" && "length" in nValue ? nValue.length : void 0
            );
            break;
          }
          gl.uniform4fv(location, nValue);
          break;
        }
        case gl.BOOL:
        case gl.INT: {
          if (typeof value !== "number") {
            logWrongType(
              name,
              type === gl.BOOL ? "BOOL" : "INT",
              "number",
              typeof value
            );
            break;
          }
          gl.uniform1iv(location, [value]);
          break;
        }
        case gl.BOOL_VEC2:
        case gl.INT_VEC2: {
          const nValue = tryEnsureTypedArray(
            value,
            (a) => new Int32Array(a)
          );
          if (!(nValue instanceof Int32Array) || nValue.length !== 2) {
            logWrongType(
              name,
              type === gl.BOOL_VEC2 ? "BOOL_VEC2" : "INT_VEC2",
              "Int32Array",
              typeof nValue,
              2,
              typeof nValue === "object" && "length" in nValue ? nValue.length : void 0
            );
            break;
          }
          gl.uniform2iv(location, nValue);
          break;
        }
        case gl.BOOL_VEC3:
        case gl.INT_VEC3: {
          const nValue = tryEnsureTypedArray(
            value,
            (a) => new Int32Array(a)
          );
          if (!(nValue instanceof Int32Array) || nValue.length !== 3) {
            logWrongType(
              name,
              type === gl.BOOL_VEC3 ? "BOOL_VEC3" : "INT_VEC3",
              "Int32Array",
              typeof nValue,
              3,
              typeof nValue === "object" && "length" in nValue ? nValue.length : void 0
            );
            break;
          }
          gl.uniform3iv(location, nValue);
          break;
        }
        case gl.BOOL_VEC4:
        case gl.INT_VEC4: {
          const nValue = tryEnsureTypedArray(
            value,
            (a) => new Int32Array(a)
          );
          if (!(nValue instanceof Int32Array) || nValue.length !== 4) {
            logWrongType(
              name,
              type === gl.BOOL_VEC4 ? "BOOL_VEC4" : "INT_VEC4",
              "Int32Array",
              typeof nValue,
              4,
              typeof nValue === "object" && "length" in nValue ? nValue.length : void 0
            );
            break;
          }
          gl.uniform4iv(location, nValue);
          break;
        }
        default: {
          this.#logger.warn(`Unknown uniform type: ${type}`);
        }
      }
    }
    #getVertexShader() {
      if (this.#vertexShader) {
        return this.#vertexShader;
      }
      const vertexShader = WebGLUtil.compileVertexShader(
        this.#gl,
        baseVertexShaderFlipped
      );
      return this.#vertexShader = vertexShader;
    }
    renderImage(image) {
      const gl = this.#gl;
      const [w, h] = [gl.drawingBufferWidth, gl.drawingBufferHeight];
      gl.viewport(0, 0, w, h);
      const vertexShader = this.#getVertexShader();
      for (const filter of this.#filters) {
        const program = this.#useProgram(
          filter.getProgram(gl, vertexShader)
        );
        WebGLUtil.setBufferAndSetPositionAttribute(
          gl,
          program,
          this.#vertices
        );
        WebGLUtil.setImageTexture(gl, image);
        for (const [name, value] of Object.entries(filter.params ?? {})) {
          this.#setUniform(name, value);
        }
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        image = this.#gl.canvas;
      }
    }
  };

  // src/provebilde-fx.ts
  var ProveBildeFx = class {
    constructor(ctx, options2) {
      this.#ctx = ctx;
      this.#options = options2;
    }
    #ctx;
    #options;
    #renderer;
    static getDefaultFx() {
      return {
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
      };
    }
    renderInitial() {
      const className = "provebilde-fx";
      const source = this.#ctx.canvas;
      let glCanvas = source.parentElement?.querySelector(
        `.${className}`
      );
      if (glCanvas) {
        glCanvas.remove();
      }
      source.style.display = "none";
      glCanvas = document.createElement("canvas");
      glCanvas.className = className;
      glCanvas.width = source.width;
      glCanvas.height = source.height;
      source.parentNode.insertBefore(glCanvas, source);
      const o = this.#options;
      const filters = [];
      if (o?.brightnessSaturationContrast) {
        filters.push(
          new BrightnessSaturationContrastFilter(
            o.brightnessSaturationContrast
          )
        );
      }
      if (o?.bulgePinch) {
        const filterParams = o.bulgePinch;
        filterParams.texSize = [source.width, source.height];
        filterParams.center = [source.width / 2, source.height / 2];
        filterParams.radius = source.width * 0.75;
        filters.push(new BulgePinchFilter(filterParams));
      }
      if (o?.vignette) {
        filters.push(new VignetteFilter(o.vignette));
      }
      if (filters.length) {
        this.#renderer = new WebGLRenderer(glCanvas, ...filters);
      }
    }
    renderFrame() {
      this.#renderer?.renderImage(this.#ctx.canvas);
    }
  };

  // src/provebilde.ts
  var ProveBilde = class {
    constructor(ctx, options2) {
      this.#provebildeFx = null;
      this.#watchTimer = 0;
      this.timeDelta = 0;
      this.#options = options2;
      this.#provebildeCanvas = new ProveBildeCanvas(ctx, options2);
      if (options2.fx) {
        this.#provebildeFx = new ProveBildeFx(ctx, options2.fx);
      }
    }
    #options;
    #provebildeCanvas;
    #provebildeFx;
    #watchTimer;
    static getDefaultOptions() {
      return {
        headerText: "jasMIN",
        footerText: "Retro TV",
        showDate: true,
        showTime: true,
        // date: new Date(1985, 4, 12, 1, 23, 35),
        blurredEdgesDisabled: false,
        imageSmootingDisabled: false,
        fx: ProveBildeFx.getDefaultFx(),
        ocd: {
          param: "none",
          level: 0
        }
      };
    }
    stopWatch() {
      if (this.#watchTimer !== null) {
        clearInterval(this.#watchTimer);
        this.#watchTimer = null;
      }
    }
    startWatch() {
      this.timeDelta = !this.#options.date ? 0 : Date.now() - this.#options.date.getTime();
      const renderFrame = () => {
        this.#provebildeCanvas.renderFrame(
          this.timeDelta,
          this.#options.ocd
        );
        this.#provebildeFx?.renderFrame();
      };
      renderFrame();
      this.stopWatch();
      this.#watchTimer = setInterval(renderFrame, 100);
    }
    start() {
      const o = this.#options;
      this.#provebildeCanvas.renderInitial();
      this.#provebildeFx?.renderInitial();
      if (o.showDate || o.showTime) {
        this.startWatch();
      }
    }
    stop() {
      this.stopWatch();
    }
  };

  // src/provebilde-plugin.ts
  var ProveBildePlugin = class _ProveBildePlugin {
    constructor(options2) {
      this.focusedTextBox = "headerText";
      this.#debouncedStart = debounce(
        this.#start.bind(this),
        100
      );
      this.#debouncedClearOsd = debounce(() => {
        this.#options.ocd.param = "none";
      }, 3e3);
      this.#options = options2;
      const container = typeof options2.container === "string" ? document.querySelector(options2.container) : options2.container;
      container.innerHTML = "";
      this.#canvas = document.createElement("canvas");
      container?.appendChild(this.#canvas);
      this.#initEventHandlers(container);
      this.#start();
    }
    static create(options2) {
      return new _ProveBildePlugin(options2);
    }
    #canvas;
    #options;
    #proveBilde;
    #start() {
      if (this.#proveBilde) {
        this.#proveBilde.stop();
      }
      const ctx = this.#canvas.getContext("2d");
      const [palW, palH] = pal;
      const [winW, winH] = [
        ctx.canvas.parentElement.clientWidth,
        ctx.canvas.parentElement.clientHeight
      ];
      const [scaleX, scaleY] = [winW / palW, winH / palH];
      const scale = Math.min(scaleX, scaleY);
      this.#canvas.width = palW * scale;
      this.#canvas.height = palH * scale;
      ctx.scale(scale, scale);
      this.#proveBilde = new ProveBilde(ctx, this.#options);
      this.#proveBilde.start();
      document.body.style.zoom = "1";
    }
    #debouncedStart;
    #debouncedClearOsd;
    #initEventHandlers(container) {
      const o = this.#options;
      const resizeObserver = new ResizeObserver(this.#debouncedStart);
      resizeObserver.observe(container);
      container.addEventListener("click", (e) => {
        toggleFullScreen(e.currentTarget);
      });
      document.addEventListener("keydown", (e) => {
        if (!o.fx) {
          return;
        }
        if (["ArrowRight", "ArrowLeft"].includes(e.key)) {
          const factor = e.key === "ArrowRight" ? 1 : -1;
          const bsc = o.fx.brightnessSaturationContrast;
          if (bsc) {
            let bscKey;
            if (!e.ctrlKey && !e.shiftKey) {
              this.#proveBilde.timeDelta += 6e4 * factor * -1;
            } else if (e.ctrlKey && e.shiftKey) {
              bscKey = "saturation";
            } else if (e.ctrlKey) {
              bscKey = "brightness";
            } else if (e.shiftKey) {
              bscKey = "contrast";
            }
            if (bscKey) {
              const value = WebGLUtil.clamp(
                -1,
                bsc[bscKey] + 0.01 * factor,
                1
              );
              bsc[bscKey] = value;
              this.#options.ocd.level = value;
              this.#options.ocd.param = bscKey;
              this.#debouncedClearOsd();
            }
          }
          e.preventDefault();
        } else if (["ArrowUp", "ArrowDown"].includes(e.key)) {
          const factor = e.key === "ArrowUp" ? 1 : -1;
          const bp = o.fx.bulgePinch;
          if (bp) {
            bp.strength = WebGLUtil.clamp(
              0,
              bp.strength + 5e-3 * factor,
              1
            );
          }
          e.preventDefault();
        } else if (["PageUp", "PageDown"].includes(e.key)) {
          const factor = e.key === "PageUp" ? 1 : -1;
          const nowTime = Date.now();
          const displayedDate = new Date(
            nowTime + this.#proveBilde.timeDelta
          );
          const newTime = displayedDate.setDate(
            displayedDate.getDate() + factor
          );
          this.#proveBilde.timeDelta = newTime - nowTime;
          e.preventDefault();
        } else if (e.key === "Tab") {
          this.focusedTextBox = this.focusedTextBox === "headerText" ? "footerText" : "headerText";
          e.preventDefault();
        } else if (/^.$/u.test(e.key)) {
          const char = e.key.toUpperCase();
          const textProp = this.focusedTextBox;
          o[textProp] += char;
          e.preventDefault();
        } else if (e.key === "Backspace") {
          const textProp = this.focusedTextBox;
          if (o[textProp]) {
            o[textProp] = o[textProp].substring(
              0,
              o[textProp].length - 1
            );
          }
          e.preventDefault();
        } else if (e.key === "Delete") {
          const textProp = this.focusedTextBox;
          if (o[textProp]) {
            o[textProp] = "";
          }
          e.preventDefault();
        }
      });
      window.addEventListener("blur", () => {
        this.#proveBilde.stop();
      });
      window.addEventListener("focus", () => {
        this.#proveBilde.start();
      });
    }
  };

  // src/index.ts
  var options = {
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
})();
//# sourceMappingURL=bundle.js.map
