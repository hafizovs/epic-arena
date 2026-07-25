export function percentOf(value: number, percent: number): number {
  return (value * percent) / 100;
}

export function ratio(current: number, max: number): number {
  if (max <= 0) {
    return 0;
  }
  return current / max;
}
