/**
 * App preferences — port of Android `AppPreferences`.
 * Backed by localStorage (synchronous, survives reloads).
 */

const KEY_ONBOARDING_COMPLETE = 'autoverdict_onboarding_complete';

export const prefs = {
  isOnboardingComplete(): boolean {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(KEY_ONBOARDING_COMPLETE) === 'true';
  },

  setOnboardingComplete(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(KEY_ONBOARDING_COMPLETE, 'true');
  },
};
