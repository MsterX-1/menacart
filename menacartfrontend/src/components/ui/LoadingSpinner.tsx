import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'currentColor',
  className = '' 
}) => {
  const sizeMap = {
    sm: '16px',
    md: '24px',
    lg: '36px'
  };

  const borderWidthMap = {
    sm: '2px',
    md: '3px',
    lg: '4px'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          border: `${borderWidthMap[size]} solid ${color}`,
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
          borderRadius: '50%',
        }}
      />
    </div>
  );
};
