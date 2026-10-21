import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameDirectorComponent } from './core/layout/game-director/game-director.component';

@Component({
  selector: 'ea-root',
  standalone: true,
  imports: [GameDirectorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
