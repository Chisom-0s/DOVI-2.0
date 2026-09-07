import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePromptEngine } from '@/contexts/PromptEngineContext';
import DoviSmartPrompt from './DoviSmartPrompt';
import { Download } from 'lucide-react';

export default function PWAInstallPrompt() {
  const { isIOS, triggerInstall } = usePWAInstall();
  const { activePrompt, dismissPrompt } = usePromptEngine();
  const [showiOSInstructions, setShowiOSInstructions] = useState(false);

  const isVisible = activePrompt === 'pwa';

  if (!isVisible) return null;

  const handleInstallClick = () => {
    if (isIOS) {
      setShowiOSInstructions(true);
    } else {
      triggerInstall();
    }
  };

  // If iOS instructions are active, show a manual flow description
  const iosSubtitle = (
    <span>
      Tap the <strong>Share</strong> button <span style={{ fontSize: '1.1em' }}>📤</span> in Safari's bottom toolbar, 
      then scroll down and select <strong>Add to Home Screen</strong> <span style={{ fontSize: '1.1em' }}>➕</span>.
    </span>
  );

  return (
    <DoviSmartPrompt
      id="pwa"
      icon={<Download size={18} />}
      collapsedText="Install DOVI"
      title="Get DOVI on your home screen"
      subtitle={showiOSInstructions && isIOS ? iosSubtitle : "Faster access. Smoother experience."}
      ctaText={showiOSInstructions && isIOS ? "Got it" : "Install"}
      onCtaClick={showiOSInstructions && isIOS ? () => dismissPrompt('pwa') : handleInstallClick}
      secondaryCtaText={showiOSInstructions && isIOS ? undefined : "Not now"}
      onSecondaryCtaClick={showiOSInstructions && isIOS ? undefined : () => dismissPrompt('pwa')}
      onDismiss={() => dismissPrompt('pwa')}
    />
  );
}
