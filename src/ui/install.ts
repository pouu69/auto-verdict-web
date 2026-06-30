/**
 * PWA install helpers.
 *
 * The Web Share Target only works once the app is INSTALLED to the home screen,
 * so the UI needs to (a) detect whether we're already installed/standalone,
 * (b) offer the native install prompt when the browser supports it (Android
 * Chrome), and (c) guide iOS/other users through manual "add to home screen".
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((l) => l());
}

/** Call once on app start (client only). */
export function initInstall(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

/** Whether a native install prompt is currently available (Android Chrome). */
export function canPromptInstall(): boolean {
  return deferredPrompt !== null;
}

/** Trigger the native install prompt; returns true if the user accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notify();
  return outcome === 'accepted';
}

export function onInstallAvailabilityChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** True when the app is already running as an installed PWA. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const navStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return window.matchMedia('(display-mode: standalone)').matches || navStandalone === true;
}

export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
