/**
 * Country Grid Component
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid } from 'react-window';
import { AlertCircle } from 'lucide-react';
import { staggerContainer } from '../../animations/variants';
import LoadingSkeleton from './LoadingSkeleton';
import CountryButton from './CountryButton';

const CountryGrid = ({ 
  countries = [],
  selectedCountries = [],
  onToggle,
  loading = false,
  maxSelection = 6,
  minSelection = 2
}) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [justSelected, setJustSelected] = useState(null);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const handleToggle = (country) => {
    if (selectedCountries.includes(country)) {
      onToggle(selectedCountries.filter(c => c !== country));
    } else if (selectedCountries.length < maxSelection) {
      onToggle([...selectedCountries, country]);
      setJustSelected(country);
      setTimeout(() => setJustSelected(null), 600);
    }
  };

  const columnCount = containerWidth >= 1024 ? 6 : (containerWidth >= 768 ? 4 : 2);
  const colWidth = columnCount > 0 ? Math.floor(containerWidth / columnCount) : 140;
  const rowHeight = 48;
  const rowCount = Math.ceil(countries.length / columnCount);

  if (loading) {
    return (
      <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700" ref={containerRef}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Select Countries (minimum {minSelection}, maximum {maxSelection})</h3>
        </div>
        <LoadingSkeleton count={24} />
      </div>
    );
  }

  if (countries.length === 0) {
    return (
      <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-red-400 text-center py-4"
        >
          <AlertCircle className="inline mr-2" size={20} />
          No countries loaded. Check that CSV files are in the public folder.
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700" ref={containerRef}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">Select Countries (minimum {minSelection}, maximum {maxSelection})</h3>
        <motion.span
          key={selectedCountries.length}
          initial={{ scale: 1.2, color: '#34d399' }}
          animate={{ 
            scale: 1, 
            color: selectedCountries.length >= minSelection ? '#34d399' : '#fb923c' 
          }}
          transition={{ duration: 0.3 }}
          className={`text-sm font-semibold ${
            selectedCountries.length >= minSelection
              ? 'text-green-400'
              : 'text-orange-400'
          }`}
        >
          {selectedCountries.length}/{maxSelection} selected{' '}
          {selectedCountries.length < minSelection && `(need at least ${minSelection})`}
        </motion.span>
      </div>

      {/* Always use simple grid instead of virtualized for better compatibility */}
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2"
      >
        {countries.map((country, idx) => (
          <CountryButton
            key={country}
            country={country}
            isSelected={selectedCountries.includes(country)}
            isJustSelected={justSelected === country}
            onToggle={handleToggle}
            delay={idx * 0.02}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default CountryGrid;