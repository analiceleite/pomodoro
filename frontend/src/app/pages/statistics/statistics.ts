import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { PomodoroService } from '../../services/pomodoro.service';

interface Stat {
  date: string;
  hours: number;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss',
})
export class Statistics implements OnInit {
  stats: Stat[] = [];
  totalHours: number = 0;
  todayHours: number = 0;
  averageHours: number = 0;
  streak: number = 0;
  maxHours: number = 8; // Meta diária em horas

  constructor(private pomodoroService: PomodoroService) {}

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.pomodoroService.getStats().subscribe(data => {
      this.stats = data;
      this.calculateSummary();
    });
  }

  calculateSummary() {
    // Total de horas
    this.totalHours = this.stats.reduce((sum, stat) => sum + stat.hours, 0);

    // Horas de hoje
    const today = new Date().toISOString().split('T')[0];
    const todayStat = this.stats.find(stat => stat.date === today);
    this.todayHours = todayStat ? todayStat.hours : 0;

    // Média diária
    this.averageHours = this.stats.length > 0 ? this.totalHours / this.stats.length : 0;

    // Calcular streak (dias seguidos)
    this.calculateStreak();

    // Calcular horas máximas para o gráfico
    if (this.stats.length > 0) {
      const maxStatHours = Math.max(...this.stats.map(s => s.hours));
      this.maxHours = Math.max(maxStatHours, 8);
    }
  }

  calculateStreak() {
    if (this.stats.length === 0) {
      this.streak = 0;
      return;
    }

    let currentStreak = 0;
    const today = new Date();
    
    // Ordenar stats por data decrescente
    const sortedStats = [...this.stats].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (let i = 0; i < sortedStats.length; i++) {
      const statDate = new Date(sortedStats[i].date);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      // Verificar se a data corresponde ao dia esperado
      if (statDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
        if (sortedStats[i].hours > 0) {
          currentStreak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    this.streak = currentStreak;
  }

  // Verificar se a data é hoje
  isToday(date: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  }

  // Formatar data para exibição
  formatDate(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (this.isToday(dateString)) {
      return 'Hoje';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Ontem';
    }

    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      day: '2-digit', 
      month: 'short' 
    };
    return date.toLocaleDateString('pt-BR', options);
  }

  // Obter nome do dia da semana
  getDayName(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { weekday: 'short' };
    return date.toLocaleDateString('pt-BR', options);
  }

  // Calcular porcentagem de progresso
  getProgressPercentage(hours: number): number {
    return Math.min((hours / this.maxHours) * 100, 100);
  }

  // Obter cor baseada nas horas
  getProgressColor(hours: number): string {
    const percentage = (hours / this.maxHours) * 100;
    
    if (percentage >= 100) {
      return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
    } else if (percentage >= 75) {
      return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    } else if (percentage >= 50) {
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    } else if (percentage >= 25) {
      return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    } else {
      return 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)';
    }
  }

  // Calcular altura da barra no gráfico
  getChartHeight(hours: number): number {
    return Math.min((hours / this.maxHours) * 100, 100);
  }

  // Calcular número de ciclos (25min por ciclo)
  calculateCycles(hours: number): number {
    return Math.round((hours * 60) / 25);
  }
}