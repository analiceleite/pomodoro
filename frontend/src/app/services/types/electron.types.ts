// types/electron.types.ts
export interface ElectronAPI {
  // Always on top
  toggleAlwaysOnTop: () => Promise<boolean>;
  getAlwaysOnTopStatus: () => Promise<boolean>;
  setAlwaysOnTop: (enable: boolean) => Promise<boolean>;
  
  // Picture-in-Picture
  openPiP: () => Promise<boolean>;
  closePiP: () => Promise<boolean>;
  pipAction: (action: string) => Promise<boolean>;
  sendDataToPiP: (data: any) => Promise<boolean>;
  
  // Listeners
  onPipActionReceived: (callback: (action: string) => void) => void;
  onPipWindowClosed: (callback: () => void) => void;
  
  // Remover listeners
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}