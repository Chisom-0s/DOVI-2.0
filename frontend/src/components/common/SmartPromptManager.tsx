import CookieConsentBanner from './CookieConsentBanner';
import PWAInstallPrompt from './PWAInstallPrompt';
import NotificationPrompt from './NotificationPrompt';
import MobileAppPrompt from './MobileAppPrompt';
import DoviCommunityPrompt from './DoviCommunityPrompt';

/**
 * SmartPromptManager sits at the root of the application (inside PromptEngineProvider)
 * and renders all prompt components. 
 * The PromptEngineContext ensures that only ONE prompt is visible at a time.
 */
export default function SmartPromptManager() {
  return (
    <>
      <CookieConsentBanner />
      <NotificationPrompt />
      <PWAInstallPrompt />
      <DoviCommunityPrompt />
      <MobileAppPrompt />
    </>
  );
}
