"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightIcon, CheckIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

export interface TourStep {
  target: string;
  title: string;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface TourGuideProps {
  steps: TourStep[];
  run: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function TourGuide({ steps, run, onComplete, onSkip }: TourGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Start or stop the tour when the run prop changes - improved reliability
  useEffect(() => {
    if (run && !isInitialized) {
      // Add a small delay to ensure elements are rendered
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setIsVisible(true);
        setIsInitialized(true);
      }, 500);
      
      return () => clearTimeout(timer);
    } else if (!run && isInitialized) {
      setIsVisible(false);
      setIsInitialized(false);
    }
  }, [run, isInitialized]);

  // Update the target element and tooltip position with improved error handling
  useEffect(() => {
    if (!isVisible || steps.length === 0) return;

    const getCurrentTarget = () => {
      try {
        const { target } = steps[currentStep];
        const element = document.querySelector(target);
        
        if (!element) {
          console.warn(`Target element not found: ${target}. Skipping this step.`);
          
          // If element not found and not on the last step, try to move to next step
          if (currentStep < steps.length - 1) {
            setTimeout(() => setCurrentStep(prev => prev + 1), 100);
          } else {
            // If on last step and element not found, complete the tour
            onComplete();
          }
          return;
        }
        
        setTargetElement(element);
        
        // Calculate position
        const rect = element.getBoundingClientRect();
        const placement = steps[currentStep].placement || 'bottom';
        
        let top, left;
        
        switch (placement) {
          case 'top':
            top = rect.top - 10 - 120; // height of tooltip + offset
            left = rect.left + rect.width / 2 - 150; // half of tooltip width
            break;
          case 'bottom':
            top = rect.bottom + 10;
            left = rect.left + rect.width / 2 - 150;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - 60;
            left = rect.left - 10 - 300;
            break;
          case 'right':
            top = rect.top + rect.height / 2 - 60;
            left = rect.right + 10;
            break;
          default:
            top = rect.bottom + 10;
            left = rect.left + rect.width / 2 - 150;
        }
        
        // Make sure the tooltip stays in viewport with improved logic
        top = Math.max(10, Math.min(top, window.innerHeight - 150));
        left = Math.max(10, Math.min(left, window.innerWidth - 310));
        
        setTooltipPosition({ top, left });
        
        // Add highlight effect to the element with transition
        element.classList.add('tour-highlight');
      } catch (error) {
        console.error("Error positioning tour guide:", error);
        // Recover gracefully from errors
        onSkip();
      }
    };

    // Get initial position with delay to ensure DOM is ready
    setTimeout(getCurrentTarget, 100);
    
    // Update position on scroll and resize - debounced for performance
    let timeoutId: NodeJS.Timeout;
    const handleUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(getCurrentTarget, 100);
    };
    
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);
    
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
      clearTimeout(timeoutId);
      
      // Remove highlight from previous element
      if (targetElement) {
        targetElement.classList.remove('tour-highlight');
      }
    };
  }, [currentStep, isVisible, steps, onComplete, onSkip, targetElement]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Tour completed
      setIsVisible(false);
      onComplete();
    }
  };

  const skipTour = () => {
    setIsVisible(false);
    onSkip();
  };

  // Don't render anything if the tour is not running
  if (!isVisible || steps.length === 0) return null;

  const currentTourStep = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 pointer-events-auto" onClick={skipTour} />
      
      {/* Tooltip */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[60] shadow-lg rounded-lg bg-white w-[300px]"
            style={{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
            }}
          >
            <div className="relative p-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-2 h-6 w-6 text-slate-400 hover:text-slate-600"
                onClick={skipTour}
              >
                <XIcon size={14} />
              </Button>
              
              <h3 className="font-medium text-slate-900 mb-1">{currentTourStep.title}</h3>
              <div className="text-sm text-slate-600 mb-4">
                {currentTourStep.content}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {steps.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "h-1.5 rounded-full w-4",
                        idx === currentStep ? "bg-blue-500" : "bg-slate-200"
                      )}
                    />
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-600 h-8"
                    onClick={skipTour}
                  >
                    Skip
                  </Button>
                  
                  <Button 
                    size="sm" 
                    className="h-8 bg-blue-500 hover:bg-blue-600"
                    onClick={nextStep}
                  >
                    {isLastStep ? (
                      <>
                        Finish
                        <CheckIcon className="ml-1 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRightIcon className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add styles for highlighted elements */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 51;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          border-radius: inherit;
        }
      `}</style>
    </>
  );
}
