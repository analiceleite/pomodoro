import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, take, combineLatest, skip } from 'rxjs';

import { StopwatchService } from '../../services/stopwatch.service';
import { PictureInPictureService } from '../../services/picture-in-picture.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-stopwatch',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    CommonModule
  ],
  templateUrl: './stopwatch.html',
  styleUrl: './stopwatch.scss',
})
export class Stopwatch implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  @ViewChild('stopwatchContainer', { static: true }) stopwatchContainer!: ElementRef;

  // Observables from services
  stopwatchState$;
  progress$;
  formattedTime$;
  isInPiP$;

  // Make Math available in template
  Math = Math;

  // Current day name
  currentDayName: string = '';

  constructor(
    private stopwatchService: StopwatchService,
    private pipService: PictureInPictureService,
    private notificationService: NotificationService
  ) {
    this.stopwatchState$ = this.stopwatchService.state$;
    this.progress$ = this.stopwatchService.progress$;
    this.formattedTime$ = this.stopwatchService.formattedTime$;
    this.isInPiP$ = this.pipService.isInPictureInPicture$;
  }

  ngOnInit() {
    this.pipService.setActiveComponentType('stopwatch');
    this.setupSubscriptions();
    this.updateCurrentDayName();
    
    // Enviar dados iniciais para PiP se estiver aberto
    this.sendInitialDataToPiP();
    
    // Monitorar quando PiP é aberto e enviar dados atualizados
    this.isInPiP$
      .pipe(
        takeUntil(this.destroy$),
        skip(1) // Pular o primeiro valor (que é false)
      )
      .subscribe(isInPiP => {
        if (isInPiP) {
          console.log('🔔 PiP foi aberto - reenviando dados do Stopwatch');
          // Pequeno delay para garantir que o pip-window está pronto
          setTimeout(() => this.sendInitialDataToPiP(), 200);
        }
      });
  }

  ngAfterViewInit() {
    // Definir dimensões do container do cronômetro para PiP
    if (this.stopwatchContainer) {
      const rect = this.stopwatchContainer.nativeElement.getBoundingClientRect();
      this.pipService.setPiPDimensions(rect.width, rect.height);
      console.log(`📏 Container do cronômetro: ${rect.width}x${rect.height}`);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    // Request notification permission on component init
    this.notificationService.requestPermission()
      .pipe(takeUntil(this.destroy$))
      .subscribe(permission => {
        console.log('Notification permission:', permission);
      });

    // Setup Picture-in-Picture data sync
    combineLatest([
      this.stopwatchState$,
      this.formattedTime$,
      this.isInPiP$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([state, formattedTime, isInPiP]) => {
      if (isInPiP && this.pipService.isPiPActive()) {
        this.pipService.sendDataToPiP({
          isRunning: state.isRunning,
          formattedTime,
          elapsedSeconds: state.elapsedSeconds,
          cycleCount: 0
        });
      }
    });

    // Configure Picture-in-Picture action callback
    this.pipService.setActionCallback((action: string) => {
      console.log('Received action from PiP:', action);
      switch (action) {
        case 'toggle':
          this.stopwatchState$.pipe(take(1)).subscribe(state => {
            if (state.isRunning) {
              this.pause();
            } else if (state.isPaused) {
              this.resume();
            } else {
              this.start();
            }
          });
          break;
        case 'reset':
          this.reset();
          break;
        default:
          console.warn('Unknown action from PiP:', action);
      }
    });
  }

  // Message listener for PiP communication
  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent): void {
    if (event.data.source === 'pip' && event.data.action) {
      console.log('Processing PiP message:', event.data.action);
      this.pipService.processMessageFromPiP(event.data.action);
    }
  }

  // Stopwatch control methods
  start(): void {
    this.stopwatchService.start();
  }

  pause(): void {
    this.stopwatchService.pause();
  }

  resume(): void {
    this.stopwatchService.resume();
  }

  reset(): void {
    this.stopwatchService.reset();
  }

  // Enviar dados iniciais para PiP quando componente é ativado
  private sendInitialDataToPiP(): void {
    combineLatest([
      this.stopwatchState$,
      this.progress$,
      this.formattedTime$
    ]).pipe(take(1), takeUntil(this.destroy$)).subscribe(([state, progress, formattedTime]) => {
      this.pipService.sendDataToPiP({
        isRunning: state.isRunning,
        progress,
        formattedTime,
        elapsedSeconds: state.elapsedSeconds
      });
      console.log('📤 Dados iniciais do Stopwatch enviados para PiP');
    });
  }

  togglePlayPause(): void {
    this.stopwatchState$.pipe(take(1)).subscribe(state => {
      if (state.isRunning) {
        this.pause();
      } else if (state.isPaused) {
        this.resume();
      } else {
        this.start();
      }
    });
  }

  finishSession(): void {
    this.stopwatchState$.pipe(take(1)).subscribe(state => {
      if (state.elapsedSeconds === 0) {
        alert('Não há tempo decorrido para registrar. Inicie o cronômetro primeiro.');
        return;
      }
      this.stopwatchService.finishSession();
    });
  }

  // Helper methods for template
  getStopwatchColor(): string {
    return this.stopwatchService.getStopwatchColor();
  }

  getStopwatchIcon(): string {
    return this.stopwatchService.getStopwatchIcon();
  }

  getStopwatchTitle(): string {
    return this.stopwatchService.getStopwatchTitle();
  }

  // Format time display
  formatDuration(seconds: number): string {
    return this.stopwatchService.formatDuration(seconds);
  }

  private updateCurrentDayName(): void {
    const dayName = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
    this.currentDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  }

  // Picture-in-Picture methods
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
