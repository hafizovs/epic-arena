import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { I18nService } from '../../core/i18n.service';
import { UiStore } from '../../core/ui/ui.store';

@Component({
  selector: 'ea-help-overlay',
  standalone: true,
  templateUrl: './help-overlay.component.html',
  styleUrl: './help-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpOverlayComponent {
  readonly i18n = inject(I18nService);
  readonly ui = inject(UiStore);
  private readonly closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');

  readonly hotkeyKeys = [
    'help.key.space',
    'help.key.n',
    'help.key.r',
    'help.key.enter',
    'help.key.reset',
    'help.key.t',
    'help.key.g',
    'help.key.h',
    'help.key.esc',
  ] as const;

  constructor() {
    effect(() => {
      if (this.ui.helpOpen()) {
        queueMicrotask(() => this.closeBtn()?.nativeElement.focus());
      }
    });
  }

  close(): void {
    this.ui.closeHelp();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
