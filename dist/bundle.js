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

  // src/provebilde-bakgrunn.ts
  var ProveBildeBakgrunn = class {
    constructor(ctx, edgeColor) {
      this.gridSquareSize = 42;
      this.defaultGray = "#7a7a7a";
      this.gridOffset = [-15, -27];
      this.edgeColor = edgeColor;
      this.ctx = ctx;
      [this.leftGridStripesPattern, this.rightGridStripesPattern] = this.createGridStripePatterns(
        ["#b85a7a", "#3c9a7a"],
        ["#7a64e9", "#7a900b"]
      );
    }
    get gridSquareColCount() {
      const [w] = pal;
      const [offsetX] = this.gridOffset;
      const size = this.gridSquareSize;
      return Math.ceil((w - offsetX) / size);
    }
    get gridSquareRowCount() {
      const [, h] = pal;
      const [, offsetY] = this.gridOffset;
      const size = this.gridSquareSize;
      return Math.ceil((h - offsetY) / size);
    }
    drawGridSquare(fillStyle) {
      const size = this.gridSquareSize;
      const { ctx } = this;
      ctx.save();
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = fillStyle;
      ctx.fillRect(1, 1, size - 2, size - 2);
      ctx.fillStyle = this.edgeColor.lighten;
      ctx.fillRect(1, 1, 1, size - 2);
      ctx.fillRect(size - 2, 1, 1, size);
      ctx.restore();
    }
    getGridSquareFill(...offset) {
      const [cols, rows] = [this.gridSquareColCount, this.gridSquareRowCount];
      const [x, y] = offset;
      const [gridOffsetX, gridOffsetY] = this.gridOffset;
      const horSquareIndex = (x - gridOffsetX) / this.gridSquareSize;
      const verSquareIndex = (y - gridOffsetY) / this.gridSquareSize;
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
          result = this.makeHalfGridStripePattern(
            this.leftGridStripesPattern,
            "top"
          );
        } else if (isSecondBottomMostSquare) {
          result = this.makeHalfGridStripePattern(
            this.leftGridStripesPattern,
            "bottom"
          );
        } else {
          result = this.leftGridStripesPattern;
        }
      } else if (isSecondRightMostSquare) {
        if (isSecondTopMostSquare) {
          result = this.makeHalfGridStripePattern(
            this.rightGridStripesPattern,
            "top"
          );
        } else if (isSecondBottomMostSquare) {
          result = this.makeHalfGridStripePattern(
            this.rightGridStripesPattern,
            "bottom"
          );
        } else {
          result = this.rightGridStripesPattern;
        }
      } else {
        result = this.defaultGray;
      }
      return result;
    }
    createGridStripePatterns(...palettes) {
      const ctx = createOffscreenCanvasContext(1, 4);
      return palettes.map(([color1, color2]) => {
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, 1, 2);
        ctx.fillStyle = color2;
        ctx.fillRect(0, 2, 1, 2);
        return ctx.createPattern(ctx.canvas, "repeat");
      });
    }
    makeHalfGridStripePattern(stripePattern, noStripesAt) {
      const ctx = createOffscreenCanvasContext(
        this.gridSquareSize,
        this.gridSquareSize
      );
      ctx.fillStyle = stripePattern;
      ctx.fillRect(0, 0, this.gridSquareSize, this.gridSquareSize);
      ctx.fillStyle = this.defaultGray;
      if (noStripesAt === "top") {
        ctx.fillRect(0, 0, this.gridSquareSize, this.gridSquareSize / 2);
      } else {
        ctx.fillRect(
          0,
          this.gridSquareSize / 2,
          this.gridSquareSize,
          this.gridSquareSize / 2
        );
      }
      ctx.fill();
      return ctx.createPattern(ctx.canvas, "repeat");
    }
    drawGrid() {
      const { ctx } = this;
      ctx.save();
      const [palW, palH] = pal;
      const [gridOffsetX, gridOffsetY] = this.gridOffset;
      for (let transY = gridOffsetY; transY < palH; transY += this.gridSquareSize) {
        for (let transX = gridOffsetX; transX < palW; transX += this.gridSquareSize) {
          ctx.save();
          ctx.translate(transX, transY);
          this.drawGridSquare(this.getGridSquareFill(transX, transY));
          ctx.restore();
        }
      }
      ctx.restore();
    }
    drawLeftColorBar() {
      const { ctx } = this;
      ctx.save();
      const colors = [
        "#3c9a7a",
        "#577ad6",
        "#b85a7a",
        "#9d7a1e"
      ];
      const squareSize = this.gridSquareSize;
      const [gridOffsetX, gridOffsetY] = this.gridOffset;
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
      ctx.fillStyle = this.edgeColor.lighten;
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
    drawRightColorBar() {
      const { ctx } = this;
      ctx.save();
      const colors = [
        "#577ad6",
        "#7a900b",
        "#9d7a1e",
        "#7a64e9"
      ];
      const squareSize = this.gridSquareSize;
      const [gridOffsetX, gridOffsetY] = this.gridOffset;
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
      ctx.fillStyle = this.edgeColor.lighten;
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
      this.drawGrid();
      this.drawLeftColorBar();
      this.drawRightColorBar();
    }
  };

  // src/provebilde-sirkel.ts
  var ProveBildeSirkel = class {
    constructor(ctx, edgeColor) {
      this.edgeColor = edgeColor;
      this.ctx = ctx;
      const [palW, palH] = pal;
      const [fW, fgH] = [84 * 6, 84 * 6];
      const [fgX, fgY] = [palW / 2 - fW / 2, palH / 2 - fgH / 2];
      this.rect = [fgX, fgY, fW, fgH];
    }
    translate(x, y, callback) {
      const { ctx } = this;
      ctx.save();
      ctx.translate(x, y);
      const result = callback();
      ctx.restore();
      return result;
    }
    createGradientPattern(width) {
      const ctx = createOffscreenCanvasContext(width, 1);
      const gradient = ctx.createLinearGradient(0, 0, width, 1);
      gradient.addColorStop(0, "#000");
      gradient.addColorStop(0.5, "#fff");
      gradient.addColorStop(1, "#000");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, 1);
      return ctx.createPattern(ctx.canvas, "repeat");
    }
    renderTopRow() {
      const { ctx } = this;
      const [, , fW] = this.rect;
      const h = 21;
      ctx.fillStyle = "#fff";
      ctx.fillRect(-fW / 2, 0, fW, h);
      return h;
    }
    renderHeaderRow() {
      const { ctx } = this;
      const [, , fW] = this.rect;
      const h = 42;
      const w = 168;
      ctx.fillStyle = "#fff";
      ctx.fillRect(-fW / 2, 0, fW, h);
      ctx.fillStyle = "#000";
      ctx.fillRect(-w / 2, 0, w, h);
      return h;
    }
    renderReflectionCheckRow(inverse) {
      const { ctx } = this;
      const [, , fW] = this.rect;
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
    renderSquareWave75Row() {
      const { ctx } = this;
      const itemW = 30;
      const h = 42;
      const [, , fW] = this.rect;
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
    renderColoBar75Row() {
      const { ctx } = this;
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
    renderCrossedLines() {
      const { ctx } = this;
      const [, , fW] = this.rect;
      const h = 42;
      const itemW = 42;
      ctx.fillStyle = "#000";
      ctx.fillRect(-fW / 2, 0, fW, h);
      ctx.fillStyle = "#fff";
      ctx.fillRect(-fW / 2, h / 2 - 1, fW, 2);
      for (let x = -itemW * 6.5 - 2; x < itemW * 6.5; x += itemW) {
        ctx.fillRect(x, 0, 4, h);
        ctx.save();
        ctx.fillStyle = this.edgeColor.darken;
        ctx.fillRect(x, 0, 1, h);
        ctx.fillRect(x + 3, 0, 1, h);
        ctx.restore();
      }
      return h;
    }
    renderDefinitionLinesRow() {
      const { ctx } = this;
      const h = 84;
      const itemW = 84;
      const [, , fW] = this.rect;
      ctx.beginPath();
      ctx.rect(-fW / 2, 0, fW, h);
      ctx.clip();
      let x = -3.5 * itemW;
      const pixelFactor = 12;
      const squares = ["#000", 0.8, 1.8, 2.8, 3.8, 4.8, "#000"];
      for (const fillInfo of squares) {
        ctx.fillStyle = typeof fillInfo === "string" ? fillInfo : this.createGradientPattern(pixelFactor / fillInfo);
        ctx.translate(x, 0);
        ctx.fillRect(0, 0, itemW, h);
        ctx.translate(-x, 0);
        x += itemW;
      }
      ctx.closePath();
      return h;
    }
    renderGrayScaleStairCaseRow() {
      const { ctx } = this;
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
    renderColorStep75Row() {
      const { ctx } = this;
      const h = 65;
      const itemW = 40;
      const [, , fW] = this.rect;
      ctx.fillStyle = "#bfbf00";
      ctx.fillRect(-fW / 2, 0, fW, h);
      ctx.fillStyle = "rgb(185 25 18)";
      ctx.fillRect(-itemW / 2, 0, itemW, h);
      ctx.fillStyle = "rgb(255 255 255 / 0.333)";
      ctx.fillRect(-itemW / 2, 0, 1, h);
      ctx.fillRect(itemW / 2 - 1, 0, 1, h);
      return h;
    }
    renderCrossHair() {
      const { ctx } = this;
      const h = 42 * 3;
      const itemW = 38;
      ctx.fillStyle = "#000";
      ctx.fillRect(-itemW / 2, 0, itemW, h);
      ctx.save();
      ctx.fillStyle = this.edgeColor.darken;
      ctx.fillRect(-itemW / 2 - 1, 0, 1, 42);
      ctx.fillRect(itemW / 2, 0, 1, 42);
      ctx.fillRect(-itemW / 2 - 1, 42 * 2, 1, 42);
      ctx.fillRect(itemW / 2, 42 * 2, 1, 42);
      ctx.restore();
      ctx.fillStyle = "#fff";
      ctx.fillRect(-itemW / 2, h / 2 - 1, itemW, 2);
      ctx.fillRect(-2, 0, 4, h);
      ctx.save();
      ctx.fillStyle = this.edgeColor.darken;
      ctx.fillRect(-2, 0, 1, h);
      ctx.fillRect(1, 0, 1, h);
      ctx.restore();
      return h;
    }
    renderCompleteForground(y, cX) {
      const trans = this.translate.bind(this);
      y += trans(cX, y, () => this.renderTopRow());
      y += trans(cX, y, () => this.renderHeaderRow());
      y += trans(cX, y, () => this.renderReflectionCheckRow(false));
      y += trans(cX, y, () => this.renderSquareWave75Row());
      y += trans(cX, y, () => this.renderColoBar75Row());
      y += trans(cX, y, () => this.renderCrossedLines());
      y += trans(cX, y, () => this.renderDefinitionLinesRow());
      y += trans(cX, y, () => this.renderGrayScaleStairCaseRow());
      y += trans(cX, y, () => this.renderReflectionCheckRow(true));
      trans(cX, y, () => this.renderColorStep75Row());
      y = pal[1] / 2 - 63;
      trans(cX, y, () => this.renderCrossHair());
    }
    render() {
      const [palW, palH] = pal;
      const [centerX, centerY] = [palW / 2, palH / 2];
      const radius = 84 * 3;
      const { ctx } = this;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();
      const foreGroundYOffset = (palH - radius * 2) / 2;
      this.renderCompleteForground(foreGroundYOffset, centerX);
      ctx.closePath();
    }
  };

  // src/provebilde.ts
  var defaultEdgeColor = {
    lighten: "rgb(255 255 255 / 0.666)",
    darken: "rgb(0 0 0 / 0.333)"
  };
  var ProveBilde = class _ProveBilde {
    constructor(ctx, options2 = {}) {
      this.watchTimer = 0;
      this.textVerticalAdjust = 2;
      this.options = options2;
      this.ctx = ctx;
      const transp = "rgb(0 0 0 / 0)";
      const edgeColor = options2.noBlurEdges ? { lighten: transp, darken: transp } : defaultEdgeColor;
      this.background = new ProveBildeBakgrunn(ctx, edgeColor);
      this.circle = new ProveBildeSirkel(ctx, edgeColor);
      this.textVerticalAdjust = this.isSafari ? 0 : 2;
    }
    get isSafari() {
      return navigator.userAgent.toLowerCase().includes("safari/");
    }
    static setDefaultFont(ctx) {
      ctx.fillStyle = "#fff";
      ctx.font = "32px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    }
    renderLogoText(text, cX, yOffset) {
      const { ctx } = this;
      const [headerW, headerH] = [168, 42];
      ctx.save();
      ctx.translate(cX, yOffset + headerH / 2 + this.textVerticalAdjust);
      _ProveBilde.setDefaultFont(ctx);
      ctx.fillText(text.toUpperCase(), 0, 0, headerW - 8);
      ctx.restore();
    }
    renderTime(dt, format, cX) {
      const { ctx } = this;
      ctx.save();
      const [w, h] = [164, 42];
      const [, palH] = pal;
      const cY = palH / 2;
      ctx.fillStyle = "#000";
      ctx.fillRect(cX, cY - h / 2, w, h);
      _ProveBilde.setDefaultFont(ctx);
      ctx.wordSpacing = format === "date" ? "-5px" : "-3px";
      const textParts = format === "date" ? [dt.getDate(), dt.getMonth() + 1, dt.getFullYear() % 1e3] : [dt.getHours(), dt.getMinutes(), dt.getSeconds()];
      const formatted = textParts.map((p) => p.toString().padStart(2, "0")).join(format === "date" ? " - " : " : ");
      ctx.fillText(formatted, cX + w / 2, cY + this.textVerticalAdjust);
      ctx.restore();
    }
    stopWatch() {
      if (this.watchTimer !== null) {
        clearInterval(this.watchTimer);
        this.watchTimer = null;
      }
    }
    startWatch() {
      const renderDateAndTime = () => {
        const dt = /* @__PURE__ */ new Date();
        if (this.options.showDate) {
          this.renderTime(dt, "date", 155);
        }
        if (this.options.showTime) {
          this.renderTime(dt, "time", 449);
        }
      };
      renderDateAndTime();
      this.stopWatch();
      this.watchTimer = setInterval(renderDateAndTime, 500);
    }
    start() {
      const { ctx } = this;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      this.background.render();
      this.circle.render();
      const [palW, palH] = pal;
      const [centerX] = [palW / 2, palH / 2];
      const o = this.options;
      if (o.headerText) {
        this.renderLogoText(o.headerText, centerX, 57);
      }
      if (o.footerText) {
        this.renderLogoText(o.footerText, centerX, 436);
      }
      if (o.showDate || o.showTime) {
        this.startWatch();
      }
      ctx.restore();
    }
    stop() {
      this.stopWatch();
    }
  };

  // src/index.ts
  var options = {
    headerText: "J\xF8rn A",
    footerText: "Sundt",
    showDate: true,
    showTime: true,
    noBlurEdges: false
  };
  var proveBilde;
  var canvas;
  function init() {
    if (proveBilde) {
      proveBilde.stop();
    }
    if (!canvas) {
      canvas = document.getElementById("provebilde");
      canvas.addEventListener(
        "click",
        (e) => e.target.requestFullscreen()
      );
    }
    const ctx = canvas.getContext("2d");
    const [palW, palH] = pal;
    const [winW, winH] = [window.innerWidth, window.innerHeight];
    const [scaleX, scaleY] = [winW / palW, winH / palH];
    const scale = Math.min(scaleX, scaleY);
    canvas.width = palW * scale;
    canvas.height = palH * scale;
    ctx.scale(scale, scale);
    proveBilde = new ProveBilde(ctx, options);
    proveBilde.start();
  }
  var debouncedInit = debounce(init, 400);
  document.addEventListener("DOMContentLoaded", () => {
    init();
    document.body.style.zoom = "1";
  });
  window.addEventListener("resize", () => {
    debouncedInit();
  });
})();
//# sourceMappingURL=bundle.js.map
