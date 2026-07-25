import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { LOG_AUTO_SCROLL_THRESHOLD_PX } from '../../core/constants/ui.constants';
import { I18nService } from '../../services/i18n.service';
import { BattleStore } from '../../state/battle.store';

@Component({
  selector: 'ea-combat-log',
  standalone: true,
  templateUrl: './combat-log.component.html',
  styleUrl: './combat-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatLogComponent implements AfterViewChecked {
  readonly battle = inject(BattleStore);
  readonly i18n = inject(I18nService);

  @ViewChild('scroller') scroller?: ElementRef<HTMLDivElement>;

  private pinnedToBottom = true;
  private lastCount = 0;

  onScroll(): void {
    const el = this.scroller?.nativeElement;
    if (!el) {
      return;
    }
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    this.pinnedToBottom = distance <= LOG_AUTO_SCROLL_THRESHOLD_PX;
  }

  ngAfterViewChecked(): void {
    const count = this.battle.events().length;
    if (count !== this.lastCount) {
      this.lastCount = count;
      if (this.pinnedToBottom) {
        const el = this.scroller?.nativeElement;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      }
    }
  }
}
