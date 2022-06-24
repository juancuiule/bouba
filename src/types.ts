export interface BoubaProps {
  n: number;
  color: string;
}

export type BoubaConfig = {
  circles: { x: number; y: number; r: number }[];
  angles: number[];
};

export type BoubaCircle = {
  x: number;
  y: number;
  r: number;
};

export type Point = {
  x: number;
  y: number
};
