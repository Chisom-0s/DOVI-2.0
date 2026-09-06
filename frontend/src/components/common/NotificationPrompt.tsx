import { useEffect } from 'react';
import { usePromptEngine } from '@/contexts/PromptEngineContext';
import DoviSmartPrompt from './DoviSmartPrompt';
import { Bell } from 'lucide-react';

export default function NotificationPrompt() {
  const { activePrompt, acceptPrompt, dismissPrompt, registerEligibility } = usePromptEngine();

  const isVisible = activePrompt === 'notification';

  // Check support and current permission
  useEffect(() => {
    if (!('Notification' in window)) {
      registerEligibility('notification', false);
      return;
    }

    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      registerEligibility('notification', false);
    } else {
      registerEligibility('notification', true);
    }
  }, [registerEligibility]);

  if (!isVisible) return null;

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        acceptPrompt('notification');
      } else {
        dismissPrompt('notification');
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      dismissPrompt('notification');
    }
  };

  return (
    <DoviSmartPrompt
      id="notification"
      icon={<Bell size={18} />}
      collapsedText="Notifications"
      title="Stay updated"
      subtitle="Get important DOVI alerts, order status, and exclusive deals."
      ctaText="Enable"
      onCtaClick={handleEnable}
      onDismiss={() => dismissPrompt('notification')}
    />
  );
}
