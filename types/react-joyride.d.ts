declare module 'react-joyride' {
  import React from 'react';

  export type Status = 'running' | 'paused' | 'skipped' | 'finished' | 'error';
  
  export interface StepProps {
    target: string;
    content: React.ReactNode;
    disableBeacon?: boolean;
    event?: string;
    isFixed?: boolean;
    offset?: number;
    placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end' | 'right' | 'right-start' | 'right-end' | 'auto' | 'center';
    title?: React.ReactNode;
    spotlightClicks?: boolean;
    styles?: any;
    [key: string]: any;
  }

  export interface CallBackProps {
    action: string;
    controlled: boolean;
    index: number;
    lifecycle: string;
    size: number;
    status: Status;
    step: StepProps;
    type: string;
  }

  export interface JoyrideProps {
    callback?: (data: CallBackProps) => void;
    continuous?: boolean;
    debug?: boolean;
    disableCloseOnEsc?: boolean;
    disableOverlay?: boolean;
    disableOverlayClose?: boolean;
    disableScrolling?: boolean;
    getHelpers?: (helpers: any) => void;
    run?: boolean;
    scrollOffset?: number;
    scrollToFirstStep?: boolean;
    showProgress?: boolean;
    showSkipButton?: boolean;
    spotlightClicks?: boolean;
    spotlightPadding?: number;
    steps: StepProps[];
    styles?: any;
    [key: string]: any;
  }

  export const STATUS: {
    IDLE: 'idle';
    READY: 'ready';
    RUNNING: 'running';
    PAUSED: 'paused';
    SKIPPED: 'skipped';
    FINISHED: 'finished';
    ERROR: 'error';
  };

  export default class Joyride extends React.Component<JoyrideProps> {}
}
