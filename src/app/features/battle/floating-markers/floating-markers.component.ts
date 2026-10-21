import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import type { FloatingMarker } from '../../../core/models/rpg.interfaces';

@Component({
  selector: 'ea-floating-markers',
  standalone: true,
  templateUrl: './floating-markers.component.html',
  styleUrl: './floating-markers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingMarkersComponent {
  readonly markers = input<FloatingMarker[]>([]);
  readonly markerDone = output<string>();

  onAnimationEnd(id: string): void {
    this.markerDone.emit(id);
  }

  offsetX(index: number): number {
    const pattern = [0, -8, 8, -12, 12];
    return pattern[index % pattern.length];
  }
}
