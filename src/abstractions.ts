export type Coord = readonly [x: number, y: number];
export type Size = readonly [w: number, h: number];
export type Rect = readonly [...Coord, ...Size];

export interface EdgeColor {
    lighten: string;
    darken: string;
}
