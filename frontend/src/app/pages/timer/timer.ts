import { Component, OnInit, OnDestroy, HostListener, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest, take, skip } from 'rxjs';

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
    MatSelectModule,
    MatInputModule,
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
  workDurationOptions: number[] = []; // Opções de 5 em 5 minutos para o select
  currentWorkDuration: number = 25;
  showDurationSelector: boolean = false;
  customDurationInput: number | null = null;

  // Custom presets management
  customPresets: number[] = [];
  showPresetsManager: boolean = false;
  newPresetInput: number | null = null;

  // Today's stats
  todayStats: any = { cycles: 0, totalMinutes: 0, hours: 0 };

  // Make Math available in template
  Math = Math;

  get currentDayName(): string {
    const dayName = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
    return dayName.charAt(0).toUpperCase() + dayName.slice(1);
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
    this.pipService.setActiveComponentType('timer');
    this.setupSubscriptions();
    this.loadWorkDurationSettings();
    this.loadCustomPresets();
    this.loadTodayStats();
    
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
          console.log('🔔 PiP foi aberto - reenviando dados do Timer');
          // Pequeno delay para garantir que o pip-window está pronto
          setTimeout(() => this.sendInitialDataToPiP(), 200);
        }
      });
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
    // Subscribe to phase changes for notifications
    this.timerService.phaseComplete$
      .pipe(takeUntil(this.destroy$))
      .subscribe(phase => {
        console.log('Phase completed:', phase);

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

    // Subscribe to cycle completion to update stats in real-time
    this.pomodoroService.onCycleCompleted
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('🔄 Ciclo completado - atualizando estatísticas em tempo real');
        this.loadTodayStats();
      });

    // Subscribe to data clearing events to reset timer completely
    this.pomodoroService.onDataCleared
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('🔄 Dados limpos - resetando timer completamente');
        this.notificationService.resetNotificationState();
        this.timerService.completeReset();
        this.loadTodayStats(); 
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
        case 'skipBreak':
          this.skipBreak();
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

  // Enviar dados iniciais para PiP quando componente é ativado
  private sendInitialDataToPiP(): void {
    combineLatest([
      this.timerState$,
      this.progress$,
      this.formattedTime$
    ]).pipe(take(1), takeUntil(this.destroy$)).subscribe(([state, progress, formattedTime]) => {
      this.pipService.sendDataToPiP({
        currentPhase: state.currentPhase,
        timeLeft: state.timeLeft,
        isRunning: state.isRunning,
        progress,
        formattedTime,
        cycles: this.todayStats.cycles || 0
      });
      console.log('📤 Dados iniciais do Timer enviados para PiP');
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

  skipBreak(): void {
    this.timerService.skipBreak();
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

  setWorkDuration(minutes: number): void {
    this.timerState$.pipe(take(1)).subscribe(state => {
      if (state.isRunning) {
        alert('Não é possível alterar a duração durante um timer ativo. Pause ou resete o timer primeiro.');
        return;
      }
      this.timerService.setWorkDuration(minutes);
      this.currentWorkDuration = minutes;
      this.showDurationSelector = false;
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
      this.showDurationSelector = !this.showDurationSelector;
      if (this.showDurationSelector) {
        this.customDurationInput = this.currentWorkDuration;
      }
    });
  }

  onDurationSelectChange(value: number): void {
    this.customDurationInput = value;
  }

  onDurationInputChange(value: number): void {
    this.customDurationInput = value;
  }

  applyCustomDuration(): void {
    if (this.customDurationInput && this.customDurationInput >= 1 && this.customDurationInput <= 120) {
      this.setWorkDuration(this.customDurationInput);
      this.showDurationSelector = false;
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
    const roundedMinutes = Math.round(totalMinutes * 100) / 100;
    
    if (roundedMinutes >= 60) {
      const hours = Math.floor(roundedMinutes / 60);
      const minutes = Math.round(roundedMinutes % 60);

      if (minutes === 0) {
        return `${hours}h`;
      }
      return `${hours}h${minutes}m`;
    }
    
    // Para valores menores que 1 minuto, mostrar em segundos
    if (roundedMinutes < 1) {
      const seconds = Math.round(roundedMinutes * 60);
      return `${seconds}s`;
    }
    
    // Mostrar apenas parte inteira dos minutos
    const wholeMinutes = Math.round(roundedMinutes);
    return `${wholeMinutes}min`;
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

  private loadTodayStats(): void {
    this.pomodoroService.getTodayStats().subscribe({
      next: (stats) => {
        this.todayStats = stats;
        console.log('📈 Estatísticas de hoje carregadas:', stats);
      },
      error: (error) => {
        console.error('❌ Erro ao carregar estatísticas:', error);
      }
    });
  }

  private loadWorkDurationSettings(): void {
    this.availableWorkDurations = this.timerService.getAvailableWorkDurations();
    this.currentWorkDuration = this.timerService.getCurrentWorkDurationInMinutes();
    this.generateWorkDurationOptions();
  }

  private generateWorkDurationOptions(): void {
    // Gerar opções de 5 em 5 minutos, de 5 a 120 minutos
    this.workDurationOptions = [];
    for (let i = 5; i <= 120; i += 5) {
      this.workDurationOptions.push(i);
    }
    console.log('📋 Opções de duração geradas:', this.workDurationOptions);
  }

  // ========== Custom Presets Management ==========
  private loadCustomPresets(): void {
    try {
      const saved = localStorage.getItem('pomodoro_presets');
      if (saved) {
        this.customPresets = JSON.parse(saved);
        this.customPresets.sort((a, b) => a - b); // Ordenar ascendente
        console.log('📦 Presets customizados carregados:', this.customPresets);
      } else {
        // Presets padrão
        this.customPresets = [15, 30];
        this.saveCustomPresets();
      }
    } catch (error) {
      console.error('❌ Erro ao carregar presets customizados:', error);
      this.customPresets = [15, 30];
    }
  }

  private saveCustomPresets(): void {
    try {
      localStorage.setItem('pomodoro_presets', JSON.stringify(this.customPresets));
      this.customPresets.sort((a, b) => a - b);
      console.log('💾 Presets customizados salvos:', this.customPresets);
    } catch (error) {
      console.error('❌ Erro ao salvar presets customizados:', error);
    }
  }

  togglePresetsManager(): void {
    this.timerState$.pipe(take(1)).subscribe(state => {
      if (state.isRunning) {
        alert('Não é possível gerenciar presets durante um timer ativo. Pause ou resete o timer primeiro.');
        return;
      }
      this.showPresetsManager = !this.showPresetsManager;
      this.newPresetInput = null;
    });
  }

  addPreset(): void {
    if (!this.newPresetInput || this.newPresetInput < 1 || this.newPresetInput > 120) {
      alert('Por favor, insira um valor entre 1 e 120 minutos.');
      return;
    }

    // Verificar se já existe
    if (this.customPresets.includes(this.newPresetInput)) {
      alert('Este preset já existe!');
      return;
    }

    this.customPresets.push(this.newPresetInput);
    this.saveCustomPresets();
    this.newPresetInput = null;
    console.log('✅ Novo preset adicionado:', this.customPresets);
  }

  removePreset(preset: number): void {
    const index = this.customPresets.indexOf(preset);
    if (index >= 0) {
      this.customPresets.splice(index, 1);
      this.saveCustomPresets();
      console.log('🗑️ Preset removido:', this.customPresets);
    }
  }

  applyPreset(preset: number): void {
    this.timerState$.pipe(take(1)).subscribe(state => {
      if (state.isRunning) {
        alert('Não é possível alterar a duração durante um timer ativo. Pause ou resete o timer primeiro.');
        return;
      }
      this.setWorkDuration(preset);
      this.showPresetsManager = false;
      console.log('⏱️ Preset aplicado:', preset);
    });
  }

}