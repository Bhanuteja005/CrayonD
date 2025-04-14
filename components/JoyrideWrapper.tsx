"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Define the props interfaces based on react-joyride
export interface Step {
  target: string;
  content: React.ReactNode;
  disableBeacon?: boolean;
  placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'right' | 'auto' | 'center';
  title?: React.ReactNode;
  styles?: any;
  [key: string]: any;
}

export interface JoyrideProps {
  steps: Step[];
  run: boolean;
  continuous?: boolean;
  showProgress?: boolean;
  showSkipButton?: boolean;
  callback?: (data: any) => void;
  styles?: any;
  [key: string]: any;
}

// Create a fallback/loading component
const JoyrideFallback = () => null;

// Dynamically import the Joyride component with SSR disabled
const DynamicJoyride = dynamic(
  () => import('react-joyride').then((mod) => {
    // Return the default export
    return mod.default;
  }).catch((err) => {
    console.error('Failed to load react-joyride:', err);
    // Return a dummy component if loading fails
    return () => null;
  }),
  { 
    ssr: false,
    loading: () => <JoyrideFallback />
  }
);

// Define our STATUS enum to match Joyride's
export const STATUS = {
  IDLE: 'idle',
  READY: 'ready',
  RUNNING: 'running',
  PAUSED: 'paused',
  SKIPPED: 'skipped',
  FINISHED: 'finished',
  ERROR: 'error'
};

export function JoyrideWrapper(props: JoyrideProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Only render the component on the client side
  if (!mounted) {
    return null;
  }

  return <DynamicJoyride {...props} />;
}
