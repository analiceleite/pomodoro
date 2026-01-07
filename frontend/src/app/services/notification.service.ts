import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface NotificationConfig {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private permissionStatus$ = new BehaviorSubject<NotificationPermission>('default');

    constructor() {
        this.initializePermissionStatus();
    }

    // Observables públicos
    get permission$(): Observable<NotificationPermission> {
        return this.permissionStatus$.asObservable();
    }

    get canNotify$(): Observable<boolean> {
        return this.permission$.pipe(
            map(permission => permission === 'granted' && this.checkNotificationSupport())
        );
    }

    // Métodos principais
    requestPermission(): Observable<NotificationPermission> {
        if (!this.checkNotificationSupport()) {
            return new Observable(subscriber => {
                subscriber.next('denied');
                subscriber.complete();
            });
        }

        if (Notification.permission !== 'default') {
            return new Observable(subscriber => {
                subscriber.next(Notification.permission);
                subscriber.complete();
            });
        }

        return from(Notification.requestPermission()).pipe(
            map(permission => {
                this.permissionStatus$.next(permission);
                return permission as NotificationPermission;
            }),
            catchError(() => {
                this.permissionStatus$.next('denied');
                return new Observable<NotificationPermission>(subscriber => {
                    subscriber.next('denied');
                    subscriber.complete();
                });
            })
        );
    }

    showPhaseNotification(phase: string): Observable<boolean> {
        return new Observable(subscriber => {
            if (!this.canShowNotifications()) {
                subscriber.next(false);
                subscriber.complete();
                return;
            }

            const config = this.getNotificationConfig(phase);

            try {
                const notification = new Notification(config.title, {
                    body: config.body,
                    icon: config.icon,
                    badge: config.badge || '/assets/pomodoro-badge.png',
                    silent: config.silent || false,
                    requireInteraction: config.requireInteraction || false,
                    tag: config.tag || 'pomodoro-phase'
                });

                // Setup event listeners
                notification.onshow = () => {
                    this.playNotificationSound();
                    subscriber.next(true);
                };

                notification.onerror = () => {
                    subscriber.next(false);
                    subscriber.complete();
                };

                notification.onclose = () => {
                    subscriber.complete();
                };

                // Auto close after 5 seconds
                setTimeout(() => {
                    notification.close();
                }, 5000);

            } catch (error) {
                console.error('Failed to show notification:', error);
                subscriber.next(false);
                subscriber.complete();
            }
        });
    }

    showCustomNotification(config: NotificationConfig): Observable<boolean> {
        return new Observable(subscriber => {
            if (!this.canShowNotifications()) {
                subscriber.next(false);
                subscriber.complete();
                return;
            }

            try {
                const notification = new Notification(config.title, {
                    body: config.body,
                    icon: config.icon,
                    badge: config.badge,
                    silent: config.silent || false,
                    requireInteraction: config.requireInteraction || false,
                    tag: config.tag || 'pomodoro-custom'
                });

                notification.onshow = () => subscriber.next(true);
                notification.onerror = () => {
                    subscriber.next(false);
                    subscriber.complete();
                };
                notification.onclose = () => subscriber.complete();

                // Auto close after 5 seconds if not requiring interaction
                if (!config.requireInteraction) {
                    setTimeout(() => notification.close(), 5000);
                }

            } catch (error) {
                subscriber.next(false);
                subscriber.complete();
            }
        });
    }

    // Métodos privados
    private initializePermissionStatus(): void {
        if (this.checkNotificationSupport()) {
            this.permissionStatus$.next(Notification.permission);
        }
    }

    private checkNotificationSupport(): boolean {
        return 'Notification' in window;
    }

    private canShowNotifications(): boolean {
        return this.checkNotificationSupport() && Notification.permission === 'granted';
    }

    private getNotificationConfig(phase: string): NotificationConfig {
        const configs: Record<string, NotificationConfig> = {
            work: {
                title: '🦭 Hora de Trabalhar!',
                body: 'Analice, foca por 25 minutos!',
                icon: '/assets/icons/seal.png',
                tag: 'pomodoro-work'
            },
            shortBreak: {
                title: '☕ Pausa Curta',
                body: 'Descanse por 5 minutos.',
                icon: '/assets/icons/coffee-break.png',
                tag: 'pomodoro-short-break'
            },
            longBreak: {
                title: '🏖️ Pausa Longa',
                body: 'Analice, você merece! Descanse por 15 minutos.',
                icon: '/assets/icons/coffee-break.png',
                tag: 'pomodoro-long-break'
            }
        };

        return configs[phase] || configs['work'];
    }

    private playNotificationSound(): void {
        if (typeof window === 'undefined') return;

        try {
            // Create audio context for better browser compatibility
            const audio = new Audio();
            audio.volume = 0.3;
            audio.preload = 'auto';

            // Try multiple sound sources
            const sounds = [
                '/assets/notification.mp3',
                '/assets/notification.wav',
                'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfBSuFz/LBESsFJXfH8N2QQAoUXrTp66hVFApGn+DyvmgfBSuFz/LB'  // Base64 beep sound
            ];

            audio.src = sounds[0];
            audio.play().catch(() => {
                // Try fallback beep sound
                audio.src = sounds[2];
                audio.play().catch(() => {
                    // Silent fail - audio not available
                });
            });
        } catch (error) {
            // Audio not supported
        }
    }
}