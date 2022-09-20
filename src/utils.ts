export function getRandom(range: number[]): number {
    return Math.floor(Math.random() * range[1]) + range[0];
  }