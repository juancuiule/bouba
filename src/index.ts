import * as P5 from "p5";
import { Bouba } from "./Bouba";
import { fxRandom } from "./utils";

export declare const window: Window &
  typeof globalThis & {
    fxrand(): number;
    $fxhashFeatures: Record<string, string | number | boolean>;
    fxpreview(): void;
    fxhash: string;
  };

const palettes = {
  a: ["#bf2f2c", "#01566c"],
  b: ["#99ca43", "#bf2f2c"],
  c: ["#99ca43", "#406ce3"],
  d: ["#ff192d", "#13addc"],
  e: ["#8dfad0", "#eb4659"],
  f: ["#5e5efc", "#131313"],
};

const sketch = (p5: P5) => {
  const paddingFactor = 0.1;
  let padding: number;
  let boubas: Bouba[] = [];
  let noiseImage: P5.Image;

  let width = window.innerWidth;
  let height = window.innerHeight;

  p5.preload = () => {
    noiseImage = p5.loadImage("./noise.png");
  };

  p5.setup = () => {
    p5.createCanvas(width, height);
    padding = paddingFactor * Math.min(width, height);

    let paletteKey = fxRandom(Object.keys(palettes)) as keyof typeof palettes;
    let [c1, c2] = palettes[paletteKey];

    boubas = [
      new Bouba({ n: 50, color: c1 }, p5),
      new Bouba({ n: 30, color: c2 }, p5),
    ];
  };

  p5.draw = () => {
    p5.background("#f4f4f4");

    boubas.forEach((b) => {
      b.draw();
      if (b.isLoading()) {
        p5.text("loading", 10, 30);
      } else if (b.failed()) {
        p5.text("try again", 10, 30);
      }
    });

    if (boubas.every((b) => b.correct)) {
      p5.push();
      boubas.forEach((b) => {
        const img = b.getImage();
        const size = p5.int(
          Math.min(width - padding * 2, height - padding * 2)
        );
        p5.blend(
          img,
          0,
          0,
          p5.int(img.width),
          p5.int(img.height),
          (width - size) / 2,
          (height - size) / 2,
          size,
          size,
          p5.MULTIPLY
        );
      });
      p5.pop();
      p5.noLoop();
      window.fxpreview();
    }
  };

  p5.keyPressed = () => {
    switch (p5.key) {
      case "s": {
        savePicture();
        break;
      }
      case "t": {
        toggle();
        break;
      }
      case "g": {
        saveSvg();
        break;
      }
    }
  };

  p5.windowResized = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    padding = paddingFactor * Math.min(width, height);
    p5.resizeCanvas(width, height);
  };

  const saveSvg = () => {
    const groups = boubas.map((b) => b.getSvgGroup());
    const size = groups.reduce((acc, g) => Math.max(acc, g.w, g.h), 0);
    const gs = groups
      .map(({ w, h, path, circles, box }) => {
        const scaleFactor = w < h ? size / h : size / w;
        const { dx, dy } = {
          dx: (size - w * scaleFactor) / 2 - box.l * scaleFactor,
          dy: (size - h * scaleFactor) / 2 - box.t * scaleFactor,
        };
        return `<g transform="translate(${dx}px, ${dy}px) scale(${scaleFactor})">${path} ${circles}</g>`;
      })
      .join("");
    const svg = `<svg style="mix-blend-mode: multiply">${gs}</svg>`;

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bouba.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const savePicture = () => {
    p5.push();
    const repeat_x = p5.ceil(width / noiseImage.width);
    const repeat_y = p5.ceil(height / noiseImage.height);
    p5.blendMode(p5.SCREEN);
    p5.tint(255, 0.2 * 255);
    for (let y = 0; y < repeat_y; y++) {
      for (let x = 0; x < repeat_x; x++) {
        p5.image(noiseImage, x * noiseImage.width, y * noiseImage.height);
      }
    }
    p5.pop();
    p5.saveCanvas(`bouba`, "png");
  };

  const toggle = () => {
    boubas.forEach((b) => b.toggleVersion());
    p5.redraw();
  };
};

new P5(sketch);
