import React from 'react';

interface AzroLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  light?: boolean;
}

export const AzroLogo: React.FC<AzroLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  light = false
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const subTextSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm'
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon SVG */}
      <div className={`relative flex items-center justify-center rounded-xl transition-transform duration-300 hover:scale-105 shadow-sm ${iconSizes[size]} ${
        light ? 'bg-white text-[#29221D]' : 'bg-[#29221D] text-[#FAF7F2]'
      }`}>
        <svg
          viewBox="0 0 100 100"
          fill="currentColor"
          className="w-4/5 h-4/5"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Steam curves */}
          <path
            d="M38 18 C38 24, 44 26, 44 32 C44 38, 38 40, 38 46"
            stroke="#D97724"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M52 14 C52 20, 58 22, 58 28 C58 34, 52 36, 52 42"
            stroke="#E5A93C"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M66 18 C66 24, 72 26, 72 32 C72 38, 66 40, 66 46"
            stroke="#D97724"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          {/* Coffee Cup Body */}
          <path
            d="M24 46 L76 46 C76 46, 74 76, 50 76 C26 76, 24 46, 24 46 Z"
            fill="currentColor"
          />
          {/* Cup Handle */}
          <path
            d="M74 52 C84 52, 88 58, 86 66 C84 72, 76 72, 72 70"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Saucer */}
          <path
            d="M18 82 C34 88, 66 88, 82 82"
            stroke={light ? '#29221D' : '#D97724'}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Small coffee bean detail */}
          <ellipse
            cx="50"
            cy="60"
            rx="5"
            ry="7"
            transform="rotate(25 50 60)"
            fill="#D97724"
          />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-extrabold tracking-wider font-['Playfair_Display',serif] ${textSizes[size]} ${
            light ? 'text-white' : 'text-[#29221D]'
          }`}>
            AZRO
          </span>
          <span className={`font-light tracking-widest text-[#D97724] ${textSizes[size]}`}>
            CAFÉ
          </span>
        </div>
        {showSubtitle && (
          <span className={`font-medium tracking-[0.2em] uppercase mt-0.5 ${subTextSizes[size]} ${
            light ? 'text-stone-300' : 'text-stone-500'
          }`}>
            Specialty Roasters
          </span>
        )}
      </div>
    </div>
  );
};
