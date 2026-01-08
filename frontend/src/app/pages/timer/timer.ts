import { Component, OnInit, OnDestroy, HostListener, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest, take } from 'rxjs';

import { TimerService } from '../../services/timer.service';
import { PictureInPictureService } from '../../services/picture-in-picture.service';
import { NotificationService } from '../../services/notification.service';
import { PomodoroService } from '../../services/pomodoro.service';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    CommonModule,
    FormsModule
  ],
  templateUrl: './timer.html',
  styleUrl: './timer.scss',
})

export class Timer implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  @ViewChild('timerContainer', { static: true }) timerContainer!: ElementRef;

  // Observables from services
  timerState$;
  progress$;
  formattedTime$;
  isInPiP$;

  // Circle progress properties for UI
  radius: number = 130;
  circumference: number = 2 * Math.PI * this.radius;

  // Work duration configuration
  availableWorkDurations: number[] = [];
  currentWorkDuration: number = 25;
  showCustomInput: boolean = false;
  customDurationInput: number | null = null;

  // Make Math available in template
  Math = Math;

  get currentDayName(): string {
    return new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
  }

  constructor(
    private timerService: TimerService,
    private pipService: PictureInPictureService,
    private notificationService: NotificationService,
    private pomodoroService: PomodoroService
  ) {
    this.timerState$ = this.timerService.state$;
    this.progress$ = this.timerService.progress$;
    this.formattedTime$ = this.timerService.formattedTime$;
    this.isInPiP$ = this.pipService.isInPictureInPicture$;
  }

  ngOnInit() {
    this.setupSubscriptions();
    this.loadWorkDurationSettings();
  }

  ngAfterViewInit() {
    // Definir dimensões da janela PiP baseadas no container do timer
    if (this.timerContainer) {
      const rect = this.timerContainer.nativeElement.getBoundingClientRect();
      this.pipService.setPiPDimensions(rect.width, rect.height);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    // Subscribe to phase changes for notifications and recording cycles
    this.timerService.phaseComplete$
      .pipe(takeUntil(this.destroy$))
      .subscribe(phase => {
        console.log('Phase completed:', phase);

        // Record cycle when work phase completes
        if (phase === 'shortBreak' || phase === 'longBreak') {
          console.log(`🎯 Fase ${phase} completada - registrando ciclo no backend`);
          this.pomodoroService.recordCycle().subscribe({
            next: (response) => {
              console.log('✅ Ciclo registrado com sucesso no backend:', response);
            },
            error: (error) => {
              console.error('❌ Erro ao registrar ciclo no backend:', error);
            }
          });
        }

        // Show notification for phase change
        this.notificationService.showPhaseNotification(phase)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (success) => {
              if (!success) {
                console.log('Notification not shown - permission denied or not supported');
              }
            },
            error: (error) => console.error('Notification error:', error)
          });
      });

    // Subscribe to data clearing events to reset timer completely
    this.pomodoroService.onDataCleared
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('🔄 Dados limpos - resetando timer completamente');
        this.notificationService.resetNotificationState();
        this.timerService.completeReset();
      });

    // Request notification permission on component init
    this.notificationService.requestPermission()
      .pipe(takeUntil(this.destroy$))
      .subscribe(permission => {
        console.log('Notification permission:', permission);
      });

    // Setup Picture-in-Picture data sync
    combineLatest([
      this.timerState$,
      this.progress$,
      this.formattedTime$,
      this.isInPiP$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([state, progress, formattedTime, isInPiP]) => {
      if (isInPiP && this.pipService.isPiPActive()) {
        this.pipService.sendDataToPiP({
          ...state,
          progress,
          formattedTime
        });
      }
    });

    // Configure Picture-in-Picture action callback
    this.pipService.setActionCallback((action: string) => {
      console.log('Received action from PiP:', action);
      switch (action) {
        case 'toggle':
          this.toggleTimer();
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

  // Timer control methods
  toggleTimer(): void {
    this.timerState$.pipe(take(1)).subscribe(state => {
      if (state.isRunning) {
        this.pause();
      } else {
        this.start();
      }
    });
  }

  start(): void {
    this.timerService.start();
  }

  pause(): void {
    this.timerService.pause();
  }

  reset(): void {
    this.timerService.reset();
  }

  // Helper methods for template
  getPhaseColor(phase: string): string {
    return this.timerService.getPhaseColor(phase);
  }

  getPhaseIcon(phase: string): string {
    return this.timerService.getPhaseIcon(phase);
  }

  getPhaseTitle(phase: string): string {
    return this.timerService.getPhaseTitle(phase);
  }

  // Get stroke dash offset for circular progress
  getStrokeDashOffset(progress: number): number {
    return this.circumference - (progress / 100) * this.circumference;
  }

  // Work duration configuration methods
  private loadWorkDurationSettings(): void {
    this.availableWorkDurations = this.timerService.getAvailableWorkDurations();
    this.currentWorkDuration = this.timerService.getCurrentWorkDurationInMinutes();
  }

  setWorkDuration(minutes: number): void {
    this.timerState$.pipe(take(1)).subscribe(state => {
      if (state.isRunning) {
        alert('Não é possível alterar a duração durante um timer ativo. Pause ou resete o timer primeiro.');
        return;
      }
      this.timerService.setWorkDuration(minutes);
      this.currentWorkDuration = minutes;
      this.showCustomInput = false;
      this.customDurationInput = null;
      console.log(`Work duration changed to ${minutes} minutes`);
    });
  }

  toggleCustomInput(): void {
    this.timerState$.pipe(take(1)).subscribe(state => {
      if (state.isRunning) {
        alert('Não é possível alterar a duração durante um timer ativo. Pause ou resete o timer primeiro.');
        return;
      }
      this.showCustomInput = !this.showCustomInput;
      if (this.showCustomInput) {
        this.customDurationInput = this.currentWorkDuration;
      }
    });
  }

  applyCustomDuration(): void {
    if (this.customDurationInput && this.customDurationInput >= 1 && this.customDurationInput <= 120) {
      this.setWorkDuration(this.customDurationInput);
    } else {
      alert('Por favor, insira um valor entre 1 e 120 minutos.');
    }
  }

  isPresetDuration(minutes: number): boolean {
    return this.timerService.isPresetDuration(minutes);
  }

  getWorkDurationLabel(minutes: number): string {
    return minutes === 60 ? '1h' : `${minutes}min`;
  }

  // Adicione estas funções ao seu componente TypeScript

  /**
   * Formata a duração em minutos para exibição legível
   * Se > 60 minutos, mostra em horas
   */
  formatDurationLabel(minutes: number): string {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      if (remainingMinutes === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${minutes} minutos`;
  }

  formatTotalTime(totalMinutes: number): string {
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (minutes === 0) {
        return `${hours}h`;
      }
      return `${hours}h${minutes}m`;
    }
    return `${totalMinutes}min`;
  }

  formatTimerDisplay(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      // Formato: HH:MM:SS
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      // Formato: MM:SS
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }

}