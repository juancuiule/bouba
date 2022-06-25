import * as P5 from "p5";
import { BoubaCircle, BoubaConfig, BoubaProps, Point } from "./types";
import { fxRandom, noOverlaps, overlap } from "./utils";

export class Bouba {
  boubaGraphics: P5.Graphics;
  tries: number;
  maxTries: number;
  correct: boolean;
  version: "a" | "b";
  minR: number;
  maxR: number;
  config: BoubaConfig;
  p5: P5;
  svg: {
    shapeVertexs: Point[];
    circles: (BoubaCircle & { noFill?: true })[];
  };
  constructor(public props: BoubaProps, p5: P5) {
    this.p5 = p5;
    this.svg = { circles: [], shapeVertexs: [] };
    this.boubaGraphics = p5.createGraphics(3200, 3200);
    this.tries = 0;
    this.maxTries = 100;
    this.correct = false;
    this.version = "a";
    [this.minR, this.maxR] = [50, 100];
    this.config = { circles: [], angles: [] };
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
    const w = this.p5.abs(box.l - box.r);
    const h = this.p5.abs(box.t - box.b);
    const dx = (this.boubaGraphics.width - w) / 2 + this.p5.abs(box.l);
    const dy = (this.boubaGraphics.height - h) / 2 + this.p5.abs(box.t);
    this.boubaGraphics.resizeCanvas(Math.max(w, h), Math.max(w, h));
    return { dx, dy, w, h, box };
  }

  addCountourVertex(
    { x, y }: Point,
    o: number,
    f: number,
    r: number,
    a0: number,
    pointIndex: number,
    nPoints: number,
    direction = 1
  ) {
    const dist = this.p5.abs(o - f) % this.p5.TAU;
    const delta = this.p5.map(
      pointIndex,
      0,
      nPoints - 1,
      0,
      f < o ? this.p5.TAU - dist : dist
    );
    const angle = a0 + direction * delta;
    const vx = x + r * this.p5.cos(angle);
    const vy = y + r * this.p5.sin(angle);
    this.boubaGraphics.curveVertex(vx, vy);
    this.svg.shapeVertexs.push({ x: vx, y: vy });
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

  fillShape(color?: string) {
    const { circles, angles } = this.config;
    const nPoints = 50;
    this.boubaGraphics.push();
    this.boubaGraphics.fill(color);
    this.boubaGraphics.noStroke();
    this.boubaGraphics.beginShape();
    circles.forEach(({ x, y, r }, i, l) => {
      this.boubaGraphics.circle(x, y, r);
      this.svg.circles.push({ x, y, r: r / 2 });
      this.svg.circles.push({ x, y, r: r, noFill: true });
      const prev = this.p5.PI + angles.slice(i - 1)[0];
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
    this.boubaGraphics.endShape();
    this.boubaGraphics.pop();
  }

  draw({ dx, dy } = { dx: 0, dy: 0 }, color = this.props.color) {
    const { correct } = this;
    if (correct) {
      const { dx: bx, dy: by } = this.getBoundingBox();
      this.svg = { circles: [], shapeVertexs: [] };
      this.boubaGraphics.push();
      this.boubaGraphics.translate(bx + dx, by + dy);
      this.fillShape(color);
      this.boubaGraphics.pop();
    }
  }

  isLoading() {
    return !this.correct && this.tries < this.maxTries;
  }

  failed() {
    return !this.correct && this.tries >= this.maxTries;
  }

  createConfig() {
    const circles = [];
    const angles = [];

    const x0 = 0;
    const y0 = 0;
    const r0 = this.p5.int(fxRandom(this.minR, this.maxR));

    circles.push({ x: x0, y: y0, r: r0 });

    for (let i = 0; i < this.props.n - 2; i++) {
      let currentCircle: BoubaCircle;
      let angle;
      let circleTries = 0;
      do {
        const { x: _x, y: _y, r: _r } = circles[i];
        angle = fxRandom(0, this.p5.TAU);
        const r = this.p5.int(fxRandom(this.minR, this.maxR));
        const x = _x + (_r + r) * this.p5.cos(angle);
        const y = _y + (_r + r) * this.p5.sin(angle);
        currentCircle = { x, y, r };
        circleTries++;
      } while (
        circleTries < 400 &&
        circles.some((c) => overlap(c, currentCircle))
      );
      if (circles.some((c) => overlap(c, currentCircle))) {
        this.correct = false;
        setTimeout(() => {
          this.tries = this.tries + 1;
          this.config = this.createConfig();
        }, 0);
        return;
      }
      circles.push(currentCircle);
      angles.push(angle);
    }

    const { x: xn, y: yn, r: rn } = circles[this.props.n - 2];

    const hip = Math.sqrt(Math.pow(x0 - xn, 2) + Math.pow(y0 - yn, 2));
    const ah = (x0 - xn) / hip;

    const rc = (hip - rn - r0) / 2 + rn;
    const al = yn > y0 ? this.p5.acos(-ah) - this.p5.PI : this.p5.acos(ah);
    const xl = xn + rc * this.p5.cos(al);
    const yl = yn + rc * this.p5.sin(al);
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

  drawNew(color?: string) {
    this.tries = 0;
    if (color !== undefined) {
      this.props = { n: this.props.n, color };
    }
    this.config = this.createConfig();
  }

  getImage() {
    const { w, h } = this.getBoundingBox();
    this.boubaGraphics.resizeCanvas(Math.max(w, h), Math.max(w, h));
    this.draw();
    const img = this.boubaGraphics.get();
    return img;
  }

  getSvgGroup() {
    const { w, h, dx, dy, box } = this.getBoundingBox();
    const { x: fx, y: fy } = this.svg.shapeVertexs[0];
    const d = [
      `M${fx} ${fy}`,
      ...this.svg.shapeVertexs.map(({ x, y }) => `L${x} ${y}`),
      `L${fx} ${fy}`,
    ].join(" ");

    const path = `<path d="${d}" fill="${this.props.color}"/>`;
    const circles = this.svg.circles
      .filter((c) => !c.noFill)
      .map(
        ({ x, y, r, noFill }) =>
          `<circle style="mix-blend-mode: normal" r="${r}" cx="${x}" cy="${y}" fill="${
            noFill ? "none" : this.props.color
          }"/>`
      )
      .join("");
    return { path, circles, w, h, box };
  }
}
