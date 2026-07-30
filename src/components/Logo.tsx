import React from 'react';

interface LogoProps {
  className?: string;
  isLight?: boolean;
}

export default function Logo({ className = "h-14", isLight = false }: LogoProps) {
  return (
    <div className="flex items-center select-none hover:opacity-95 transition-opacity cursor-pointer">
      <img
        src="https://tbh.lk/wp-content/uploads/2026/02/TBH-Logo-1024x1024-1.png"
        alt="Thinesh Bake House Logo"
        className={`${className} w-auto max-h-16 object-contain flex-shrink-0`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
