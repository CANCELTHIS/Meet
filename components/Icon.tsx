import React from 'react';

interface IconProps {
  icon: React.ReactNode;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ icon, className = '' }) => {
  return <span className={`inline-block ${className}`}>{icon}</span>;
};

export default Icon;
