/*
  Migration Model App (v19)
  Last updated: 2025-11-06 04:58:30 UTC
  Author: @hindianime2361
  
  Features:
  - CSV-based data loading (2000-2020)
  - Single/Multiple year modes with adjacent-year expansion
  - Transition matrix estimation with geographic effects
  - Web Worker ensemble sampling with LCG seeded RNG
  - Virtualized country selector (react-window Grid)
  - Results ZIP download with predictions, matrix, charts
  - Defensive runtime checks and ErrorBoundary
*/

import React, { Component, useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Grid } from 'react-window';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Play, Settings, Info, TrendingUp, AlertCircle } from 'lucide-react';
import { BlockMath } from 'react-katex';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/* ErrorBoundary for capturing render errors */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    try {
      window.__lastError = {
        error: { message: error?.message, stack: error?.stack },
        info,
        timestamp: new Date().toISOString()
      };
    } catch {}
    console.error('ErrorBoundary caught:', error);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-white">
          <h2 className="text-red-400 text-xl mb-2">Rendering Error</h2>
          <pre className="bg-slate-900 p-4 rounded overflow-auto text-sm">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <p className="mt-2 text-slate-400 text-sm">
            Details saved to window.__lastError for debugging
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

/* Utility helpers */
const safeParseFloat = (v) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const parseCSV = (text) => {
  if (!text) return [];
  const lines = String(text).trim().split('\n').filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i]; });
    return obj;
  });
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const calculateConnectivity = (c1, c2) => {
  const neighbors = {
    'United States': ['Canada', 'Mexico'],
    'Canada': ['United States'],
    'Mexico': ['United States'],
    'Germany': ['France', 'Austria', 'Switzerland', 'Belgium', 'Netherlands', 'Poland', 'Czech Republic', 'Denmark'],
    'France': ['Germany', 'Belgium', 'Switzerland', 'Italy', 'Spain'],
    'United Kingdom': ['Ireland'],
    'Ireland': ['United Kingdom'],
    'Italy': ['France', 'Switzerland', 'Austria'],
    'Spain': ['France', 'Portugal'],
    'Portugal': ['Spain'],
    'Belgium': ['France', 'Germany', 'Netherlands'],
    'Netherlands': ['Germany', 'Belgium'],
    'Austria': ['Germany', 'Switzerland', 'Italy', 'Czech Republic', 'Hungary'],
    'Switzerland': ['Germany', 'France', 'Italy', 'Austria'],
    'Poland': ['Germany', 'Czech Republic'],
    'Czech Republic': ['Germany', 'Poland', 'Austria'],
    'Denmark': ['Germany', 'Sweden', 'Norway'],
    'Sweden': ['Norway', 'Finland', 'Denmark'],
    'Norway': ['Sweden', 'Finland', 'Denmark'],
    'Finland': ['Sweden', 'Norway'],
    'Hungary': ['Austria'],
    'Greece': []
  };
  return neighbors[c1]?.includes(c2) ? 1.0 : 0.0;
};

/* Main App Component */
function AppInner() {
  // State declarations
  const [migrationData, setMigrationData] = useState([]);
  const [years, setYears] = useState([]);
  const [allCountries, setAllCountries] = useState([]);
  const [yearIndex, setYearIndex] = useState({});
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [inputMode, setInputMode] = useState('single');
  const [inputYear, setInputYear] = useState(null);
  const [inputYearsMulti, setInputYearsMulti] = useState([]);
  const [targetYear, setTargetYear] = useState(null);
  const [distanceEffect, setDistanceEffect] = useState(0.5);
  const [connectivityEffect, setConnectivityEffect] = useState(0.3);
  const [trainTestSplit, setTrainTestSplit] = useState(0.75);
  const [ensembleSize, setEnsembleSize] = useState(100);
  const [rngSeed, setRngSeed] = useState('');
  const [expandedYears, setExpandedYears] = useState([]);
  const [trainingPairs, setTrainingPairs] = useState([]);
  const [transitionMatrices, setTransitionMatrices] = useState([]);
  const [averageTransitionMatrix, setAverageTransitionMatrix] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [validationMetrics, setValidationMetrics] = useState(null);
  const [learnedCoefficients, setLearnedCoefficients] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [modelRunning, setModelRunning] = useState(false);
  const [resultsReady, setResultsReady] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Added states that were missing (fixes undefined errors)
  const [geographicDistances, setGeographicDistances] = useState({});
  const [connectivity, setConnectivity] = useState({});
  const [targetValidationError, setTargetValidationError] = useState('');

  // Refs
  const chartRef = useRef(null);
  const matrixRef = useRef(null);
  const countriesContainerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Constants
  const colors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
  const dotColors = ['#dc2626', '#059669', '#d97706', '#7c3aed', '#db2777', '#0d9488'];

  const countryCoordinates = {
    'United States': [37.0902, -95.7129],
    'Germany': [51.1657, 10.4515],
    'United Kingdom': [55.3781, -3.4360],
    'Canada': [56.1304, -106.3468],
    'France': [46.2276, 2.2137],
    'Australia': [-25.2744, 133.7751],
    'Japan': [36.2048, 138.2529],
    'Italy': [41.8719, 12.5674],
    'Spain': [40.4637, -3.7492],
    'Mexico': [23.6345, -102.5528],
    'Netherlands': [52.1326, 5.2913],
    'Sweden': [60.1282, 18.6435],
    'Switzerland': [46.8182, 8.2275],
    'Belgium': [50.5039, 4.4699],
    'Austria': [47.5162, 14.5501],
    'Poland': [51.9194, 19.1451],
    'Norway': [60.4720, 8.4689],
    'Denmark': [56.2639, 9.5018],
    'Finland': [61.9241, 25.7482],
    'Greece': [39.0742, 21.8243],
    'Portugal': [39.3999, -8.2245],
    'Czech Republic': [49.8175, 15.4730],
    'Hungary': [47.1625, 19.5033],
    'Ireland': [53.4129, -8.2439],
    'New Zealand': [-40.9006, 174.8860],
  };

/* Grid layout calculations */
  const columnCount = containerWidth >= 1024 ? 6 : (containerWidth >= 768 ? 4 : 2);
  const colWidth = columnCount > 0 ? Math.floor((containerWidth || 720) / columnCount) : 140;
  const rowHeight = 48;
  const rowCount = Math.ceil((allCountries.length || 0) / (columnCount || 1));

  /* Toggle country selection */
  const toggleCountry = (country) => {
    setSelectedCountries(prev => {
      if (prev.includes(country)) return prev.filter(c => c !== country);
      if (prev.length >= 6) return prev;
      return [...prev, country];
    });
  };

  /* Metrics calculation */
  const calculateMetrics = (predictionsList, selectedCountriesList) => {
    let totalSquaredError = 0, totalAbsError = 0, totalPoints = 0, coveredPoints = 0;
    (predictionsList || []).forEach(pred => {
      if (pred?.actualData && pred?.predicted) {
        (selectedCountriesList || []).forEach(country => {
          const actual = pred.actualData[country] ?? 0;
          const predicted = pred.predicted[country] ?? 0;
          const lower = pred.lower?.[country] ?? 0;
          const upper = pred.upper?.[country] ?? 0;
          if (actual > 0) {
            const error = predicted - actual;
            totalSquaredError += error * error;
            totalAbsError += Math.abs(error);
            totalPoints++;
            if (actual >= lower && actual <= upper) coveredPoints++;
          }
        });
      }
    });
    if (totalPoints === 0) return { rmse: 0, mae: 0, coverage: 0, totalPoints: 0 };
    return {
      rmse: Math.sqrt(totalSquaredError / totalPoints),
      mae: totalAbsError / totalPoints,
      coverage: (coveredPoints / totalPoints) * 100,
      totalPoints
    };
  };

  /* Chart data transformation */
  const chartDataWithUncertainty = predictions.map(pred => {
    const dp = { year: pred.year, phase: pred.phase };
    (selectedCountries || []).forEach(c => {
      dp[c] = pred.predicted?.[c] ?? 0;
      dp[`${c}_lower`] = pred.lower?.[c] ?? 0;
      dp[`${c}_upper`] = pred.upper?.[c] ?? 0;
      if (pred.actualData && pred.actualData[c] != null) dp[`${c}_actual`] = pred.actualData[c];
    });
    return dp;
  });

  /* Grid component */
  const CountriesGrid = () => {
    if (!containerWidth || allCountries.length <= 24) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {allCountries.map(country => (
            <motion.button
              key={country}
              onClick={() => toggleCountry(country)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-3 py-2 rounded text-sm transition-transform duration-200 transform ${
                selectedCountries.includes(country)
                  ? 'bg-gradient-to-r from-green-600 to-emerald-500 shadow-lg text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-100'
              }`}
            >
              {country}
            </motion.button>
          ))}
        </div>
      );
    }

    const Cell = ({ columnIndex, rowIndex, style }) => {
      const index = rowIndex * columnCount + columnIndex;
      if (index >= allCountries.length) return <div style={style} />;
      const country = allCountries[index];
      const isSelected = selectedCountries.includes(country);
      return (
        <div style={{ ...style, padding: 6 }}>
          <motion.button
            onClick={() => toggleCountry(country)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ width: '100%', height: '100%' }}
            className={`w-full h-full rounded text-sm transition-transform duration-150 transform ${
              isSelected
                ? 'bg-gradient-to-r from-green-600 to-emerald-500 shadow-lg text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-100'
            }`}
          >
            {country}
          </motion.button>
        </div>
      );
    };

    const gridHeight = Math.min(rowHeight * rowCount, 360);

    return (
      <div style={{ width: '100%' }}>
        <Grid
          columnCount={columnCount}
          columnWidth={colWidth}
          height={gridHeight}
          rowCount={rowCount}
          rowHeight={rowHeight}
          width={containerWidth}
          overscanRowCount={3}
        >
          {Cell}
        </Grid>
      </div>
    );
  };

  /* Load CSV files once */
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const expectedYears = Array.from({ length: 21 }, (_, i) => 2000 + i);
        const dataByYear = [];
        const countriesSet = new Set();

        for (const y of expectedYears) {
          try {
            const r = await fetch(`/migration_${y}.csv`);
            if (!r.ok) continue;
            const text = await r.text();
            const parsed = parseCSV(text);
            if (!Array.isArray(parsed) || !parsed.length) continue;
            
            dataByYear.push({ year: y, data: parsed });
            parsed.forEach(row => {
              if (row?.Country && countryCoordinates[row.Country]) {
                countriesSet.add(row.Country);
              }
            });
          } catch (err) {
            console.warn(`Failed to load year ${y}:`, err);
            continue;
          }
        }

        if (!dataByYear.length) {
          console.warn('No valid data years found');
          setMigrationData([]);
          setYears([]);
          setAllCountries([]);
          setLoadingData(false);
          return;
        }

        const sorted = dataByYear.sort((a, b) => a.year - b.year);
        
        // Build indexes and matrices
        const idx = {};
        sorted.forEach(d => { idx[d.year] = d; });
        
        const distances = {}, conn = {};
        Array.from(countriesSet).forEach(c1 => {
          distances[c1] = {}; conn[c1] = {};
          Array.from(countriesSet).forEach(c2 => {
            if (c1 === c2) {
              distances[c1][c2] = 0;
              conn[c1][c2] = 0;
            } else {
              const [lat1, lon1] = countryCoordinates[c1] || [0,0];
              const [lat2, lon2] = countryCoordinates[c2] || [0,0];
              distances[c1][c2] = haversineDistance(lat1, lon1, lat2, lon2);
              conn[c1][c2] = calculateConnectivity(c1, c2);
            }
          });
        });

        // Update state
        setMigrationData(sorted);
        setYears(sorted.map(d => d.year));
        setAllCountries(Array.from(countriesSet).sort());
        setYearIndex(idx);
        setGeographicDistances(distances);
        setConnectivity(conn);
        
        // Set initial years if available
        if (sorted.length) {
          setInputYear(sorted[0].year);
          setTargetYear(sorted[sorted.length - 1].year);
        }

      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  /* Model helpers */
  const getPopulationStock = useCallback((yearData, countries) => {
    const result = {};
    if (!Array.isArray(yearData)) {
      countries.forEach(c => { result[c] = 0; });
      return result;
    }
    
    countries.forEach(country => {
      const row = yearData.find(r => r?.Country === country);
      if (!row || typeof row !== 'object') {
        result[country] = 0;
        return;
      }
      
      const candidates = [
        'Stock of foreign population by nationality(Total)',
        'Stock of foreign-born population by country of birth(Total)'
      ];
      
      let stock = NaN;
      for (const h of candidates) {
        if (row[h] !== undefined && row[h] !== '') {
          stock = safeParseFloat(row[h]) || stock;
        }
      }
      
      if (Number.isNaN(stock)) {
        const numeric = Object.values(row)
          .map(v => Number.parseFloat(v))
          .filter(Number.isFinite);
        stock = numeric.length ? numeric[numeric.length - 1] : 0;
      }
      
      result[country] = Number.isFinite(stock) ? stock : 0;
    });
    
    return result;
  }, []);

  const getFlows = useCallback((yearData, countries) => {
    const flows = {};
    if (!Array.isArray(yearData)) {
      countries.forEach(c => {
        flows[c] = { inflow: 0, outflow: 0, stock: 0 };
      });
      return flows;
    }
    
    countries.forEach(country => {
      const row = yearData.find(r => r?.Country === country);
      if (!row || typeof row !== 'object') {
        flows[country] = { inflow: 0, outflow: 0, stock: 0 };
        return;
      }
      
      const infl = safeParseFloat(row['Inflows of foreign population by nationality(Total)']);
      const out = safeParseFloat(row['Outflows of foreign population by nationality(Total)']);
      const stock = safeParseFloat(
        row['Stock of foreign population by nationality(Total)'] ||
        row['Stock of foreign-born population by country of birth(Total)']
      );
      
      flows[country] = { inflow: infl, outflow: out, stock };
    });
    
    return flows;
  }, []);

  const estimateTransitionMatrix = useCallback((flows, countries, distances, conn, distCoeff, connCoeff) => {
    const n = countries.length;
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));
    
    countries.forEach((origin, i) => {
      const originFlow = flows?.[origin];
      if (!originFlow?.stock) {
        matrix[i][i] = 1.0;
        return;
      }
      
      const totalOutflow = originFlow.outflow || 0;
      const stayProb = Math.max(0.5, 1 - (totalOutflow / Math.max(1, originFlow.stock)));
      matrix[i][i] = stayProb;
      
      const remainingProb = 1 - stayProb;
      const weights = [];
      let weightSum = 0;
      
      countries.forEach((dest, j) => {
        if (i === j) {
          weights[j] = 0;
          return;
        }
        
        const destFlow = flows?.[dest];
        const attractiveness = Math.log((destFlow?.inflow || 0) + 10);
        const distance = distances?.[origin]?.[dest] ?? 3000;
        const connectivityBonus = 1 + (connCoeff * (conn?.[origin]?.[dest] || 0));
        const distanceEffect = Math.exp(-distCoeff * distance / 1000);
        
        const weight = Math.max(0.0001, attractiveness) * distanceEffect * connectivityBonus;
        weights[j] = weight;
        weightSum += weight;
      });
      
      if (weightSum > 0) {
        countries.forEach((dest, j) => {
          if (i !== j) {
            matrix[i][j] = remainingProb * (weights[j] / weightSum);
          }
        });
      }
      
      // Normalize row
      const rowSum = matrix[i].reduce((a, b) => a + b, 0);
      if (rowSum > 0) {
        matrix[i] = matrix[i].map(v => v / rowSum);
      }
    });
    
    return matrix;
  }, []);

  const propagatePopulation = useCallback((currentPop, transMatrix, countries) => {
    const newPop = {};
    
    countries.forEach((dest, j) => {
      let sum = 0;
      countries.forEach((origin, i) => {
        const originVal = currentPop?.[origin] ?? 0;
        const prob = transMatrix?.[i]?.[j] ?? 0;
        sum += originVal * prob;
      });
      newPop[dest] = sum;
    });
    
    return newPop;
  }, []);

  const averageTransitionMatrixFrom = useCallback((matrices, countries) => {
    if (!Array.isArray(matrices) || !matrices.length) return null;
    
    const n = countries.length;
    const avg = Array.from({ length: n }, () => Array(n).fill(0));
    
    matrices.forEach(tm => {
      if (!tm?.matrix) return;
      
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          avg[i][j] += (tm.matrix[i]?.[j] ?? 0) / matrices.length;
        }
      }
    });
    
    return avg;
  }, []);

  /* Year expansion */
  const expandSelectedYearsWithAdjacents = useCallback((selectedYears, availableYears) => {
    const availSet = new Set(availableYears);
    const expanded = new Set(selectedYears);
    
    selectedYears.forEach(y => {
      if (availSet.has(y - 1)) expanded.add(y - 1);
      if (availSet.has(y + 1)) expanded.add(y + 1);
    });
    
    return Array.from(expanded).sort((a, b) => a - b);
  }, []);

  const computePairsFromExpanded = useCallback((expandedYearsArr) => {
    const pairs = [];
    for (let i = 0; i < expandedYearsArr.length - 1; i++) {
      const y1 = expandedYearsArr[i], y2 = expandedYearsArr[i + 1];
      if (y2 - y1 === 1) pairs.push([y1, y2]);
    }
    return pairs;
  }, []);

  useEffect(() => {
    if (inputMode !== 'multiple' || !inputYearsMulti.length || !years.length) {
      setExpandedYears([]);
      setTrainingPairs([]);
      return;
    }
    
    const expanded = expandSelectedYearsWithAdjacents(inputYearsMulti, years);
    setExpandedYears(expanded);
    setTrainingPairs(computePairsFromExpanded(expanded));
  }, [inputMode, inputYearsMulti, years, expandSelectedYearsWithAdjacents, computePairsFromExpanded]);

  /* Validation */
  useEffect(() => {
    const maxInput = inputMode === 'single'
      ? inputYear
      : (inputYearsMulti.length ? Math.max(...inputYearsMulti) : null);
      
    if (!maxInput || !targetYear) {
      setTargetValidationError('');
      return;
    }
    
    if (targetYear <= maxInput) {
      setTargetValidationError('Target year must be later than the latest input/training year.');
    } else {
      setTargetValidationError('');
    }
  }, [inputMode, inputYear, inputYearsMulti, targetYear]);

  /* Worker orchestration */
  const runEnsembleWorker = useCallback(async ({ finalAvgMatrix, initPop, startYear, steps, ensembleSize, seed }) => {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(new URL('./workers/ensemble.worker.js', import.meta.url));
        
        worker.onmessage = (e) => {
          resolve(e.data.results);
          worker.terminate();
        };
        
        worker.onerror = (err) => {
          console.warn('Worker error:', err);
          reject(err);
          worker.terminate();
        };
        
        worker.postMessage({
          finalAvgMatrix,
          initPop,
          selectedCountries,
          steps,
          ensembleSize,
          seed,
          startYear
        });
        
      } catch (err) {
        console.warn('Worker creation failed:', err);
        reject(err);
      }
    });
  }, [selectedCountries]);

  /* Build training matrices */
  const buildTrainingTransitionMatricesAndPairs = useCallback((mode, multipleYears, canonicalTrainData) => {
    const matrices = [];
    const pairs = [];
    let expanded = [];
    
    if (mode === 'multiple' && Array.isArray(multipleYears) && multipleYears.length > 0) {
      expanded = expandSelectedYearsWithAdjacents(multipleYears, years);
      
      for (let i = 0; i < expanded.length - 1; i++) {
        const y1 = expanded[i], y2 = expanded[i + 1];
        if (y2 - y1 === 1) {
          const row1 = yearIndex[y1];
          const row2 = yearIndex[y2];
          
          if (row1?.data && row2?.data) {
            const flows = getFlows(row1.data, selectedCountries);
            const tm = estimateTransitionMatrix(
              flows,
              selectedCountries,
              geographicDistances,
              connectivity,
              distanceEffect,
              connectivityEffect
            );
            matrices.push({ year: y2, matrix: tm });
            pairs.push([y1, y2]);
          }
        }
      }
      
      return { matrices, pairs, expandedYears: expanded };
    }
    
    if (Array.isArray(canonicalTrainData) && canonicalTrainData.length > 1) {
      for (let t = 1; t < canonicalTrainData.length; t++) {
        if (canonicalTrainData[t-1]?.data) {
          const flows = getFlows(canonicalTrainData[t-1].data, selectedCountries);
          const tm = estimateTransitionMatrix(
            flows,
            selectedCountries,
            geographicDistances,
            connectivity,
            distanceEffect,
            connectivityEffect
          );
          matrices.push({ year: canonicalTrainData[t].year, matrix: tm });
          pairs.push([canonicalTrainData[t-1].year, canonicalTrainData[t].year]);
        }
      }
    }
    
    return { matrices, pairs, expandedYears: [] };
  }, [
    years,
    yearIndex,
    selectedCountries,
    geographicDistances,
    connectivity,
    distanceEffect,
    connectivityEffect,
    estimateTransitionMatrix,
    getFlows,
    expandSelectedYearsWithAdjacents
  ]);

  /* Generate predictions */
  const generatePredictions = async () => {
    const hasInput = inputMode === 'single'
      ? !!inputYear
      : (Array.isArray(inputYearsMulti) && inputYearsMulti.length > 0);
      
    if (!hasInput || !targetYear || !migrationData.length || selectedCountries.length < 2) {
      return;
    }
    
    if (targetValidationError) {
      return;
    }
    
    setModelRunning(true);
    setResultsReady(false);
    setShowMatrix(false);
    setPredictions([]);
    setTransitionMatrices([]);
    setAverageTransitionMatrix(null);
    setValidationMetrics(null);
    setLearnedCoefficients(null);
    setTrainingPairs([]);
    
    try {
      // Build training data
      const canonicalTrainData = migrationData
        .filter(d => d.year >= 2002 && d.year <= 2020)
        .sort((a, b) => a.year - b.year);
      
      const { matrices: transMatricesBuilt, pairs, expandedYears: usedExpanded } =
        buildTrainingTransitionMatricesAndPairs(inputMode, inputYearsMulti, canonicalTrainData);
      
      let transMatrices = transMatricesBuilt;
      let explicitPairs = pairs;
      let usedExpandedYears = usedExpanded;
      
      // Fallback if no matrices built
      if (!transMatrices.length && canonicalTrainData.length > 1) {
        const fallback = buildTrainingTransitionMatricesAndPairs('single', [], canonicalTrainData);
        transMatrices = fallback.matrices;
        explicitPairs = fallback.pairs;
        usedExpandedYears = [];
      }
      
      // Get average matrix
      let finalAvgMatrix = averageTransitionMatrixFrom(transMatrices, selectedCountries);
      
      // Fallback to single-year estimate if needed
      if (!finalAvgMatrix) {
        const sampleYear = inputMode === 'single'
          ? inputYear
          : (inputYearsMulti.length ? Math.max(...inputYearsMulti) : null);
          
        const inputRow = yearIndex[sampleYear];
        if (inputRow?.data) {
          const flows = getFlows(inputRow.data, selectedCountries);
          const tm = estimateTransitionMatrix(
            flows,
            selectedCountries,
            geographicDistances,
            connectivity,
            distanceEffect,
            connectivityEffect
          );
          transMatrices = [{ year: sampleYear, matrix: tm }];
          finalAvgMatrix = tm;
        }
      }
      
      // Get initial population
      const initPopRow = inputMode === 'single'
        ? yearIndex[inputYear]
        : yearIndex[Math.max(...inputYearsMulti)];
        
      if (!initPopRow?.data) {
        throw new Error('No initial population data available');
      }
      
      const initPop = getPopulationStock(initPopRow.data, selectedCountries);
      
      // Update training state
      setTransitionMatrices(transMatrices);
      setTrainingPairs(explicitPairs);
      setExpandedYears(usedExpandedYears);
      
      // Setup prediction run
      const startYr = inputMode === 'single'
        ? inputYear
        : Math.max(...inputYearsMulti);
      const steps = targetYear - startYr;
      const seedToUse = rngSeed?.trim() || null;
      
      // Run ensemble
      let forwardResults = [];
      try {
        const avgMat = finalAvgMatrix ||
          (transMatrices.length ? averageTransitionMatrixFrom(transMatrices, selectedCountries) : null);
          
        if (!avgMat) {
          throw new Error('No transition matrix available');
        }
        
        // Try worker
        forwardResults = await runEnsembleWorker({
          finalAvgMatrix: avgMat,
          initPop,
          startYear: startYr,
          steps,
          ensembleSize,
          seed: seedToUse
        });
        
      } catch (workerErr) {
        console.warn('Worker failed, falling back to main thread:', workerErr);
        
        // Main thread fallback
        let currentPop = initPop;
        const avgMatFallback = finalAvgMatrix ||
          (transMatrices.length ? averageTransitionMatrixFrom(transMatrices, selectedCountries) : null);
          
        if (!avgMatFallback) {
          throw new Error('No transition matrix available for fallback');
        }
        
        for (let step = 0; step <= Math.max(0, steps); step++) {
          const yr = startYr + step;
          if (step === 0) {
            forwardResults.push({
              year: yr,
              mean: currentPop,
              lower: currentPop,
              upper: currentPop
            });
          } else {
            currentPop = propagatePopulation(currentPop, avgMatFallback, selectedCountries);
            forwardResults.push({
              year: yr,
              mean: currentPop,
              lower: currentPop,
              upper: currentPop
            });
          }
        }
      }
      
      // Transform results
      const predictionResults = forwardResults.map(fr => ({
        year: fr.year,
        phase: fr.year === startYr ? 'input' : 'predicted',
        predicted: fr.mean,
        lower: fr.lower,
        upper: fr.upper,
        actualData: yearIndex[fr.year]
          ? getPopulationStock(yearIndex[fr.year].data, selectedCountries)
          : null
      }));
      
      // Validation on pre-2002
      const testPredictions = [];
      const testingYears = migrationData
        .filter(d => d.year < 2002)
        .sort((a, b) => a.year - b.year);
        
      testingYears.forEach(testYearObj => {
        if (!testYearObj?.data) return;
        
        const startPop = getPopulationStock(testYearObj.data, selectedCountries);
        const ensemble = [];
        const samples = Math.min(50, Math.max(20, Math.round(ensembleSize / 2)));
        
        for (let s = 0; s < samples; s++) {
          const perturbed = finalAvgMatrix?.map(row => {
            if (!Array.isArray(row)) return [];
            
            const alpha = row.map(p => Math.max(1, p * 100));
            const g = alpha.map(a => -Math.log(Math.max(Math.random(), 1e-12)) * a);
            const sum = g.reduce((a, b) => a + b, 0) || 1;
                        return g.map(v => v / sum);
          }) || [];
          
          if (perturbed?.length) {
            const nextPop = propagatePopulation(startPop, perturbed, selectedCountries);
            ensemble.push(nextPop);
          }
        }

        // Compute test statistics
        const mean = {}, lower = {}, upper = {};
        selectedCountries.forEach(country => {
          const vals = ensemble
            .map(e => e?.[country] ?? 0)
            .sort((a, b) => a - b);
          
          mean[country] = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
          lower[country] = vals[Math.floor(vals.length * 0.025)] ?? 0;
          upper[country] = vals[Math.floor(vals.length * 0.975)] ?? 0;
        });

        const actualObj = migrationData.find(d => d.year === (testYearObj.year + 1));
        const actualData = actualObj?.data
          ? getPopulationStock(actualObj.data, selectedCountries)
          : null;

        testPredictions.push({
          year: testYearObj.year + 1,
          predicted: mean,
          lower,
          upper,
          actualData
        });
      });

      // Update state with results
      setAverageTransitionMatrix(
        transMatrices.length
          ? averageTransitionMatrixFrom(transMatrices, selectedCountries)
          : null
      );
      setPredictions(predictionResults);
      setValidationMetrics(calculateMetrics(testPredictions, selectedCountries));
      setLearnedCoefficients({ distanceEffect, connectivityEffect });

      setResultsReady(true);
      setTimeout(() => setShowMatrix(true), 40);

    } catch (err) {
      console.error('Prediction generation failed:', err);
      alert('Failed to generate predictions: ' + String(err));
    } finally {
      setModelRunning(false);
    }
  };

  /* Download results */
  const dataURLToBlob = (dataURL) => {
    if (!dataURL) return null;
    const parts = dataURL.split(';base64,');
    if (parts.length !== 2) return null;
    const contentType = parts[0].split(':')[1];
    const byteString = atob(parts[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], { type: contentType });
  };

  const downloadResults = async () => {
    if (!resultsReady) return;

    try {
      // Prepare results data
      const meta = {
        selectedCountries,
        inputMode,
        inputYear,
        inputYearsMulti,
        targetYear,
        distanceEffect,
        connectivityEffect,
        ensembleSize,
        seed: rngSeed || null,
        generatedAt: new Date().toISOString()
      };

      const payload = { meta, predictions };

      // Create transition matrix CSV
      let csv = '';
      if (averageTransitionMatrix && selectedCountries.length) {
        csv += ['From/To', ...selectedCountries].join(',') + '\n';
        averageTransitionMatrix.forEach((row, i) => {
          const values = [
            selectedCountries[i],
            ...(Array.isArray(row) ? row.map(v => v.toFixed(6)) : [])
          ];
          csv += values.join(',') + '\n';
        });
      } else {
        csv = 'No transition matrix available\n';
      }

      // Create ZIP with result folder
      const zip = new JSZip();
      const folder = zip.folder('result');

      // Add files
      folder.file('predictions.json', JSON.stringify(payload, null, 2));
      folder.file('transition_matrix.csv', csv);

      // Capture chart
      if (chartRef.current) {
        try {
          const chartUrl = await htmlToImage.toPng(chartRef.current, {
            cacheBust: true
          });
          const chartBlob = dataURLToBlob(chartUrl);
          if (chartBlob) {
            folder.file('chart.png', chartBlob);
          }
        } catch (err) {
          console.warn('Chart capture failed:', err);
          folder.file(
            'chart-capture-failed.txt',
            `Chart capture error: ${String(err)}`
          );
        }
      }

      // Capture matrix
      if (matrixRef.current) {
        try {
          const matrixUrl = await htmlToImage.toPng(matrixRef.current, {
            cacheBust: true
          });
          const matrixBlob = dataURLToBlob(matrixUrl);
          if (matrixBlob) {
            folder.file('matrix.png', matrixBlob);
          }
        } catch (err) {
          console.warn('Matrix capture failed:', err);
          folder.file(
            'matrix-capture-failed.txt',
            `Matrix capture error: ${String(err)}`
          );
        }
      }

      // Generate and save ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      saveAs(content, `result_${timestamp}.zip`);

    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to create download: ' + String(err));
    }
  };

  /* UI Components */
  const renderTransitionMatrix = () => {
    if (!averageTransitionMatrix || !selectedCountries.length) return null;

    return (
      <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700" ref={matrixRef}>
        <h3 className="text-lg font-bold mb-3">Average Transition Matrix</h3>
        <div className="overflow-auto">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="text-left text-slate-300">
                <th className="w-36 pr-2">From / To</th>
                {selectedCountries.map((c, j) => (
                  <th key={j} className="px-2 py-1">{c}</th>
                ))}
              </tr>
            </thead>
            <motion.tbody
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.06, delayChildren: 0.08 }
                }
              }}
              initial="hidden"
              animate={showMatrix ? "visible" : "hidden"}
            >
              {selectedCountries.map((origin, i) => (
                <motion.tr
                  key={i}
                  className="border-t border-slate-700"
                  variants={{
                    hidden: { opacity: 0, translateY: 6 },
                    visible: {
                      opacity: 1,
                      translateY: 0,
                      transition: { duration: 0.45 }
                    }
                  }}
                >
                  <td className="py-2 pr-4 font-medium text-slate-200">{origin}</td>
                  {selectedCountries.map((dest, j) => {
                    const v = averageTransitionMatrix[i]?.[j] ?? 0;
                    const pct = v * 100;
                    const pctText = `${pct.toFixed(2)}%`;
                    const widthPct = Math.min(100, pct);
                    return (
                      <td key={j} className="py-2 px-2 align-middle">
                        <Tippy content={`From ${origin} → ${dest}: ${pctText}`}>
                          <div className="relative w-full h-8 rounded overflow-visible">
                            <div
                              className="absolute inset-0 bg-slate-900/40 rounded"
                              style={{ height: 32 }}
                            />
                            <motion.div
                              initial={{ width: '0%' }}
                              animate={{ width: showMatrix ? `${widthPct}%` : '0%' }}
                              transition={{ duration: 0.9 }}
                              className="absolute left-1 top-1 rounded h-7 flex items-center"
                              style={{
                                maxWidth: '100%',
                                background: 'linear-gradient(90deg, rgba(16,185,129,0.95), rgba(34,197,94,0.9))',
                                boxShadow: '0 1px 6px rgba(0,0,0,0.45)'
                              }}
                            >
                              {widthPct >= 9 && (
                                <div className="ml-2 text-[12px] text-white font-semibold">
                                  {pctText}
                                </div>
                              )}
                            </motion.div>
                            <div
                              className="absolute right-2 top-0 h-8 flex items-center text-[12px] font-semibold"
                              style={{ color: '#e6f9f0' }}
                            >
                              {pctText}
                            </div>
                          </div>
                        </Tippy>
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
        <div className="text-xs text-slate-400 mt-3">
          Each row sums to ~1.00 (numerical rounding).
          Values represent yearly transition probabilities.
        </div>
      </div>
    );
  };

  const renderModelExplanation = () => (
    <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
        <TrendingUp size={16} />Model Explanation & Equations
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-slate-200">What does this model predict?</h4>
          <p className="text-sm text-slate-300 mt-2">
            The model forecasts how foreign population stocks redistribute across selected
            destination countries. It estimates transition matrices from historical flows
            and propagates a population vector forward using a Markov chain.
          </p>
          <div className="mt-3 bg-slate-900/30 p-3 rounded font-mono">
            <BlockMath math={`p_{t+1} = p_t \\; T`} />
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-slate-200">Key Equations</h4>
          <div className="space-y-3 mt-2">
            <div className="bg-slate-900/30 p-3 rounded">
              <div className="text-xs text-slate-300 mb-1 font-semibold">
                Transition weights
              </div>
              <BlockMath
                math={`w_{i\\to j} = a_j \\; e^{-\\beta \\, \\mathrm{dist}_{ij}/1000} \\; (1 + \\gamma \\, \\mathrm{conn}_{ij})`}
              />
            </div>
            <div className="bg-slate-900/30 p-3 rounded">
              <div className="text-xs text-slate-300 mb-1 font-semibold">
                Row normalization
              </div>
              <BlockMath
                math={`T_{i,j} = (1 - \\mathrm{stay}_i) \\; \\frac{w_{i\\to j}}{\\sum_k w_{i\\to k}}, \\quad T_{i,i} = \\mathrm{stay}_i`}
              />
            </div>
            <div className="bg-slate-900/30 p-3 rounded">
              <div className="text-xs text-slate-300 mb-1 font-semibold">
                Ensemble sampling
              </div>
              <div className="text-sm text-slate-300">
                We perturb rows (Dirichlet-like) and compute mean & 95% quantiles
                to represent uncertainty.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* Main render */
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              OECD Migration Model - Geography-aware Transition Matrix Forecast
            </h1>
            <p className="text-slate-300">
              Predicting foreign population redistribution using transition matrices
              and geographic features (2000-2020)
            </p>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Info size={24} />
          </button>
        </div>

        {/* Info panel */}
        {showInfo && (
          <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="font-bold mb-2">Model Features</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>✓ Uses years 2002-2020 for training</li>
              <li>✓ Geographic distances (Haversine)</li>
              <li>✓ Border connectivity effects</li>
              <li>✓ Markov transition matrices</li>
              <li>✓ Ensemble uncertainty quantification</li>
              <li>✓ Deterministic seeded sampling available</li>
            </ul>
          </div>
        )}

        {/* Country selector */}
        <div
          className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700"
          ref={countriesContainerRef}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Select Countries (minimum 2, maximum 6)</h3>
            <span
              className={`text-sm ${
                selectedCountries.length >= 2
                  ? 'text-green-400'
                  : 'text-orange-400'
              }`}
            >
              {selectedCountries.length}/6 selected{' '}
              {selectedCountries.length < 2 && '(need at least 2)'}
            </span>
          </div>

          {loadingData ? (
            <div className="text-slate-400 text-center py-4">
              Loading countries...
            </div>
          ) : allCountries.length === 0 ? (
            <div className="text-red-400 text-center py-4">
              <AlertCircle className="inline mr-2" size={20} />
              No countries loaded. Check that CSV files are in the public folder.
            </div>
          ) : (
            <CountriesGrid />
          )}
        </div>

        {/* Control panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Geography coefficients */}
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Settings size={18} />
              <h3 className="font-bold">Geography Coefficients</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">
                  Distance Effect: {distanceEffect.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={distanceEffect}
                  onChange={(e) => setDistanceEffect(parseFloat(e.target.value))}
                  className="w-full mt-2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Higher = distance matters more
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-400">
                  Connectivity Effect: {connectivityEffect.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={connectivityEffect}
                  onChange={(e) => setConnectivityEffect(parseFloat(e.target.value))}
                  className="w-full mt-2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Higher = borders matter more
                </p>
              </div>

              <div className="pt-2 border-t border-slate-700 mt-3">
                <label className="text-sm text-slate-400">
                  Train/Test Split: {(trainTestSplit * 100).toFixed(0)}% train
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="0.9"
                  step="0.01"
                  value={trainTestSplit}
                  onChange={(e) => setTrainTestSplit(parseFloat(e.target.value))}
                  className="w-full mt-2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Proportion of years used for canonical training (fallback)
                </p>
              </div>
            </div>
          </div>

          {/* Prediction controls */}
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="font-bold mb-3">Prediction Controls</h3>

            <div className="mb-3">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="inputMode"
                    value="single"
                    checked={inputMode === 'single'}
                    onChange={() => {
                      setInputMode('single');
                      setInputYearsMulti([]);
                      setTrainingPairs([]);
                    }}
                  />
                  <span className="ml-1 text-sm">Single year</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="inputMode"
                    value="multiple"
                    checked={inputMode === 'multiple'}
                    onChange={() => {
                      setInputMode('multiple');
                      setInputYear(null);
                      setTrainingPairs([]);
                    }}
                  />
                  <span className="ml-1 text-sm">
                    Multiple years (include adjacent years automatically)
                  </span>
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Multiple years mode: adjacent years (±1) will be included if available.
                Latest selected year used as starting stock.
              </p>
            </div>

            <div className="space-y-3">
              {inputMode === 'single' ? (
                <div>
                  <label className="text-sm text-slate-400 block mb-1">
                    Input year (starting stock)
                  </label>
                  <select
                    className="w-full bg-slate-900 p-2 rounded"
                    value={inputYear || ''}
                    onChange={(e) => setInputYear(parseInt(e.target.value || ''))}
                  >
                    <option value="">-- select input year --</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-sm text-slate-400 block mb-1">
                    Training years (multi-select)
                  </label>
                  <select
                    multiple
                    size={6}
                    className="w-full bg-slate-900 p-2 rounded"
                    value={inputYearsMulti.map(String)}
                    onChange={(e) =>
                      setInputYearsMulti(
                        Array.from(e.target.selectedOptions).map((opt) =>
                          parseInt(opt.value, 10)
                        )
                      )
                    }
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Hold Ctrl/Cmd to select multiple years.
                    Adjacent years (±1) will be included if available.
                  </p>

                  {inputYearsMulti.length > 0 && (
                    <div className="mt-3 bg-slate-900/20 p-2 rounded text-sm">
                      <div>
                        <strong>{inputYearsMulti.length}</strong> year(s) selected:
                      </div>
                      <div className="mt-1 text-xs text-slate-300">
                        {inputYearsMulti.sort((a, b) => a - b).join(', ')}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        Starting stock from latest selected year ({Math.max(...inputYearsMulti)}).
                      </div>

                      {expandedYears.length > 0 && (
                        <div className="mt-2 text-xs">
                          <div className="font-semibold mb-1">
                            Expanded years (selected ± adjacent):
                          </div>
                          <div className="text-xs text-slate-300">
                            {expandedYears.join(', ')}
                          </div>
                        </div>
                      )}

                      {trainingPairs.length > 0 ? (
                        <div className="mt-3 text-xs">
                          <div className="font-semibold mb-1">Training pairs used:</div>
                          <ul className="list-disc ml-5 text-xs text-slate-300">
                            {trainingPairs.map(([a, b], idx) => (
                              <li key={idx}>
                                <Tippy content={`Pair ${a} → ${b}`}>
                                  <span>{`${a} → ${b}`}</span>
                                </Tippy>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="mt-3 text-xs text-slate-500">
                          Training pairs will be shown here after pairs can be computed.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm text-slate-400 block mb-1">
                  Target year (year to forecast)
                </label>
                <select
                  className="w-full bg-slate-900 p-2 rounded"
                  value={targetYear || ''}
                  onChange={(e) => setTargetYear(parseInt(e.target.value || ''))}
                >
                  <option value="">-- select target year --</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                {targetValidationError && (
                  <div className="mt-2 text-xs text-red-400">
                    {targetValidationError}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-700 mt-3">
                <label className="text-sm text-slate-400">
                  Ensemble size: {ensembleSize}
                </label>
                <input
                  type="range"
                  min="10"
                  max="2000"
                  step="10"
                  value={ensembleSize}
                  onChange={(e) => setEnsembleSize(parseInt(e.target.value, 10))}
                  className="w-full mt-2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Higher = better uncertainty estimate, but slower. Try 100 for normal runs.
                </p>

                <label className="text-sm text-slate-400 mt-2 block">
                  RNG seed (optional)
                </label>
                <input
                  className="w-full bg-slate-900 p-2 rounded mt-1"
                  value={rngSeed}
                  onChange={(e) => setRngSeed(e.target.value)}
                  placeholder="Enter a seed to reproduce results"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Provide a short string to reproduce ensemble draws (optional).
                </p>
              </div>

              <div className="mt-3">
                <motion.button
                  whileHover={{ scale: modelRunning ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generatePredictions}
                  disabled={
                    modelRunning ||
                    selectedCountries.length < 2 ||
                    loadingData ||
                    !targetYear ||
                    (inputMode === 'single' ? !inputYear : inputYearsMulti.length === 0) ||
                    !!targetValidationError
                  }
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg transition-transform duration-200 ${
                    modelRunning ||
                    selectedCountries.length < 2 ||
                    loadingData ||
                    !targetYear ||
                    (inputMode === 'single' ? !inputYear : inputYearsMulti.length === 0) ||
                    !!targetValidationError
                      ? 'bg-slate-600 cursor-not-allowed opacity-50'
                      : 'bg-green-600 hover:bg-green-700 shadow-lg'
                  }`}
                >
                  {modelRunning ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Run Model
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {resultsReady && validationMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-slate-800 p-4 rounded-lg border border-slate-700"
            >
              <div className="text-sm text-slate-400 mb-1">RMSE</div>
              <div className="text-2xl font-bold text-red-400">
                {validationMetrics.rmse.toLocaleString(undefined, {
                  maximumFractionDigits: 0
                })}
              </div>
              <div className="text-xs text-slate-500">Root Mean Squared Error</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="bg-slate-800 p-4 rounded-lg border border-slate-700"
            >
              <div className="text-sm text-slate-400 mb-1">MAE</div>
              <div className="text-2xl font-bold text-orange-400">
                {validationMetrics.mae.toLocaleString(undefined, {
                  maximumFractionDigits: 0
                })}
              </div>
              <div className="text-xs text-slate-500">Mean Absolute Error</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.19 }}
              className="bg-slate-800 p-4 rounded-lg border border-slate-700"
            >
              <div className="text-sm text-slate-400 mb-1">Coverage</div>
              <div className="text-2xl font-bold text-teal-400">
                {validationMetrics.coverage
                  ? validationMetrics.coverage.toFixed(1) + '%'
                  : 'N/A'}
              </div>
              <div className="text-xs text-slate-500">
                % inside 95% credible interval
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
              className="bg-slate-800 p-4 rounded-lg border border-slate-700"
            >
              <div className="text-sm text-slate-400 mb-1">Test Points</div>
              <div className="text-2xl font-bold text-sky-400">
                {validationMetrics.totalPoints || 0}
              </div>
              <div className="text-xs text-slate-500">Validation samples</div>
            </motion.div>
          </div>
        )}

        {resultsReady && (
          <div className="mb-6 flex gap-3">
            <button
              onClick={downloadResults}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded shadow"
            >
              Download Results (zip)
            </button>
          </div>
        )}

        {resultsReady && predictions.length > 0 && selectedCountries.length > 0 && (
          <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Play size={18} />
              Predicted Foreign Population by Country — Forecast to {targetYear}
            </h3>
            <div
              id="chart-container"
              ref={chartRef}
              style={{ width: '100%', height: 360 }}
              className="rounded"
            >
              <ResponsiveContainer>
                <LineChart data={chartDataWithUncertainty}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="year" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip wrapperStyle={{ backgroundColor: '#0f172a' }} />
                  <Legend />
                  {selectedCountries.map((country, idx) => (
                    <Line
                      key={country}
                      type="monotone"
                      dataKey={country}
                      stroke={colors[idx % colors.length]}
                      dot={{ stroke: dotColors[idx % dotColors.length], r: 2 }}
                      strokeWidth={2}
                      activeDot={{ r: 4 }}
                      isAnimationActive={true}
                      animationDuration={900}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {resultsReady && renderTransitionMatrix()}
        {resultsReady && renderModelExplanation()}
      </div>
    </div>
  );
}

/* ---------------- Export with ErrorBoundary ---------------- */
export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}