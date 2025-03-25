import React from 'react';

type LoadingSpinnerProps = {
  size?: 'small' | 'medium' | 'large';
  color?: string;
};

const sizeMap = {
  small: 'h-8 w-8 border-2',
  medium: 'h-12 w-12 border-t-2 border-b-2',
  large: 'h-16 w-16 border-t-3 border-b-3',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'border-primary-600'
}) => {
  return (
    <div className={`animate-spin rounded-full ${sizeMap[size]} ${color}`}></div>
  );
};

export default LoadingSpinner; 