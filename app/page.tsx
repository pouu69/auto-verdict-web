'use client';

import { useCallback, useEffect, useState } from 'react';
import { prefs } from '@/storage/prefs';
import { readSharedEncarUrl, clearShareParams } from '@/ui/share';
import { type Tab, type AnalyzeRequest } from '@/ui/navigation';
import { AdBanner } from '@/components/AdBanner';
import { BottomNav, SideNav } from '@/components/BottomNav';
import { Splash } from '@/components/Splash';
import { Onboarding } from '@/screens/Onboarding';
import { AnalyzeScreen } from '@/screens/AnalyzeScreen';
import { SavedListScreen } from '@/screens/SavedListScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { ResultScreen } from '@/screens/ResultScreen';
import { CompareScreen } from '@/screens/CompareScreen';
import { PrivacyPolicyScreen } from '@/screens/PrivacyPolicyScreen';

type Route = 'SPLASH' | 'ONBOARDING' | 'MAIN';

export default function Page() {
  const [route, setRoute] = useState<Route>('SPLASH');
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);

  useEffect(() => {
    setOnboardingDone(prefs.isOnboardingComplete());
    // Port of handleShareIntent: a shared Encar URL jumps straight into analysis.
    const shared = readSharedEncarUrl();
    if (shared) {
      setSharedUrl(shared);
      clearShareParams();
    }
  }, []);

  if (route === 'SPLASH') {
    return (
      <Splash
        onFinished={() => setRoute(onboardingDone || sharedUrl ? 'MAIN' : 'ONBOARDING')}
      />
    );
  }

  if (route === 'ONBOARDING') {
    return (
      <Onboarding
        onComplete={() => {
          prefs.setOnboardingComplete();
          setOnboardingDone(true);
          setRoute('MAIN');
        }}
      />
    );
  }

  return (
    <MainShell
      onReplayOnboarding={() => setRoute('ONBOARDING')}
      sharedUrl={sharedUrl}
      onConsumeShared={() => setSharedUrl(null)}
    />
  );
}

function MainShell({
  onReplayOnboarding,
  sharedUrl,
  onConsumeShared,
}: {
  onReplayOnboarding: () => void;
  sharedUrl: string | null;
  onConsumeShared: () => void;
}) {
  const [tab, setTab] = useState<Tab>('ANALYZE');
  const [request, setRequest] = useState<AnalyzeRequest | null>(null);
  const [fromSaved, setFromSaved] = useState(false);
  const [compareIds, setCompareIds] = useState<string[] | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Push a history entry when opening a full-screen overlay so the browser/OS
  // back button (and the in-app back arrow) closes it instead of leaving the app.
  const pushOverlay = useCallback(() => {
    if (typeof window !== 'undefined') window.history.pushState({ av: 'overlay' }, '');
  }, []);

  const openResult = useCallback(
    (req: AnalyzeRequest, saved: boolean) => {
      pushOverlay();
      setRequest(req);
      setFromSaved(saved);
    },
    [pushOverlay],
  );
  const openCompare = useCallback(
    (ids: string[]) => {
      pushOverlay();
      setCompareIds(ids);
    },
    [pushOverlay],
  );
  const openPrivacy = useCallback(() => {
    pushOverlay();
    setShowPrivacy(true);
  }, [pushOverlay]);

  // Both the in-app back arrow and the browser/OS back button funnel through
  // history.back() → the popstate handler closes whatever overlay is open.
  const goBack = useCallback(() => {
    if (typeof window !== 'undefined') window.history.back();
  }, []);

  useEffect(() => {
    const onPop = () => {
      setShowPrivacy(false);
      setRequest(null);
      setFromSaved(false);
      setCompareIds(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // A shared URL (from the OS share sheet) auto-opens the result, like Android.
  useEffect(() => {
    if (sharedUrl) {
      openResult({ kind: 'url', url: sharedUrl }, false);
      onConsumeShared();
    }
  }, [sharedUrl, onConsumeShared, openResult]);

  // Full-screen overlays mirror MainActivity's BackHandler screens (no nav).
  const overlayActive = showPrivacy || request !== null || compareIds !== null;

  let overlay: React.ReactNode = null;
  if (showPrivacy) {
    overlay = <PrivacyPolicyScreen onBack={goBack} />;
  } else if (request) {
    overlay = <ResultScreen request={request} fromSaved={fromSaved} onBack={goBack} />;
  } else if (compareIds) {
    overlay = <CompareScreen carIds={compareIds} onBack={goBack} />;
  }

  return (
    <div className="av-shell">
      {!overlayActive && <SideNav selected={tab} onSelect={setTab} />}
      <div className="av-body">
        {overlayActive ? (
          <div
            className="av-overlay"
            style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
          >
            {overlay}
          </div>
        ) : (
          <>
            <div className="av-scroll">
              <div className="av-content">
                {tab === 'ANALYZE' && (
                  <AnalyzeScreen onAnalyze={(req) => openResult(req, false)} />
                )}
                {tab === 'SAVED' && (
                  <SavedListScreen
                    onOpen={(carId) => openResult({ kind: 'saved', carId }, true)}
                    onCompare={openCompare}
                  />
                )}
                {tab === 'SETTINGS' && (
                  <SettingsScreen onPrivacyPolicy={openPrivacy} onReplayGuide={onReplayOnboarding} />
                )}
              </div>
            </div>
            <AdBanner />
            <BottomNav selected={tab} onSelect={setTab} />
          </>
        )}
      </div>
    </div>
  );
}
