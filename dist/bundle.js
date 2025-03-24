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
      const canvas2 = document.createElement("canvas");
      [canvas2.width, canvas2.height] = size;
      return canvas2.getContext("2d");
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
    #drawLeftColorBar() {
      const ctx = this.#ctx;
      ctx.save();
      const colors = [
        "#3c9a7a",
        "#577ad6",
        "#b85a7a",
        "#9d7a1e"
      ];
      const squareSize = this.#gridSquareSize;
      const [gridOffsetX, gridOffsetY] = this.#gridOffset;
      const border = 2;
      [ctx.fillStyle] = colors;
      ctx.fillRect(
        gridOffsetX + squareSize * 2 + border / 2,
        gridOffsetY + squareSize * 2 + border / 2,
        squareSize - border / 2,
        squareSize * 2 - border
      );
      ctx.fillRect(
        gridOffsetX + squareSize * 2 + border / 2,
        gridOffsetY + squareSize * 4 - border / 2,
        squareSize - border,
        squareSize * 3.5 + border
      );
      [, ctx.fillStyle] = colors;
      ctx.fillRect(
        gridOffsetX + squareSize * 3,
        gridOffsetY + squareSize * 2 + border / 2,
        squareSize - border / 2,
        squareSize * 2 - border
      );
      [, , ctx.fillStyle] = colors;
      ctx.fillRect(
        gridOffsetX + squareSize * 2 + border / 2,
        gridOffsetY + squareSize * 7.5 - border / 2,
        squareSize - border,
        squareSize * 3.5 + border
      );
      ctx.fillRect(
        gridOffsetX + squareSize * 2 + border / 2,
        gridOffsetY + squareSize * 11 + border / 2,
        squareSize - border / 2,
        squareSize * 2 - border
      );
      [, , , ctx.fillStyle] = colors;
      ctx.fillRect(
        gridOffsetX + squareSize * 3,
        gridOffsetY + squareSize * 11 + border / 2,
        squareSize - border / 2,
        squareSize * 2 - border
      );
      ctx.fillStyle = this.#edgeColor.lighten;
      ctx.fillRect(
        gridOffsetX + squareSize * 2 + border / 2,
        gridOffsetY + squareSize * 2 + border / 2,
        1,
        squareSize * 11 - border
      );
      ctx.fillRect(
        gridOffsetX + squareSize * 4 - border,
        gridOffsetY + squareSize * 2 + border / 2,
        1,
        squareSize * 2 - border
      );
      ctx.fillRect(
        gridOffsetX + squareSize * 3 - border,
        gridOffsetY + squareSize * 4 - border / 2,
        1,
        squareSize * 7 + border
      );
      ctx.fillRect(
        gridOffsetX + squareSize * 4 - border,
        gridOffsetY + squareSize * 11 + border / 2,
        1,
        squareSize * 2 - border
      );
      ctx.restore();
    }
    #drawRightColorBar() {
      const ctx = this.#ctx;
      ctx.save();
      const colors = [
        "#577ad6",
        "#7a900b",
        "#9d7a1e",
        "#7a64e9"
      ];
      const squareSize = this.#gridSquareSize;
      const [gridOffsetX, gridOffsetY] = this.#gridOffset;
      const border = 2;
      [ctx.fillStyle] = colors;
      ctx.fillRect(
        gridOffsetX + squareSize * 15 + border / 2,
        gridOffsetY + squareSize * 2 + border / 2,
        squareSize - border / 2,
        squareSize * 2 - border
      );
      [, ctx.fillStyle] = colors;
      ctx.fillRect(
        gridOffsetX + squareSize * 16,
        gridOffsetY + squareSize * 2 + border / 2,
        squareSize - border / 2,
        squareSize * 2 - border
      );
      ctx.fillRect(
        gridOffsetX + squareSize * 16 + border / 2,
        gridOffsetY + squareSize * 4 - border / 2,
        squareSize - border,
        squareSize * 3.5 + border
      );
      [, , ctx.fillStyle] = colors;
      ctx.fillRect(
        gridOffsetX + squareSize * 15 + border / 2,
        gridOffsetY + squareSize * 11 + border / 2,
        squareSize - border / 2,
        squareSize * 2 - border
      );
      [, , , ctx.fillStyle] = colors;
      ctx.fillRect(
        gridOffsetX + squareSize * 16 + border / 2,
        gridOffsetY + squareSize * 7.5 - border / 2,
        squareSize - border,
        squareSize * 3.5 + border
      );
      ctx.fillRect(
        gridOffsetX + squareSize * 16,
        gridOffsetY + squareSize * 11 + border / 2,
        squareSize - border / 2,
        squareSize * 2 - border
      );
      ctx.fillStyle = this.#edgeColor.lighten;
      ctx.fillRect(
        gridOffsetX + squareSize * 15 + border / 2,
        gridOffsetY + squareSize * 2 + border / 2,
        1,
        squareSize * 2 - border
      );
      ctx.fillRect(
        gridOffsetX + squareSize * 17 - border,
        gridOffsetY + squareSize * 2 + border / 2,
        1,
        squareSize * 11 - border
      );
      ctx.fillRect(
        gridOffsetX + squareSize * 16 + border / 2,
        gridOffsetY + squareSize * 4 - border / 2,
        1,
        squareSize * 7 + border
      );
      ctx.fillRect(
        gridOffsetX + squareSize * 15 + border / 2,
        gridOffsetY + squareSize * 11 + border / 2,
        1,
        squareSize * 2 - border
      );
      ctx.restore();
    }
    render() {
      this.#drawGrid();
      this.#drawLeftColorBar();
      this.#drawRightColorBar();
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
      ctx.fillStyle = inverse ? "#000" : "#fff";
      ctx.fillRect(-fW / 2, 0, fW, h);
      ctx.fillStyle = inverse ? "#fff" : "#000";
      ctx.fillRect(-fW / 2, 0, 126, h);
      ctx.fillRect(fW / 2 - 126, 0, 126, h);
      ctx.fillRect(-fW / 2 + 145, 0, 4, h);
      ctx.fillStyle = inverse ? "rgb(0 0 0 / 0.333)" : "rgb(255 255 255 / 0.333)";
      ctx.fillRect(-fW / 2 + 145, 0, 1, h);
      ctx.fillRect(-fW / 2 + 148, 0, 1, h);
      return h;
    }
    #renderSquareWave75Row() {
      const ctx = this.#ctx;
      const itemW = 30;
      const h = 42;
      const [, , fW] = this.#rect;
      ctx.beginPath();
      ctx.rect(-fW / 2, 0, fW, h);
      ctx.clip();
      for (let i = 0, x = -9 * itemW; i < 18; i++, x += itemW) {
        ctx.fillStyle = i % 2 === 0 ? "#bfbfbf" : "#000";
        ctx.fillRect(x, 0, itemW, h);
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
        ctx.fillRect(x, 0, itemW, h);
      }
      return h;
    }
    #renderCrossedLines() {
      const ctx = this.#ctx;
      const [, , fW] = this.#rect;
      const h = 42;
      const itemW = 42;
      ctx.fillStyle = "#000";
      ctx.fillRect(-fW / 2, 0, fW, h);
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
        ctx.fillRect(0, 0, itemW, h);
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
        ctx.fillRect(x, 0, itemW, h);
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
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();
      const foreGroundYOffset = (palH - radius * 2) / 2;
      this.#renderCompleteForground(foreGroundYOffset, centerX);
      ctx.closePath();
    }
  };

  // src/provebilde-canvas.ts
  var defaultEdgeColor = {
    lighten: "rgb(255 255 255 / 0.666)",
    darken: "rgb(0 0 0 / 0.333)"
  };
  var ProveBildeCanvas = class {
    constructor(ctx, options3 = {}) {
      this.#options = options3;
      this.#ctx = ctx;
      const transp = "rgb(0 0 0 / 0)";
      const edgeColor = options3.blurredEdgesDisabled ? { lighten: transp, darken: transp } : defaultEdgeColor;
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
    #setDefaultFont() {
      const ctx = this.#ctx;
      ctx.fillStyle = "#fff";
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
      this.#setDefaultFont();
      ctx.fillText(
        text.toUpperCase(),
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
    renderInitial() {
      const ctx = this.#ctx;
      ctx.save();
      if (this.#options.imageSmootingDisabled) {
        ctx.imageSmoothingEnabled = false;
      }
      this.#background.render();
      this.#circle.render();
      const [palW, palH] = pal;
      const [centerX] = [palW / 2, palH / 2];
      const o = this.#options;
      if (o.headerText) {
        this.#renderHeaderOrFooterText(o.headerText, centerX, 57);
      }
      if (o.footerText) {
        this.#renderHeaderOrFooterText(o.footerText, centerX, 436);
      }
      ctx.restore();
    }
    renderFrame(timeDelta = 0) {
      const dt = new Date(Date.now() - timeDelta);
      if (this.#options.showDate) {
        this.#renderTime(dt, "date", 155);
      }
      if (this.#options.showTime) {
        this.#renderTime(dt, "time", 449);
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
    constructor(canvas2 = document.createElement("canvas"), ...filters) {
      const gl = canvas2.getContext("webgl");
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
    constructor(ctx, options3) {
      this.#ctx = ctx;
      this.#options = options3;
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
        filters.push(
          new BulgePinchFilter({
            texSize: [source.width, source.height],
            center: [source.width / 2, source.height / 2],
            radius: source.width * 0.75,
            strength: o.bulgePinch.strength
          })
        );
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
    constructor(ctx, options3) {
      this.#options = options3;
      this.#provebildeCanvas = new ProveBildeCanvas(ctx, options3);
      if (options3.fx) {
        this.#provebildeFx = new ProveBildeFx(ctx, options3.fx);
      }
    }
    #options;
    #provebildeCanvas;
    #provebildeFx = null;
    #watchTimer = 0;
    static getDefaultOptions() {
      return {
        headerText: "jasMIN",
        footerText: "Retro TV",
        showDate: true,
        showTime: true,
        // date: new Date(1985, 4, 12, 1, 23, 35),
        blurredEdgesDisabled: false,
        imageSmootingDisabled: false,
        fx: ProveBildeFx.getDefaultFx()
      };
    }
    stopWatch() {
      if (this.#watchTimer !== null) {
        clearInterval(this.#watchTimer);
        this.#watchTimer = null;
      }
    }
    startWatch() {
      const timeDelta = !this.#options.date ? 0 : Date.now() - this.#options.date.getTime();
      const renderFrame = () => {
        this.#provebildeCanvas.renderFrame(timeDelta);
        this.#provebildeFx?.renderFrame();
      };
      renderFrame();
      this.stopWatch();
      this.#watchTimer = setInterval(renderFrame, 500);
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

  // src/plugin.ts
  var proveBilde;
  var canvas;
  var options;
  function start() {
    if (proveBilde) {
      proveBilde.stop();
    }
    const ctx = canvas.getContext("2d");
    const [palW, palH] = pal;
    const [winW, winH] = [
      ctx.canvas.parentElement.clientWidth,
      ctx.canvas.parentElement.clientHeight
    ];
    const [scaleX, scaleY] = [winW / palW, winH / palH];
    const scale = Math.min(scaleX, scaleY);
    canvas.width = palW * scale;
    canvas.height = palH * scale;
    ctx.scale(scale, scale);
    proveBilde = new ProveBilde(ctx, options);
    proveBilde.start();
    document.body.style.zoom = "1";
  }
  var debouncedStart = debounce(start, 100);
  function initPlugin(o) {
    options = o;
    const container = typeof options.container === "string" ? document.querySelector(options.container) : options.container;
    container.innerHTML = "";
    canvas = document.createElement("canvas");
    container?.appendChild(canvas);
    const resizeObserver = new ResizeObserver(debouncedStart);
    resizeObserver.observe(container);
    start();
    container.addEventListener("click", (e) => {
      toggleFullScreen(e.currentTarget);
    });
  }

  // src/index.ts
  var options2 = {
    container: document.body,
    headerText: "jasMIN",
    footerText: "Retro TV",
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
    }
  };
  document.addEventListener("DOMContentLoaded", () => {
    initPlugin(options2);
  });
})();
//# sourceMappingURL=bundle.js.map
