import React from 'react';
import { Facebook, Twitter, Linkedin, Globe, Instagram, Phone, Mail, MapPin } from 'lucide-react';
import Logo from './Logo';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export default function Footer({ setActiveTab }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-brand-blue text-white pt-16 pb-8 border-t-4 border-brand-gold">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-white/10">
          
          {/* Column 1: Brand Info & Socials */}
          <div className="flex flex-col gap-6">
            <Logo isLight={true} />
            <p className="text-gray-300 text-[14px] leading-relaxed max-w-sm">
              Welcome to Thinesh Bake House, your haven for delightful confections and culinary craftsmanship. Step into a world where flavor meets artistry, where every bite is a masterpiece of taste and texture.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: <Facebook className="h-4 w-4" />, url: 'https://facebook.com', label: 'Facebook' },
                { icon: <Twitter className="h-4 w-4" />, url: 'https://twitter.com', label: 'Twitter' },
                { icon: <Linkedin className="h-4 w-4" />, url: 'https://linkedin.com', label: 'LinkedIn' },
                { icon: <Globe className="h-4 w-4" />, url: 'https://tbh.lk', label: 'Website' },
                { icon: <Instagram className="h-4 w-4" />, url: 'https://instagram.com', label: 'Instagram' },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-brand-gold text-white hover:text-brand-blue transition-all duration-300 hover:scale-110 shadow-xs"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Help Links */}
          <div className="md:pl-12">
            <h3 className="text-lg font-bold font-display uppercase tracking-wider text-brand-gold mb-6 border-b border-brand-gold/20 pb-2 inline-block">
              Help Links
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Home', tab: 'home' },
                { label: 'Menu', tab: 'menu' },
                { label: 'Promotions', tab: 'promotions' },
                { label: 'Our Branches', tab: 'branches' },
              ].map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleNavClick(link.tab)}
                    className="text-gray-300 hover:text-brand-gold text-[15px] font-medium transition-colors flex items-center gap-1.5 hover:translate-x-1 duration-200 cursor-pointer"
                  >
                    <span className="text-brand-gold">›</span> {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Details */}
          <div>
            <h3 className="text-lg font-bold font-display uppercase tracking-wider text-brand-gold mb-6 border-b border-brand-gold/20 pb-2 inline-block">
              Contact Details
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-brand-gold flex-shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">Call Us</span>
                  <a href="tel:0777259245" className="text-gray-200 hover:text-brand-gold transition-colors font-medium">
                    0777259245
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-brand-gold flex-shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">Email Us</span>
                  <a href="mailto:info@tbh.lk" className="text-gray-200 hover:text-brand-gold transition-colors font-medium">
                    info@tbh.lk
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-brand-gold flex-shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">Visit Us</span>
                  <p className="text-gray-200 font-medium">
                    180, Jaffna Rd, Manipay
                  </p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p className="text-center sm:text-left">
            ©{currentYear}. Thinesh Bake House. All Rights Reserved.
          </p>
          <p className="text-center sm:text-right flex items-center gap-1.5">
            Designed By <span className="text-brand-gold font-semibold tracking-wide">InspiroDesk</span>
          </p>
        </div>

      </div>
    </footer>
  );
}
