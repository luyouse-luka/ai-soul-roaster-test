import React from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
}

export const GlitchText: React.FC<GlitchTextProps> = ({ text, className = '' }) => {
  return (
    <h1 className={`relative inline-block glitch uppercase font-bold tracking-widest ${className}`} data-text={text}>
      {text}
    </h1>
  );
};