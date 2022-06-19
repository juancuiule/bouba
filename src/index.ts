import * as P5 from "p5";

declare function fxrand(): number;
declare const fxhash: string;
declare const window: Window &
  typeof globalThis & {
    $fxhashFeatures: Record<string, string | number | boolean>;
  };

function fxRandom(min?: number | any[], max?: number) {
  if (typeof min === "undefined") {
    return fxrand() as number;
  } else if (typeof max === "undefined") {
    if (min instanceof Array) {
      return min[Math.floor(fxrand() * min.length)];
    } else {
      return (fxrand() * min) as number;
    }
  } else if (typeof min === "number" && typeof max === "number") {
    const _min = min > max ? max : min;
    const _max = min > max ? min : max;
    return (fxrand() * (_max - _min) + _min) as number;
  }
}

const sketch = (p5: P5) => {
  let width = window.innerWidth;
  let height = window.innerHeight;

  const setRandomValues = () => {};

  const drawComposition = () => {};

  let noiseImg: P5.Image;

  p5.preload = () => {
    noiseImg = p5.loadImage("./noise.png");
  };

  p5.setup = () => {
    const canvas = p5.createCanvas(width, height);
    canvas.parent("app");
    setRandomValues();
  };

  p5.windowResized = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    p5.resizeCanvas(width, height);
  };

  p5.keyPressed = () => {
    if (p5.key === "s") {
      p5.push();
      const repeat_x = p5.ceil(width / noiseImg.width);
      const repeat_y = p5.ceil(height / noiseImg.height);
      p5.blendMode(p5.SCREEN);
      p5.tint(255, 0.2 * 255);
      for (let y = 0; y < repeat_y; y++) {
        for (let x = 0; x < repeat_x; x++) {
          p5.image(noiseImg, x * noiseImg.width, y * noiseImg.height);
        }
      }
      p5.pop();
      // p5.saveCanvas(`<title>-${fxhash}`, "png");
    }
  };

  p5.draw = () => {
    drawComposition();
  };
};

new P5(sketch);