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
    private lastNotifiedPhase: string = ''; // Track last notified phase globally

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
            // If permission not requested yet, request it first
            if (Notification.permission === 'default' && this.checkNotificationSupport()) {
                console.log('📢 Notification permission not decided, requesting permission...');
                Notification.requestPermission().then(permission => {
                    this.permissionStatus$.next(permission as NotificationPermission);
                    if (permission !== 'granted') {
                        console.log('📢 Notification permission denied or dismissed');
                        subscriber.next(false);
                        subscriber.complete();
                        return;
                    }
                    // After permission granted, try to show notification
                    this.doShowPhaseNotification(phase, subscriber);
                }).catch(err => {
                    console.error('Error requesting notification permission:', err);
                    subscriber.next(false);
                    subscriber.complete();
                });
                return;
            }

            // Check if this is the same phase as last notification (prevent duplicates)
            if (phase === this.lastNotifiedPhase) {
                console.log('📢 Skipping notification - already notified for phase:', phase);
                subscriber.next(false);
                subscriber.complete();
                return;
            }

            if (!this.canShowNotifications()) {
                console.log('📢 Cannot show notification - permission not granted or not supported');
                subscriber.next(false);
                subscriber.complete();
                return;
            }

            // Proceed to show notification
            this.doShowPhaseNotification(phase, subscriber);
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
                icon: './assets/icons/seal.png',
                tag: 'pomodoro-work'
            },
            shortBreak: {
                title: '☕ Pausa Curta',
                body: 'Descanse por 5 minutos.',
                icon: './assets/icons/coffee-break.png',
                tag: 'pomodoro-short-break'
            },
            longBreak: {
                title: '🏖️ Pausa Longa',
                body: 'Analice, você merece! Descanse por 15 minutos.',
                icon: './assets/icons/coffee-break.png',
                tag: 'pomodoro-long-break'
            }
        };

        return configs[phase] || configs['work'];
    }

    private playNotificationSound(): void {
        if (typeof window === 'undefined') return;

        try {
            const audio = new Audio();
            audio.volume = 0.3;
            audio.preload = 'auto';
            audio.src = './assets/sounds/notification.mp3';
            audio.play();

        } catch (error) {
            // Audio not supported
        }
    }

    // Extracted to separate function to keep showPhaseNotification readable
    private doShowPhaseNotification(phase: string, subscriber: any) {
        // Update last notified phase
        this.lastNotifiedPhase = phase;

        const config = this.getNotificationConfig(phase);

        try {
            // If running inside Electron, prefer native notification via main process
            if ((window as any)?.electronAPI?.showNotification) {
                const payload = { title: config.title, body: config.body, silent: config.silent || false, icon: config.icon };
                (window as any).electronAPI.showNotification(payload).then((ok: boolean) => {
                    if (ok) {
                        // Play sound in renderer to keep behavior consistent
                        this.playNotificationSound();
                        subscriber.next(true);
                    } else {
                        // Fallback to browser Notification if native failed
                        try {
                            const n = new Notification(config.title, { body: config.body, icon: config.icon, tag: config.tag || 'pomodoro-phase' });
                            n.onshow = () => { this.playNotificationSound(); subscriber.next(true); };
                            n.onerror = () => { subscriber.next(false); subscriber.complete(); };
                            n.onclose = () => subscriber.complete();
                            setTimeout(() => n.close(), 5000);
                        } catch (err) {
                            console.error('Failed to show fallback browser notification:', err);
                            subscriber.next(false);
                            subscriber.complete();
                        }
                    }
                }).catch((err: any) => {
                    console.error('Error invoking native notification:', err);
                    subscriber.next(false);
                    subscriber.complete();
                });
                return;
            }

            // Browser path
            const notification = new Notification(config.title, {
                body: config.body,
                icon: config.icon,
                badge: config.badge,
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
    }

    // Reset notification tracking (called when data is cleared)
    resetNotificationState(): void {
        this.lastNotifiedPhase = '';
        console.log('🔄 Notification state reset');
    }
}