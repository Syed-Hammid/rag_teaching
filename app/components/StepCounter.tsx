'use client';

import { motion } from 'framer-motion';

interface StepCounterProps {
  currentStep: number;
  totalSteps: number;
  stageName: string;
}

export function StepCounter({ currentStep, totalSteps, stageName }: StepCounterProps) {
  const progressPercent = Math.min(((currentStep) / (totalSteps - 1)) * 100, 100);

  return (
    <div className="mb-8 w-full">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-semibold tracking-wider text-indigo-300 uppercase">
          Step {Math.max(1, currentStep + 1)} of {totalSteps}
        </span>
        <span className="text-xs text-slate-400 uppercase tracking-widest">{stageName}</span>
      </div>
      
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}
