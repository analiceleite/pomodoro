import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { PictureInPictureService } from '../../services/picture-in-picture.service';
import { Subject, takeUntil, take } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    RouterModule,
    CommonModule
  ],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss'
})
export class Toolbar implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isInPiP$;

  constructor(private pipService: PictureInPictureService) {
    this.isInPiP$ = this.pipService.isInPictureInPicture$;
  }

  ngOnInit() {
    // Setup inicial se necessário
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  togglePictureInPicture(): void {
    this.isInPiP$.pipe(take(1)).subscribe(isInPiP => {
      if (isInPiP) {
        this.exitPictureInPicture();
      } else {
        this.enterPictureInPicture();
      }
    });
  }

  async enterPictureInPicture(): Promise<void> {
    try {
      await this.pipService.enterPictureInPicture();
    } catch (error) {
      console.error('Failed to enter Picture-in-Picture mode:', error);
    }
  }

  exitPictureInPicture(): void {
    this.pipService.exitPictureInPicture();
  }
}