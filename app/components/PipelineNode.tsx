'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';

export type StepStatus = 'idle' | 'active' | 'complete' | 'error';

interface PipelineNodeProps {
  id: string;
  stepNumber: number;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  accentColor: string;
  status: StepStatus;
  content?: ReactNode;
  tooltipText?: string;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function PipelineNode({
  stepNumber,
  icon,
  title,
  subtitle,
  accentColor,
  status,
  content,
  tooltipText
}: PipelineNodeProps) {
  const isIdle = status === 'idle';
  const isActive = status === 'active';
  const isComplete = status === 'complete';
  const isError = status === 'error';

  return (
    <motion.div
      layout
      custom={status}
      initial={false}
      animate={{
        scale: isActive ? 1.02 : 1,
        borderColor: isActive ? accentColor : isComplete ? '#2a2d3e' : isError ? '#ef4444' : '#1e2235',
        backgroundColor: isActive ? '#1e2235' : '#1a1d2e',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        "relative rounded-xl border-2 p-5 w-full flex flex-col z-10 transition-shadow",
        isActive ? "shadow-lg" : "shadow-md",
        isIdle && "opacity-60"
      )}
      style={{
        boxShadow: isActive ? `0 0 20px ${accentColor}15` : 'none',
      }}
    >
      {/* Complete status styling side ribbon */}
      {isComplete && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-md" 
          style={{ backgroundColor: accentColor }} 
        />
      )}

      {/* Header section (Icon + Title + Status Badges) */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Tooltip text={tooltipText || 'Stage icon'}>
            <div 
              className={cn("p-2 rounded-lg", isIdle ? "bg-slate-800 text-slate-500" : "bg-slate-800")}
              style={{ color: !isIdle ? accentColor : undefined }}
            >
              {icon}
            </div>
          </Tooltip>
          
          <div>
            <h3 className={cn("font-bold text-base tracking-wide flex items-center gap-2", isIdle ? "text-slate-400" : "text-slate-100")}>
              {stepNumber}. {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-400 font-medium tracking-wide mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* State icon indicators */}
        <div className="flex items-center">
          {isActive && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
          {isComplete && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {isError && <AlertCircle className="w-5 h-5 text-red-500" />}
        </div>
      </div>

      {/* Expanded Content Section */}
      <AnimatePresence>
        {(isActive || isComplete || isError) && content && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-slate-700/50">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
