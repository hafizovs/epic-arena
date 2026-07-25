import type { ActionIntent, Hero } from '../../models/rpg.interfaces';
import { chooseArcherAction } from './archer-ai';
import { chooseMageAction } from './mage-ai';
import { choosePriestAction } from './priest-ai';
import { chooseWarriorAction } from './warrior-ai';

export interface AiBattleView {
  actor: Hero;
  allies: Hero[];
  enemies: Hero[];
  allHeroes: Hero[];
  round: number;
}

export function chooseAction(view: AiBattleView): ActionIntent {
  switch (view.actor.classId) {
    case 'warrior':
      return chooseWarriorAction(view);
    case 'mage':
      return chooseMageAction(view);
    case 'archer':
      return chooseArcherAction(view);
    case 'priest':
      return choosePriestAction(view);
    default:
      return {
        actorHeroId: view.actor.id,
        skillId: view.actor.skills.find((s) => s.isBasicAttack)!.id,
        targetHeroIds: [],
      };
  }
}
