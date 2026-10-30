import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Phone, Clock, Compass } from 'lucide-react';
import { BRANCHES } from '../data';
import { Branch } from '../types';

export default function BranchesSection() {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(BRANCHES[0]);

  return (
    <div className="py-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Banner - styled exactly like the third screenshot */}
        <div className="w-full bg-[#0B1354] rounded-2xl py-8 mb-12 text-center shadow-md">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-wider font-display uppercase">
            Our Locations
          </h2>
          <p className="text-xs text-blue-200 mt-1 font-mono tracking-widest uppercase">
            6 Branches Across Jaffna & Colombo
          </p>
        </div>

        {/* Layout split: Left Side Branch List, Right Side Active Branch map & details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Branches list, one row per branch */}
          <div className="lg:col-span-8">
            <div className="flex flex-col gap-4">
              {BRANCHES.map((branch) => (
                <motion.div
                  key={branch.id}
                  whileHover={{ x: 4 }}
                  className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition-all cursor-pointer flex items-stretch ${
                    selectedBranch?.id === branch.id
                      ? 'border-[#0B1354] ring-2 ring-[#0B1354]/10'
                      : 'border-gray-200 hover:border-brand-gold/50'
                  }`}
                  onClick={() => setSelectedBranch(branch)}
                >
                  {/* Name, address and phone on one line (wraps on small screens) */}
                  <div className="px-4 py-3.5 sm:px-5 flex-grow min-w-0 flex flex-wrap items-center gap-x-6 gap-y-1.5">
                    <div className="flex items-center gap-2 sm:w-64 shrink-0">
                      <h3 className="font-extrabold text-[15px] text-[#0B1354] font-display uppercase tracking-tight whitespace-nowrap">
                        {branch.name}
                      </h3>
                      {selectedBranch?.id === branch.id && (
                        <span className="bg-[#0B1354] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                          Selected
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-medium min-w-0">
                      <MapPin className="h-3.5 w-3.5 text-[#0B1354] flex-shrink-0" />
                      <span>{branch.address}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-semibold font-mono whitespace-nowrap sm:ml-auto">
                      <Phone className="h-3.5 w-3.5 text-[#0B1354] flex-shrink-0" />
                      <span>{branch.phone}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Area: Interactive Detail & Simulated Maps */}
          <div className="lg:col-span-4 bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24">
            <AnimatePresence mode="wait">
              {selectedBranch ? (
                <motion.div
                  key={selectedBranch.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="border-b border-gray-200 pb-4">
                    <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest font-mono">
                      Branch Contact & Hours
                    </span>
                    <h3 className="text-xl font-black text-[#0B1354] font-display uppercase tracking-tight mt-1">
                      {selectedBranch.name}
                    </h3>
                  </div>

                  {/* Branch Hours, Map, and Action Options */}
                  <div className="space-y-4 text-sm text-gray-600">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-brand-gold flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-gray-800 text-xs uppercase tracking-wider block">Baking Hours</span>
                        <p className="text-xs">Mon - Sun: 7:00 AM - 9:30 PM</p>
                        <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">● Open Now (Hot bakes arriving hourly)</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Compass className="h-5 w-5 text-brand-gold flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-gray-800 text-xs uppercase tracking-wider block">Specialty</span>
                        <p className="text-xs">Custom Cakes, Hot Ceylon Puffs, Milk Toffees</p>
                      </div>
                    </div>
                  </div>

                  {/* High Fidelity Simulated Maps Embed with detailed styling */}
                  <div className="rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] bg-stone-100 relative shadow-inner">
                    {/* SVG Stylized Local Map Illustration */}
                    <svg className="w-full h-full bg-[#E5E9F0]" viewBox="0 0 100 100">
                      {/* Grid Roads */}
                      <line x1="10" y1="0" x2="10" y2="100" stroke="#FFFFFF" strokeWidth="4" />
                      <line x1="50" y1="0" x2="50" y2="100" stroke="#FFFFFF" strokeWidth="6" />
                      <line x1="85" y1="0" x2="85" y2="100" stroke="#FFFFFF" strokeWidth="4" />
                      <line x1="0" y1="30" x2="100" y2="30" stroke="#FFFFFF" strokeWidth="4" />
                      <line x1="0" y1="65" x2="100" y2="65" stroke="#FFFFFF" strokeWidth="6" />
                      
                      {/* Lagoon / Sea accents if Jaffna / Colombo */}
                      <path d="M 0 0 Q 30 10 40 0 Z" fill="#D0E1FD" />
                      <path d="M 80 100 Q 90 85 100 100 Z" fill="#D0E1FD" />

                      {/* Map landmarks / Greens */}
                      <rect x="18" y="8" width="16" height="14" rx="2" fill="#C5E1A5" opacity="0.8" />
                      <rect x="62" y="72" width="18" height="18" rx="2" fill="#C5E1A5" opacity="0.8" />

                      {/* Selected Branch Indicator Pin with pulsing rings */}
                      <circle cx="50" cy="65" r="8" fill="#F59E0B" className="animate-ping" opacity="0.4" />
                      <circle cx="50" cy="65" r="4" fill="#0B1354" />
                      <path d="M 50 65 L 50 52" stroke="#0B1354" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="50" cy="52" r="5" fill="#E5A823" stroke="#0B1354" strokeWidth="1.5" />
                      
                      {/* Label of branch */}
                      <rect x="25" y="38" width="50" height="9" rx="1.5" fill="#0B1354" />
                      <text x="50" y="44" fill="#FFFFFF" fontSize="4.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        {selectedBranch.name.toUpperCase()}
                      </text>
                    </svg>

                    <div className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-xs text-[10px] font-mono py-1 px-2 rounded-md shadow-xs text-gray-500 border border-gray-200">
                      GPS: Jaffna, Sri Lanka
                    </div>
                  </div>

                  {/* Map action button */}
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(selectedBranch.name + ' ' + selectedBranch.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-lg border border-[#0B1354] hover:bg-[#0B1354] text-[#0B1354] hover:text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Open in Google Maps</span>
                    <Compass className="h-4 w-4" />
                  </a>

                </motion.div>
              ) : (
                <div className="text-center py-20 text-gray-400">
                  Select a branch to view detailed contact hours and branch maps.
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
}
