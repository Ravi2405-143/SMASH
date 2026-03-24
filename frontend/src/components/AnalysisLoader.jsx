import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, ChevronRight } from 'lucide-react';
import './AnalysisLoader.css';

const analysisSteps = [
  "Extracting video frames (60fps)...",
  "Running YOLOv8 shuttlecock detection...",
  "Applying Kalman Filter for trajectory tracking...",
  "Computing pixel-to-meter velocity...",
  "Generating final metrics..."
];

export function AnalysisLoader({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate complex analysis progression
    const totalTime = 4000; // 4 seconds total
    const intervalTime = 100;
    const stepsCount = totalTime / intervalTime;
    
    let currentTick = 0;
    
    const interval = setInterval(() => {
      currentTick++;
      const currentProgress = (currentTick / stepsCount) * 100;
      setProgress(Math.min(currentProgress, 100));
      
      // Update the active step based on progress
      const stepIndex = Math.min(
        Math.floor((currentProgress / 100) * analysisSteps.length),
        analysisSteps.length - 1
      );
      setCurrentStep(stepIndex);

      if (currentTick >= stepsCount) {
        clearInterval(interval);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 500);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="loader-container">
      <div className="loader-card glass-panel">
        <div className="loader-header">
          <div className="pulse-ring">
            <Activity size={32} className="text-gradient" />
          </div>
          <h2>Analyzing Smash Data</h2>
          <p className="subtitle">AI models are processing your video</p>
        </div>

        <div className="progress-section">
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">{Math.round(progress)}%</div>
        </div>

        <div className="steps-container">
          {analysisSteps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div 
                key={index} 
                className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}
              >
                <div className="step-icon">
                  {isCompleted ? (
                    <CheckCircle2 size={18} color="var(--accent-success)" />
                  ) : isActive ? (
                    <ChevronRight size={18} color="var(--accent-primary)" className="anim-pulse" />
                  ) : (
                    <div className="dot-pending"></div>
                  )}
                </div>
                <span className="step-text">{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
