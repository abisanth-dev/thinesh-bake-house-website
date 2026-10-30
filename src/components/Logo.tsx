import React from 'react';
import { useSiteSettings } from './SiteSettingsContext';

interface LogoProps {
  className?: string;
  isLight?: boolean;
  size?: number;
  src?: string;
}

export default function Logo({ className = "h-14", isLight = false, size, src }: LogoProps) {
  const settings = useSiteSettings();
  const desktopLogo = src || ((isLight || settings.appearance.mode === 'dark') ? (settings.identity.darkLogoUrl || settings.identity.logoUrl) : settings.identity.logoUrl);
  return (
    <div className="flex items-center select-none hover:opacity-95 transition-opacity cursor-pointer">
      <picture>
        <source media="(max-width: 640px)" srcSet={settings.identity.mobileLogoUrl || desktopLogo} />
        <img
        src={desktopLogo}
        alt={`${settings.identity.siteTitle} Logo`}
        className={`${className} w-auto max-h-16 object-contain flex-shrink-0`}
        style={size ? { height: size } : undefined}
        referrerPolicy="no-referrer"
        />
      </picture>
    </div>
  );
}
