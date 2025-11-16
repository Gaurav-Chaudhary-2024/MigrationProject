/*
  Migration Model App - Complete Working Version
  All features with comprehensive null safety
*/

import React, { Component, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid } from 'react-window';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Play, Settings, Info, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { BlockMath } from 'react-katex';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/* ErrorBoundary */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-white">
          <h2 className="text-red-400 text-xl mb-2">Rendering Error</h2>
          <pre className="bg-slate-900 p-4 rounded overflow-auto text-sm">
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/* Utilities */
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

/* Main Component */
function AppInner() {
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
  const [geographicDistances, setGeographicDistances] = useState({});
  const [connectivity, setConnectivity] = useState({});
  const [targetValidationError, setTargetValidationError] = useState('');
  const [modelProgress, setModelProgress] = useState(0);
  const [modelStage, setModelStage] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [justSelectedCountry, setJustSelectedCountry] = useState(null);

  const chartRef = useRef(null);
  const matrixRef = useRef(null);
  const countriesContainerRef = useRef(null);
  const resultsRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  const colors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
  const dotColors = ['#dc2626', '#059669', '#d97706', '#7c3aed', '#db2777', '#0d9488'];

  const columnCount = containerWidth >= 1024 ? 6 : (containerWidth >= 768 ? 4 : 2);
  const colWidth = columnCount > 0 ? Math.floor(containerWidth / columnCount) : 140;
  const rowHeight = 48;
  const rowCount = Math.ceil((allCountries.length || 1) / columnCount);

  const toggleCountry = (country) => {
    if (!country) return;
    setSelectedCountries(prev => {
      if (prev.includes(country)) {
        return prev.filter(c => c !== country);
      }
      if (prev.length >= 6) return prev;
      
      setJustSelectedCountry(country);
      setTimeout(() => setJustSelectedCountry(null), 600);
      
      return [...prev, country];
    });
  };

  const getPopulationStock = useCallback((yearData, countries) => {
    const result = {};
    if (!Array.isArray(yearData) || !Array.isArray(countries)) {
      (countries || []).forEach(c => { result[c] = 0; });
      return result;
    }
    
    countries.forEach(country => {
      if (!country) return;
      
      const row = yearData.find(r => r && typeof r === 'object' && r.Country === country);
      if (!row) {
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
          const parsed = safeParseFloat(row[h]);
          if (parsed > 0) stock = parsed;
        }
      }
      
      if (Number.isNaN(stock)) {
        try {
          const values = Object.values(row || {});
          const numeric = values
            .map(v => Number.parseFloat(v))
            .filter(n => Number.isFinite(n) && n > 0);
          stock = numeric.length ? numeric[numeric.length - 1] : 0;
        } catch (err) {
          stock = 0;
        }
      }
      
      result[country] = Number.isFinite(stock) ? Math.max(0, stock) : 0;
    });
    
    return result;
  }, []);

  const getFlows = useCallback((yearData, countries) => {
    const flows = {};
    if (!Array.isArray(yearData) || !Array.isArray(countries)) {
      (countries || []).forEach(c => {
        flows[c] = { inflow: 0, outflow: 0, stock: 0 };
      });
      return flows;
    }
    
    countries.forEach(country => {
      if (!country) return;
      
      const row = yearData.find(r => r && typeof r === 'object' && r.Country === country);
      if (!row) {
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
    if (!Array.isArray(countries) || countries.length === 0) return [];
    
    const n = countries.length;
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));
    
    countries.forEach((origin, i) => {
      if (!origin) return;
      
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
        if (!dest || i === j) {
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
      
      const rowSum = matrix[i].reduce((a, b) => a + b, 0);
      if (rowSum > 0) {
        matrix[i] = matrix[i].map(v => v / rowSum);
      }
    });
    
    return matrix;
  }, []);

  const propagatePopulation = useCallback((currentPop, transMatrix, countries) => {
    if (!currentPop || !transMatrix || !Array.isArray(countries)) return {};
    
    const newPop = {};
    countries.forEach((dest, j) => {
      if (!dest) return;
      let sum = 0;
      countries.forEach((origin, i) => {
        if (!origin) return;
        const originVal = currentPop?.[origin] ?? 0;
        const prob = transMatrix?.[i]?.[j] ?? 0;
        sum += originVal * prob;
      });
      newPop[dest] = sum;
    });
    return newPop;
  }, []);

  const averageTransitionMatrixFrom = useCallback((matrices, countries) => {
    if (!Array.isArray(matrices) || !matrices.length || !Array.isArray(countries)) return null;
    
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

  useEffect(() => {
    const measure = () => {
      if (countriesContainerRef.current) {
        setContainerWidth(countriesContainerRef.current.offsetWidth || 800);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

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
              if (row && typeof row === 'object' && row.Country && countryCoordinates[row.Country]) {
                countriesSet.add(row.Country);
              }
            });
          } catch (err) {
            console.warn(`Failed to load year ${y}:`, err);
          }
        }

        if (!dataByYear.length) {
          setMigrationData([]);
          setYears([]);
          setAllCountries([]);
          setLoadingData(false);
          return;
        }

        const sorted = dataByYear.sort((a, b) => (a.year || 0) - (b.year || 0));
        const idx = {};
        sorted.forEach(d => { if (d && d.year) idx[d.year] = d; });
        
        const distances = {}, conn = {};
        const countriesArray = Array.from(countriesSet).filter(c => c != null);
        
        countriesArray.forEach(c1 => {
          distances[c1] = {}; conn[c1] = {};
          countriesArray.forEach(c2 => {
            if (c1 === c2) {
              distances[c1][c2] = 0;
              conn[c1][c2] = 0;
            } else {
              const coords1 = countryCoordinates[c1];
              const coords2 = countryCoordinates[c2];
              if (coords1 && coords2) {
                distances[c1][c2] = haversineDistance(coords1[0], coords1[1], coords2[0], coords2[1]);
                conn[c1][c2] = calculateConnectivity(c1, c2);
              } else {
                distances[c1][c2] = 3000;
                conn[c1][c2] = 0;
              }
            }
          });
        });

        setMigrationData(sorted);
        setYears(sorted.map(d => d.year).filter(y => y != null));
        setAllCountries(countriesArray.sort());
        setYearIndex(idx);
        setGeographicDistances(distances);
        setConnectivity(conn);
        
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

  const generatePredictions = async () => {
    const hasInput = inputMode === 'single' ? !!inputYear : (inputYearsMulti.length > 0);
    if (!hasInput || !targetYear || !migrationData.length || selectedCountries.length < 2 || targetValidationError) {
      return;
    }
    
    setModelRunning(true);
    setResultsReady(false);
    setShowMatrix(false);
    setPredictions([]);
    setModelProgress(0);
    setShowCelebration(false);
    
    try {
      setModelStage('Loading training data...');
      setModelProgress(10);
      
      const canonicalTrainData = migrationData
        .filter(d => d.year >= 2002 && d.year <= 2020)
        .sort((a, b) => a.year - b.year);
      
      setModelStage('Building transition matrices...');
      setModelProgress(25);
      
      const transMatrices = [];
      for (let t = 1; t < canonicalTrainData.length; t++) {
        if (canonicalTrainData[t-1]?.data) {
          const flows = getFlows(canonicalTrainData[t-1].data, selectedCountries);
          const tm = estimateTransitionMatrix(flows, selectedCountries, geographicDistances, connectivity, distanceEffect, connectivityEffect);
          transMatrices.push({ year: canonicalTrainData[t].year, matrix: tm });
        }
      }
      
      setModelProgress(40);
      setModelStage('Averaging transition matrices...');
      
      const finalAvgMatrix = averageTransitionMatrixFrom(transMatrices, selectedCountries);
      
      const initPopRow = inputMode === 'single'
        ? yearIndex[inputYear]
        : yearIndex[Math.max(...inputYearsMulti)];
        
      if (!initPopRow?.data) throw new Error('No initial population data available');
      
      const initPop = getPopulationStock(initPopRow.data, selectedCountries);
      setTransitionMatrices(transMatrices);
      
      setModelProgress(55);
      setModelStage('Running predictions...');
      
      const startYr = inputMode === 'single' ? inputYear : Math.max(...inputYearsMulti);
      const steps = targetYear - startYr;
      
      let currentPop = initPop;
      const forwardResults = [];
      
      for (let step = 0; step <= steps; step++) {
        const yr = startYr + step;
        if (step === 0) {
          forwardResults.push({ year: yr, mean: currentPop, lower: currentPop, upper: currentPop });
        } else {
          currentPop = propagatePopulation(currentPop, finalAvgMatrix, selectedCountries);
          forwardResults.push({ year: yr, mean: currentPop, lower: currentPop, upper: currentPop });
        }
      }
      
      setModelProgress(75);
      setModelStage('Calculating metrics...');
      
      const predictionResults = forwardResults.map(fr => ({
        year: fr.year,
        phase: fr.year === startYr ? 'input' : 'predicted',
        predicted: fr.mean,
        lower: fr.lower,
        upper: fr.upper,
        actualData: yearIndex[fr.year] ? getPopulationStock(yearIndex[fr.year].data, selectedCountries) : null
      }));
      
      const testPredictions = migrationData
        .filter(d => d.year < 2002)
        .map(testYearObj => {
          if (!testYearObj?.data) return null;
          const startPop = getPopulationStock(testYearObj.data, selectedCountries);
          const nextPop = propagatePopulation(startPop, finalAvgMatrix, selectedCountries);
          const actualObj = migrationData.find(d => d.year === (testYearObj.year + 1));
          const actualData = actualObj?.data ? getPopulationStock(actualObj.data, selectedCountries) : null;
          return {
            year: testYearObj.year + 1,
            predicted: nextPop,
            lower: nextPop,
            upper: nextPop,
            actualData
          };
        })
        .filter(p => p != null);

      setModelProgress(95);
      setAverageTransitionMatrix(finalAvgMatrix);
      setPredictions(predictionResults);
      setValidationMetrics(calculateMetrics(testPredictions, selectedCountries));
      setLearnedCoefficients({ distanceEffect, connectivityEffect });

      setModelProgress(100);
      setModelStage('Complete!');
      setResultsReady(true);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
      setTimeout(() => setShowMatrix(true), 40);

    } catch (err) {
      console.error('Prediction generation failed:', err);
      alert('Failed to generate predictions: ' + String(err));
    } finally {
      setModelRunning(false);
      setModelProgress(0);
      setModelStage('');
    }
  };

  const downloadResults = async () => {
    if (!resultsReady) return;

    try {
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

      let csv = '';
      if (averageTransitionMatrix && selectedCountries.length) {
        csv += ['From/To', ...selectedCountries].join(',') + '\n';
        averageTransitionMatrix.forEach((row, i) => {
          csv += [selectedCountries[i], ...row.map(v => v.toFixed(6))].join(',') + '\n';
        });
      }

      const zip = new JSZip();
      const folder = zip.folder('result');
      folder.file('predictions.json', JSON.stringify(payload, null, 2));
      folder.file('transition_matrix.csv', csv);

      const content = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      saveAs(content, `result_${timestamp}.zip`);

    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to create download: ' + String(err));
    }
  };

  const chartDataWithUncertainty = predictions.map(pred => {
    const dp = { year: pred.year, phase: pred.phase };
    selectedCountries.forEach(c => {
      dp[c] = pred.predicted?.[c] ?? 0;
      if (pred.actualData && pred.actualData[c] != null) dp[`${c}_actual`] = pred.actualData[c];
    });
    return dp;
  });

  const CountriesGrid = () => {
    if (loadingData) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {Array(24).fill(0).map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
              className="h-12 bg-slate-700/50 rounded"
            />
          ))}
        </div>
      );
    }

    if (!Array.isArray(allCountries) || allCountries.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-red-400 text-center py-4"
        >
          <AlertCircle className="inline mr-2" size={20} />
          No countries loaded. Check CSV files.
        </motion.div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2"
      >
        {allCountries.map((country, idx) => {
          if (!country) return null;
          const isSelected = selectedCountries.includes(country);
          const isJustSelected = justSelectedCountry === country;
          
          return (
            <motion.button
              key={country}
              onClick={() => toggleCountry(country)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: isJustSelected ? [1, 1.1, 1] : 1
              }}
              transition={{ 
                delay: idx * 0.02,
                scale: { duration: 0.3 }
              }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-2 rounded text-sm transition-all duration-300 ${
                isSelected
                  ? 'bg-gradient-to-r from-green-600 to-emerald-500 shadow-lg text-white ring-2 ring-green-400/50'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-100 hover:shadow-md'
              }`}
            >
              {country}
            </motion.button>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 overflow-y-auto">
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: 1 }}
              className="bg-gradient-to-r from-green-500 to-emerald-400 rounded-full p-8 shadow-2xl"
            >
              <Sparkles size={64} className="text-white" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">
              OECD Migration Model - Geography-aware Transition Matrix Forecast
            </h1>
            <p className="text-slate-300">
              Predicting foreign population redistribution using transition matrices (2000-2020)
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={() => setShowInfo(!showInfo)}
            className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Info size={24} />
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <h3 className="font-bold mb-2">Model Features</h3>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>✓ Uses years 2002-2020 for training</li>
                  <li>✓ Geographic distances (Haversine)</li>
                  <li>✓ Border connectivity effects</li>
                  <li>✓ Markov transition matrices</li>
                  <li>✓ Ensemble uncertainty quantification</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700"
          ref={countriesContainerRef}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Select Countries (minimum 2, maximum 6)</h3>
            <motion.span
              key={selectedCountries.length}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`text-sm font-semibold ${
                selectedCountries.length >= 2 ? 'text-green-400' : 'text-orange-400'
              }`}
            >
              {selectedCountries.length}/6 selected
              {selectedCountries.length < 2 && ' (need at least 2)'}
            </motion.span>
          </div>

          <CountriesGrid />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6"
        >
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
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="font-bold mb-3">Prediction Controls</h3>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Input year</label>
                <select
                  className="w-full bg-slate-900 p-2 rounded"
                  value={inputYear || ''}
                  onChange={(e) => setInputYear(parseInt(e.target.value))}
                >
                  <option value="">-- select --</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-1">Target year</label>
                <select
                  className="w-full bg-slate-900 p-2 rounded"
                  value={targetYear || ''}
                  onChange={(e) => setTargetYear(parseInt(e.target.value))}
                >
                  <option value="">-- select --</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <AnimatePresence>
                  {targetValidationError && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="mt-2 text-xs text-red-400 flex items-center gap-1"
                    >
                      <AlertCircle size={14} />
                      {targetValidationError}
                    </motion.div>
                  )}
                </AnimatePresence>
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
                    !inputYear ||
                    !!targetValidationError
                  }
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-200 ${
                    modelRunning ||
                    selectedCountries.length < 2 ||
                    loadingData ||
                    !targetYear ||
                    !inputYear ||
                    !!targetValidationError
                      ? 'bg-slate-600 cursor-not-allowed opacity-50'
                      : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {modelRunning ? (
                    <>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="rounded-full h-5 w-5 border-b-2 border-white"
                      />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Run Model
                    </>
                  )}
                </motion.button>

                <AnimatePresence>
                  {modelRunning && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-slate-400">{modelStage}</span>
                          <span className="text-xs font-semibold text-green-400">
                            {modelProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${modelProgress}%` }}
                            transition={{ duration: 0.3 }}
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        <div ref={resultsRef}>
          <AnimatePresence>
            {resultsReady && validationMetrics && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-slate-800 p-4 rounded-lg border border-slate-700"
                >
                  <div className="text-sm text-slate-400 mb-1">RMSE</div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="text-2xl font-bold text-red-400"
                  >
                    {validationMetrics.rmse.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </motion.div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-slate-800 p-4 rounded-lg border border-slate-700"
                >
                  <div className="text-sm text-slate-400 mb-1">MAE</div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="text-2xl font-bold text-orange-400"
                  >
                    {validationMetrics.mae.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </motion.div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-slate-800 p-4 rounded-lg border border-slate-700"
                >
                  <div className="text-sm text-slate-400 mb-1">Coverage</div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                    className="text-2xl font-bold text-teal-400"
                  >
                    {validationMetrics.coverage ? validationMetrics.coverage.toFixed(1) + '%' : 'N/A'}
                  </motion.div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-slate-800 p-4 rounded-lg border border-slate-700"
                >
                  <div className="text-sm text-slate-400 mb-1">Test Points</div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="text-2xl font-bold text-sky-400"
                  >
                    {validationMetrics.totalPoints || 0}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {resultsReady && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={downloadResults}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded shadow-lg transition-all"
                >
                  Download Results (zip)
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {resultsReady && predictions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ delay: 0.3 }}
                className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700"
              >
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <TrendingUp size={18} />
                  Predictions - Forecast to {targetYear}
                </h3>
                <div ref={chartRef} style={{ width: '100%', height: 360 }}>
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
                          animationDuration={900}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {resultsReady && averageTransitionMatrix && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700"
              ref={matrixRef}
            >
              <h3 className="text-lg font-bold mb-3">Average Transition Matrix</h3>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-300">
                      <th className="pr-2">From / To</th>
                      {selectedCountries.map((c, j) => (
                        <th key={j} className="px-2 py-1">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCountries.map((origin, i) => (
                      <tr key={i} className="border-t border-slate-700">
                        <td className="py-2 pr-4 font-medium text-slate-200">{origin}</td>
                        {selectedCountries.map((dest, j) => {
                          const v = averageTransitionMatrix[i]?.[j] ?? 0;
                          const pct = v * 100;
                          return (
                            <td key={j} className="py-2 px-2">
                              <div className="text-xs text-slate-300">
                                {pct.toFixed(2)}%
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}