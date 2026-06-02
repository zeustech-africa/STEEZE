'use client';

import React from 'react';

export interface ProcessStep {
  id: string;
  number: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
  duration?: string; // e.g., "Week 1-2"
}

interface ProcessStepsProps {
  steps: ProcessStep[];
  title?: string;
  subtitle?: string;
  layout?: 'horizontal' | 'vertical';
  accentColor?: string;
  showConnectingLines?: boolean;
  showStepNumbers?: boolean;
}

export function ProcessSteps({
  steps,
  title,
  subtitle,
  layout = 'horizontal',
  accentColor = 'text-gold',
  showConnectingLines = true,
  showStepNumbers = true
}: ProcessStepsProps) {
  
  if (steps.length === 0) {
    return null;
  }

  // Sort steps by number
  const sortedSteps = [...steps].sort((a, b) => a.number - b.number);

  return (
    <section className="w-full py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {subtitle && (
              <p className="text-gold uppercase tracking-wider text-sm mb-2">
                {subtitle}
              </p>
            )}
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                {title}
              </h2>
            )}
          </div>
        )}

        {/* Steps Container */}
        <div className={`${layout === 'horizontal' ? 'flex flex-wrap justify-center' : 'space-y-8 max-w-3xl mx-auto'}`}>
          {sortedSteps.map((step, index) => (
            <div
              key={step.id}
              className={`
                ${layout === 'horizontal' 
                  ? 'w-full md:w-1/2 lg:w-1/4 px-4 mb-8 text-center relative' 
                  : 'flex gap-6 items-start'
                }
              `}
            >
              {/* Connecting Line (Horizontal) */}
              {layout === 'horizontal' && showConnectingLines && index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gold/30 -z-10" />
              )}

              <div className={`
                ${layout === 'horizontal' ? 'text-center' : 'flex-1'}
              `}>
                {/* Step Number / Icon */}
                <div className={`
                  ${layout === 'horizontal' ? 'flex justify-center mb-4' : 'flex-shrink-0 mr-6'}
                `}>
                  <div className={`
                    w-16 h-16 rounded-full border-2 border-gold flex items-center justify-center bg-black
                    ${accentColor}
                  `}>
                    {step.icon ? (
                      step.icon
                    ) : showStepNumbers ? (
                      <span className="text-2xl font-bold">{step.number}</span>
                    ) : (
                      <span className="text-2xl font-bold">{step.number}</span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  {step.duration && (
                    <p className="text-gold text-sm font-semibold mb-1">
                      {step.duration}
                    </p>
                  )}
                  <h3 className={`text-xl font-bold text-white mb-2 ${layout === 'horizontal' ? '' : 'text-left'}`}>
                    {step.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connecting Arrow (Vertical) */}
              {layout === 'vertical' && index < steps.length - 1 && showConnectingLines && (
                <div className="flex justify-center py-2">
                  <div className="w-0.5 h-8 bg-gold/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}