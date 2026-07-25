export interface FloatingMarker {
  id: string;
  heroId: string;
  text: string;
  variant: 'damage' | 'heal' | 'crit' | 'miss' | 'buff' | 'debuff';
  createdAt: number;
}
