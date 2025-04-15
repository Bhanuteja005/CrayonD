import { TourStep } from "@/components/TourGuide";
import { useEffect, useState } from "react";

export function useTourGuide() {
  const [runTour, setRunTour] = useState(false);
  const [hasCheckedTour, setHasCheckedTour] = useState(false);
  const [tourSteps] = useState<TourStep[]>([
    {
      target: '.chat-input-area',
      title: 'Chat Input',
      content: 'This is where you can type your interview questions and get AI assistance.',
      placement: 'top',
    },
    {
      target: '.web-search-button',
      title: 'Web Search',
      content: 'Click here to search the web for company information and industry trends.',
      placement: 'bottom'
    },
    {
      target: '.news-search-button',
      title: 'Industry News',
      content: 'Click here to search for the latest industry news that might be relevant for your interviews.',
      placement: 'bottom'
    },
    {
      target: '.send-message-button',
      title: 'Send Message',
      content: 'Click this button to send your message or search query.',
      placement: 'left'
    },
    {
      target: '.chat-messages-area',
      title: 'Chat History',
      content: 'Your conversation with the interview coach will appear here.',
      placement: 'bottom'
    }
  ]);
  
  // Start the tour
  const startTour = () => {
    setRunTour(true);
  };

  // Handle tour complete
  const handleTourComplete = () => {
    setRunTour(false);
    localStorage.setItem('hasSeenTour', 'true');
  };

  // Handle tour skip
  const handleTourSkip = () => {
    setRunTour(false);
    localStorage.setItem('hasSeenTour', 'true');
  };

  // Check if user has seen the tour before
  useEffect(() => {
    if (hasCheckedTour) return; // Only run once
    
    const checkTourStatus = () => {
      const hasSeenTour = localStorage.getItem('hasSeenTour');
      const fromOnboarding = sessionStorage.getItem('fromOnboarding');
    
      // If user is coming from onboarding or never seen tour, prepare to show it
      if (!hasSeenTour || fromOnboarding === 'true') {
        // Clear the fromOnboarding flag
        if (fromOnboarding) {
          sessionStorage.removeItem('fromOnboarding');
        }
      }
      
      setHasCheckedTour(true);
    };
    
    checkTourStatus();
  }, [hasCheckedTour]);

  return {
    runTour,
    tourSteps,
    startTour,
    handleTourComplete,
    handleTourSkip,
    hasCheckedTour,
    setHasCheckedTour
  };
}
