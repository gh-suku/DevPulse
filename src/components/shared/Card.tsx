// Shared Card component
import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  title, 
  ...props 
}) => (
  <div 
    className={cn(
      "bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-w-0", 
      className
    )} 
    {...props}
  >
    {title && (
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        {title}
      </h3>
    )}
    {children}
  </div>
);
