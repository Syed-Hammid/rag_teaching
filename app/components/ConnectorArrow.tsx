'use client';

import { motion } from 'framer-motion';

interface ConnectorArrowProps {
  isActive: boolean;
  accentColor: string;
}

export function ConnectorArrow({ isActive, accentColor }: ConnectorArrowProps) {
  return (
    <div className="flex justify-center -my-2 relative z-0 h-16 pointer-events-none">
      <svg width="24" height="64" viewBox="0 0 24 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 0L12 60"
          stroke="#1e2235"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        
        {/* Animated dot moving down the line when active */}
        {isActive && (
          <motion.circle
            cx="12"
            cy="0"
            r="4"
            fill={accentColor}
            className="drop-shadow-lg"
            initial={{ cy: 0, opacity: 0 }}
            animate={{ cy: 60, opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 1,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 0.5
            }}
          />
        )}

        {/* Arrow head */}
        <path
          d="M7 55L12 62L17 55"
          stroke={isActive ? accentColor : "#1e2235"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors duration-500"
        />
      </svg>
    </div>
  );
}
