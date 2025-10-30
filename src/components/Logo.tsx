import React from 'react';

interface LogoProps {
  size?: number; // height in px for the mascot box; wordmark scales accordingly
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 40, showText = true, className = '' }) => {
  const box = size;
  const wordmarkHeight = Math.round(size * 0.75);
  return (
    <div className={`flex items-center space-x-2 select-none ${className}`}>
      <svg
        width={box}
        height={box}
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="MediTalk stethoscope logo"
        className="transition-transform duration-200 ease-out hover:scale-[1.03] hover:rotate-[0.5deg]"
        role="img"
      >
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#fcd34d" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" rx="12" ry="12" width="46" height="46" fill="#ffffff" />
        <rect x="1.6" y="1.6" rx="12" ry="12" width="44.8" height="44.8" fill="none" stroke="url(#g1)" strokeWidth="1.6" />
        <circle cx="15" cy="14" r="3" fill="#3b82f6" />
        <circle cx="33" cy="14" r="3" fill="#3b82f6" />
        <path d="M18 15 C19.5 20, 22 23, 24 23 C26 23, 28.5 20, 30 15" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M24 23 C24 29, 20.5 32, 17 32" fill="none" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="17" cy="32" r="3.2" fill="#ffffff" stroke="#fcd34d" strokeWidth="2" />
        <circle cx="17" cy="32" r="1.2" fill="#f59e0b" />
      </svg>

      {showText && (
        <span
          aria-label="Meditalk wordmark"
          className="font-bold tracking-tight"
          style={{ fontSize: `${wordmarkHeight}px`, lineHeight: 1 }}
        >
          Meditalk
        </span>
      )}
    </div>
  );
};

export default Logo;
