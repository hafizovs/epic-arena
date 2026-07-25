export abstract class RandomSource {
  abstract next(): number;
}

export class Mulberry32RandomSource extends RandomSource {
  private state: number;

  constructor(seed: number) {
    super();
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export function createMulberry32(seed: number): RandomSource {
  return new Mulberry32RandomSource(seed);
}

export class SequenceRandomSource extends RandomSource {
  private index = 0;

  constructor(private readonly sequence: number[]) {
    super();
  }

  next(): number {
    if (this.index >= this.sequence.length) {
      return 0;
    }
    const value = this.sequence[this.index];
    this.index += 1;
    return value;
  }
}
