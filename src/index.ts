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

interface BoubaProps {
  n: number;
  boubaColor: string;
  dropsColor?: string;
}

type BoubaConfig = {
  circles: { x: number; y: number; r: number }[];
  angles: number[];
};

type BoubaCircle = {
  x: number;
  y: number;
  r: number;
};

const sketch = (p5: P5) => {
  let width = window.innerWidth;
  let height = window.innerHeight;

  const noOverlaps = (list1: BoubaCircle[]) => {
    return list1.every((c1, i, list2) =>
      list2.every((c2, j) => i === j || !overlap(c1, c2))
    );
  };

  const distance = (c1: BoubaCircle, c2: BoubaCircle) => {
    const { x: x1, y: y1, r: r1 } = c1;
    const { x: x2, y: y2, r: r2 } = c2;
    return p5.sqrt(p5.pow(x1 - x2, 2) + p5.pow(y1 - y2, 2));
  };

  const overlap = (c1: BoubaCircle, c2: BoubaCircle) => {
    return distance(c1, c2) < c1.r + c2.r;
  };

  let theme: "dark" | "light";

  let backgroundConfig: Record<typeof theme, string>;
  let blendConfig: Record<typeof theme, P5.BLEND_MODE>;

  class Bouba {
    tries = 0;
    maxTries = 100;
    correct = false;
    config: BoubaConfig = { circles: [], angles: [] };
    minR: number;
    maxR: number;
    version: "a" | "b" = "a";
    constructor(public props: BoubaProps) {
      [this.minR, this.maxR] = [
        Math.min(width, height) / props.n / 2,
        Math.min(width, height) / props.n,
      ];
      [this.minR, this.maxR] = [10, 20];
      this.config = this.createConfig();
    }

    toggleVersion() {
      this.version = this.version === "a" ? "b" : "a";
    }

    getBoundingBox() {
      const { circles } = this.config;
      const box = circles.reduce(
        (prev, curr) => ({
          l: Math.min(prev.l, curr.x - curr.r),
          t: Math.min(prev.t, curr.y - curr.r),
          r: Math.max(prev.r, curr.x + curr.r),
          b: Math.max(prev.b, curr.y + curr.r),
        }),
        { l: 0, t: 0, r: 0, b: 0 }
      );
      const w = p5.abs(box.l - box.r);
      const h = p5.abs(box.t - box.b);
      const dx = (width - w) / 2 + p5.abs(box.l);
      const dy = (height - h) / 2 + p5.abs(box.t);
      return { dx, dy };
    }

    addCountourVertex(
      { x, y }: { x: number; y: number },
      o: number,
      f: number,
      r: number,
      a0: number,
      pointIndex: number,
      nPoints: number,
      direction = 1
    ) {
      const dist = p5.abs(o - f) % p5.TAU;
      const delta = p5.map(
        pointIndex,
        0,
        nPoints - 1,
        0,
        f < o ? p5.TAU - dist : dist
      );
      const angle = a0 + direction * delta;
      const vx = x + r * p5.cos(angle);
      const vy = y + r * p5.sin(angle);
      p5.curveVertex(vx, vy);
    }

    addOddVertices(
      x: number,
      y: number,
      o: number,
      f: number,
      r: number,
      nPoints: number
    ) {
      for (let j = 0; j < nPoints; j++) {
        this.addCountourVertex({ x, y }, o, f, r, o, j, nPoints);
      }
    }

    addEvenVertices(
      x: number,
      y: number,
      o: number,
      f: number,
      r: number,
      nPoints: number
    ) {
      for (let j = 1; j < nPoints; j++) {
        this.addCountourVertex({ x, y }, o, f, r, f, j, nPoints, -1);
      }
    }

    fillShape({
      boubaColor,
      dropsColor,
    }: {
      boubaColor: string;
      dropsColor?: string;
    }) {
      const { circles, angles } = this.config;
      const nPoints = 50;
      p5.push();
      p5.fill(boubaColor);
      p5.noStroke();
      p5.beginShape();
      circles.forEach(({ x, y, r }, i, l) => {
        if (dropsColor) {
          p5.push();
          p5.fill(dropsColor);
          p5.circle(x, y, r);
          p5.pop();
        }
        const prev = p5.PI + angles.slice(i - 1)[0];
        const curr = angles[i];
        let [o, f] = i % 2 === 1 ? [prev, curr] : [curr, prev];
        if (i % 2 === 1) {
          if (this.version === "a") {
            this.addOddVertices(x, y, o, f, r, nPoints);
          } else {
            this.addEvenVertices(x, y, f, o, r, nPoints);
          }
        } else {
          if (this.version === "a") {
            this.addEvenVertices(x, y, o, f, r, nPoints);
          } else {
            this.addOddVertices(x, y, f, o, r, nPoints);
          }
        }
      });
      p5.endShape();
      p5.pop();
    }

    draw({ dx, dy }: { dx: number; dy: number } = { dx: 0, dy: 0 }) {
      const { correct, tries, maxTries } = this;
      if (correct) {
        const { dx: bx, dy: by } = this.getBoundingBox();
        p5.push();
        p5.translate(bx + dx, by + dy);
        this.fillShape(this.props);
        p5.pop();
        p5.noLoop();
      } else if (tries < maxTries) {
        p5.loop();
        p5.text("loading", 10, 30);
      } else {
        p5.text("try again", 10, 30);
        bouba1.drawNew();
      }

      p5.text(`frame: ${p5.frameCount}`, 10, 20);
    }

    createConfig() {
      const circles = [];
      const angles = [];

      const x0 = 0;
      const y0 = 0;
      const r0 = p5.int(fxRandom(this.minR, this.maxR));

      circles.push({ x: x0, y: y0, r: r0 });

      for (let i = 0; i < this.props.n - 2; i++) {
        let thisCircle: BoubaCircle;
        let angle;
        let circleTries = 0;
        do {
          const { x: _x, y: _y, r: _r } = circles[i];
          angle = fxRandom(0, p5.TAU);
          const r = p5.int(fxRandom(this.minR, this.maxR));
          const x = _x + (_r + r) * p5.cos(angle);
          const y = _y + (_r + r) * p5.sin(angle);
          thisCircle = { x, y, r };
          circleTries++;
        } while (
          circleTries < 400 &&
          circles.some((c) => overlap(c, thisCircle))
        );
        if (circles.some((c) => overlap(c, thisCircle))) {
          this.correct = false;
          setTimeout(() => {
            this.tries = this.tries + 1;
            this.config = this.createConfig();
          }, 0);
          return;
        }
        circles.push(thisCircle);
        angles.push(angle);
      }

      const { x: xn, y: yn, r: rn } = circles[this.props.n - 2];

      const hip = p5.sqrt(p5.pow(x0 - xn, 2) + p5.pow(y0 - yn, 2));
      const ah = (x0 - xn) / hip;

      const rc = (hip - rn - r0) / 2 + rn;
      const al = yn > y0 ? p5.acos(-ah) - p5.PI : p5.acos(ah);
      const xl = xn + rc * p5.cos(al);
      const yl = yn + rc * p5.sin(al);
      const rl = (hip - rn - r0) / 2;

      circles.push({ x: xl, y: yl, r: rl });

      if (noOverlaps(circles)) {
        this.correct = true;
        this.tries = 0;
      } else {
        this.correct = false;
        if (this.tries < this.maxTries) {
          setTimeout(() => {
            this.tries = this.tries + 1;
            this.config = this.createConfig();
          }, 0);
        } else {
          this.correct = false;
          this.drawNew();
          return;
        }
      }
      angles.push(al);
      angles.push(al);

      return { circles, angles };
    }

    drawNew() {
      this.tries = 0;
      this.config = this.createConfig();
    }
  }

  let bouba1: Bouba;
  let bouba2: Bouba;
  let bouba3: Bouba;

  const loadThemeConfigs = () => {
    backgroundConfig = {
      light: "#f4f4f4",
      dark: "#131313",
    };

    blendConfig = {
      light: p5.MULTIPLY,
      dark: p5.SCREEN,
    };
  };

  const setRandomValues = () => {
    theme = fxRandom(["light", "dark"]);
  };

  const drawComposition = () => {
    // const delta = (20 / 600) * width;
    // const inOrigin = p5.mouseX === 0 && p5.mouseY === 0;
    // const dx = inOrigin ? 0 : p5.map(p5.mouseX, 0, width, -delta, delta);
    // const dy = inOrigin ? 0 : p5.map(p5.mouseY, 0, height, -delta, delta);

    p5.background(backgroundConfig[theme]);
    p5.push();
    // p5.blendMode(blendConfig[theme]);
    bouba1.draw();
    // bouba1.draw({ dx, dy });
    // bouba2.draw({ dx: 10 + 2 * dx, dy: 2 * dy });
    // bouba3.draw({ dx: -5 + dx / 2, dy: 10 + dy / 2 });
    p5.pop();
  };

  let noiseImg: P5.Image;

  p5.preload = () => {
    noiseImg = p5.loadImage("./noise.png");
  };

  p5.setup = () => {
    const canvas = p5.createCanvas(width, height);
    canvas.parent("app");
    p5.colorMode(p5.HSB, 255);

    loadThemeConfigs();
    setRandomValues();
    bouba1 = new Bouba({
      n: p5.int(fxRandom(10, 50)),
      boubaColor: "#fb4885",
      dropsColor: "#fb4885",
    });
    // bouba2 = new Bouba({ n: 50, boubaColor: "#a9ffd4", dropsColor: "#a9ffd4" });
    // bouba3 = new Bouba({ n: 8, boubaColor: "#f8ff68", dropsColor: "#f8ff68" });
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
      p5.saveCanvas(`<title>-${fxhash}`, "png");
    }
    if (p5.key === "t") {
      bouba1.toggleVersion();
    }
    // if (["1", "2", "3"].includes(p5.key)) {
    //   const boubas = [bouba1, bouba2, bouba3];
    //   boubas[Number(p5.key) - 1].toggleVersion();
    //   // p5.background("#f4f4f4");
    //   boubas[Number(p5.key) - 1].draw();
    //   p5.loop();
    // }
  };

  p5.draw = () => {
    drawComposition();
  };
};

new P5(sketch);
