import React, { createContext, useContext } from 'react';
import { GeneralSettings } from '../types';
import { DEFAULT_SITE_SETTINGS } from '../siteSettings';

const SiteSettingsContext = createContext<GeneralSettings>(DEFAULT_SITE_SETTINGS);

export const SiteSettingsProvider = SiteSettingsContext.Provider;
export const useSiteSettings = () => useContext(SiteSettingsContext);
