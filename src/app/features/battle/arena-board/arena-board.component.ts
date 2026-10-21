import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { HeroCardComponent } from '../../roster/hero-card/hero-card.component';
import { I18nService } from '../../../core/i18n.service';
import { BattleStore } from '../battle.store';

@Component({
  selector: 'ea-arena-board',
  standalone: true,
  imports: [HeroCardComponent],
  templateUrl: './arena-board.component.html',
  styleUrl: './arena-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaBoardComponent {
  readonly battle = inject(BattleStore);
  readonly i18n = inject(I18nService);
}
