import { BoubaCircle } from "./types";

// export declare function fxpreview(): void;
export declare const window: Window &
  typeof globalThis & {
    fxrand(): number;
    $fxhashFeatures: Record<string, string | number | boolean>;
    fxpreview(): void;
    fxhash: string;
  };

export function fxRandom(min?: number | any[], max?: number) {
  if (typeof min === "undefined") {
    return window.fxrand() as number;
  } else if (typeof max === "undefined") {
    if (min instanceof Array) {
      return min[Math.floor(window.fxrand() * min.length)];
    } else {
      return (window.fxrand() * min) as number;
    }
  } else if (typeof min === "number" && typeof max === "number") {
    const _min = min > max ? max : min;
    const _max = min > max ? min : max;
    return (window.fxrand() * (_max - _min) + _min) as number;
  }
}

export const noOverlaps = (list1: BoubaCircle[]) => {
  return list1.every((c1, i, list2) =>
    list2.every((c2, j) => i === j || !overlap(c1, c2))
  );
};

export const distance = (c1: BoubaCircle, c2: BoubaCircle) => {
  const { x: x1, y: y1 } = c1;
  const { x: x2, y: y2 } = c2;
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};

export const overlap = (c1: BoubaCircle, c2: BoubaCircle) => {
  return distance(c1, c2) < c1.r + c2.r;
};
