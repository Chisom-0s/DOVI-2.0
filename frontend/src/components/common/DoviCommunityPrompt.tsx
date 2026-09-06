import { useEffect } from 'react';
import { usePromptEngine } from '@/contexts/PromptEngineContext';
import DoviSmartPrompt from './DoviSmartPrompt';
import { Users } from 'lucide-react';

export default function DoviCommunityPrompt() {
  const { activePrompt, acceptPrompt, dismissPrompt, registerEligibility, getPromptState, sessionViews } = usePromptEngine();

  const isVisible = activePrompt === 'community';
  
  // Register eligibility: only show to new users (or those who haven't joined yet) 
  // after they've had some meaningful engagement (e.g. 3 page views in session)
  useEffect(() => {
    const state = getPromptState('community');
    const hasJoined = state.customData?.community_join_clicked === true;
    
    // Eligibility rules:
    // 1. Must not have already clicked join.
    // 2. Must have > 2 session views (meaningful engagement).
    if (!hasJoined && sessionViews > 2) {
      registerEligibility('community', true);
    } else {
      registerEligibility('community', false);
    }
  }, [sessionViews, registerEligibility, getPromptState]);

  if (!isVisible) return null;

  const handleJoinClick = () => {
    // Record that they clicked join
    acceptPrompt('community');
    // Set custom data for explicit join tracking
    // The PromptEngineContext acceptPrompt sets status='ACCEPTED', 
    // which prevents it from showing again.
    
    // Open the official DOVI WhatsApp community link
    window.open('https://chat.whatsapp.com/HsCB00bjVMYBogMMcT5c43', '_blank');
  };

  return (
    <DoviSmartPrompt
      id="community"
      icon={<Users size={18} />}
      collapsedText="Community"
      title="DOVI Community"
      subtitle="Join our WhatsApp community for exclusive deals, updates, and announcements."
      ctaText="Join Community"
      onCtaClick={handleJoinClick}
      onDismiss={() => dismissPrompt('community')}
    />
  );
}
