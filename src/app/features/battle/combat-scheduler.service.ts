import { Injectable, inject, signal } from '@angular/core';
import { BASE_STEP_DELAY_MS } from '../../core/constants/battle.constants';
import { BattleStore } from './battle.store';
import { BattleEngineService } from './battle-engine.service';

@Injectable({ providedIn: 'root' })
export class CombatSchedulerService {
  private readonly engine = inject(BattleEngineService);
  private readonly battleStore = inject(BattleStore);

  readonly playing = signal(false);
  private generation = 0;
  private loopPromise: Promise<void> | null = null;

  private delay(ms: number, token: number): Promise<boolean> {
    return new Promise((resolve) => {
      window.setTimeout(() => {
        resolve(token === this.generation);
      }, ms);
    });
  }

  async play(): Promise<void> {
    const phase = this.battleStore.phase();
    if (phase === 'finished') {
      return;
    }
    if (phase === 'setup' || phase === 'paused') {
      this.engine.start();
    }
    if (this.playing()) {
      return;
    }
    this.playing.set(true);
    this.generation += 1;
    const token = this.generation;
    this.loopPromise = this.runLoop(token);
    await this.loopPromise;
  }

  pause(): void {
    this.playing.set(false);
    this.generation += 1;
    this.engine.pause();
  }

  step(): void {
    const phase = this.battleStore.phase();
    if (phase === 'setup') {
      this.engine.start();
      this.engine.pause();
    }
    if (this.battleStore.phase() === 'finished') {
      return;
    }
    if (this.battleStore.phase() === 'running') {
      this.pause();
    }
    if (this.battleStore.phase() === 'setup') {
      return;
    }
    this.engine.advanceOneStep();
  }

  setSpeed(speed: number): void {
    this.engine.setSpeed(speed);
  }

  stop(): void {
    this.playing.set(false);
    this.generation += 1;
  }

  private async runLoop(token: number): Promise<void> {
    while (this.playing() && token === this.generation) {
      if (this.battleStore.phase() === 'finished') {
        this.playing.set(false);
        break;
      }
      if (this.battleStore.phase() !== 'running') {
        this.engine.resume();
      }
      this.engine.advanceOneStep();
      if (this.battleStore.phase() === 'finished') {
        this.playing.set(false);
        break;
      }
      const speed = this.battleStore.animationSpeed();
      const delayMs = BASE_STEP_DELAY_MS / speed;
      const ok = await this.delay(delayMs, token);
      if (!ok) {
        break;
      }
    }
  }
}
