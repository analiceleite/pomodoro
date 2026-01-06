import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, combineLatest, take } from 'rxjs';

import { TimerService } from '../../services/timer.service';
import { PictureInPictureService } from '../../services/picture-in-picture.service';
import { NotificationService } from '../../services/notification.service';
import { PomodoroService } from '../../services/pomodoro.service';
import { ElectronWindowService } from '../../services/electron-window.service';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    CommonModule
  ],
  templateUrl: './timer.html',
  styleUrl: './timer.scss',
})

export class Timer implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observables from services
  timerState$;
  progress$;
  formattedTime$;
  isInPiP$;
  availableDisplays$;
  windowInfo$;
  isElectronApp: boolean = false;

  // Circle progress properties for UI
  radius: number = 130;
  circumference: number = 2 * Math.PI * this.radius;

  // Make Math available in template
  Math = Math;

  get currentDayName(): string {
    return new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
  }

  constructor(
    private timerService: TimerService,
    private pipService: PictureInPictureService,
    private notificationService: NotificationService,
    private pomodoroService: PomodoroService,
    private electronWindowService: ElectronWindowService
  ) {
    this.timerState$ = this.timerService.state$;
    this.progress$ = this.timerService.progress$;
    this.formattedTime$ = this.timerService.formattedTime$;
    this.isInPiP$ = this.pipService.isInPictureInPicture$;
    this.availableDisplays$ = this.electronWindowService.availableDisplays$;
    this.windowInfo$ = this.electronWindowService.windowInfo$;
    this.isElectronApp = this.electronWindowService.isRunningInElectron;
  }

  ngOnInit() {
    this.setupSubscriptions();
    
    // Inicializar monitoramento de janela se estiver no Electron
    if (this.isElectronApp) {
      this.electronWindowService.loadDisplayInfo();
      this.electronWindowService.loadWindowInfo();
      this.electronWindowService.startMonitoringDisplayChanges();
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
          this.pomodoroService.recordCycle().subscribe({
            next: (response) => console.log('Cycle recorded:', response),
            error: (error) => console.error('Failed to record cycle:', error)
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

  // Métodos para controle da janela do Electron
  async moveWindowToDisplay(displayIndex: number): Promise<void> {
    await this.electronWindowService.moveToDisplay(displayIndex);
  }

  async moveWindowToNextDisplay(): Promise<void> {
    await this.electronWindowService.moveToNextDisplay();
  }

  async toggleWindowMaximize(): Promise<void> {
    await this.electronWindowService.toggleMaximize();
  }

  async moveWindowToMain(): Promise<void> {
    await this.electronWindowService.moveToMainDisplay();
  }

  async moveWindowToSecondary(): Promise<void> {
    await this.electronWindowService.moveToSecondaryDisplay();
  }

  isWindowOnDisplay(displayIndex: number): boolean {
    return this.electronWindowService.isOnDisplay(displayIndex);
  }

  isWindowMaximized(): boolean {
    return this.electronWindowService.isMaximized();
  }

  getDisplayCount(): number {
    return this.electronWindowService.getDisplayCount();
  }

  // Métodos para controle de Picture-in-Picture
  movePiPToPrimary(): void {
    this.pipService.moveToMonitor('primary');
  }

  movePiPToSecondary(): void {
    this.pipService.moveToMonitor('secondary');
  }
}