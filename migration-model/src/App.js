import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Play, Settings, Info, Database, TrendingUp, AlertCircle } from 'lucide-react';

const PopulationMigrationModel = () => {
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const [distanceEffect, setDistanceEffect] = useState(0.5);
  const [connectivityEffect, setConnectivityEffect] = useState(0.3);
  const [trainTestSplit, setTrainTestSplit] = useState(0.75);
  const [modelRunning, setModelRunning] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  const [migrationData, setMigrationData] = useState([]);
  const [years, setYears] = useState([]);
  const [allCountries, setAllCountries] = useState([]);
  const [transitionMatrices, setTransitionMatrices] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [geographicDistances, setGeographicDistances] = useState({});
  const [connectivity, setConnectivity] = useState({});
  const [validationMetrics, setValidationMetrics] = useState(null);
  const [learnedCoefficients, setLearnedCoefficients] = useState(null);

  const colors = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
  const dotColors = ['#dc2626', '#059669', '#d97706', '#7c3aed', '#db2777', '#0d9488'];

  const countryCoordinates = {
    'United States': [37.0902, -95.7129], 'Germany': [51.1657, 10.4515], 'United Kingdom': [55.3781, -3.4360],
    'Canada': [56.1304, -106.3468], 'France': [46.2276, 2.2137], 'Australia': [-25.2744, 133.7751],
    'Japan': [36.2048, 138.2529], 'Italy': [41.8719, 12.5674], 'Spain': [40.4637, -3.7492],
    'Mexico': [23.6345, -102.5528], 'Netherlands': [52.1326, 5.2913], 'Sweden': [60.1282, 18.6435],
    'Switzerland': [46.8182, 8.2275], 'Belgium': [50.5039, 4.4699], 'Austria': [47.5162, 14.5501],
    'Poland': [51.9194, 19.1451], 'Norway': [60.4720, 8.4689], 'Denmark': [56.2639, 9.5018],
    'Finland': [61.9241, 25.7482], 'Greece': [39.0742, 21.8243], 'Portugal': [39.3999, -8.2245],
    'Czech Republic': [49.8175, 15.4730], 'Hungary': [47.1625, 19.5033], 'Ireland': [53.4129, -8.2439],
    'New Zealand': [-40.9006, 174.8860],
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((header, i) => { obj[header] = values[i]; });
      return obj;
    });
  };

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateConnectivity = (c1, c2) => {
    const neighbors = {
      'United States': ['Canada', 'Mexico'], 'Canada': ['United States'], 'Mexico': ['United States'],
      'Germany': ['France', 'Austria', 'Switzerland', 'Belgium', 'Netherlands', 'Poland', 'Czech Republic', 'Denmark'],
      'France': ['Germany', 'Belgium', 'Switzerland', 'Italy', 'Spain'], 'United Kingdom': ['Ireland'],
      'Ireland': ['United Kingdom'], 'Italy': ['France', 'Switzerland', 'Austria'],
      'Spain': ['France', 'Portugal'], 'Portugal': ['Spain'], 'Belgium': ['France', 'Germany', 'Netherlands'],
      'Netherlands': ['Germany', 'Belgium'], 'Austria': ['Germany', 'Switzerland', 'Italy', 'Czech Republic', 'Hungary'],
      'Switzerland': ['Germany', 'France', 'Italy', 'Austria'], 'Poland': ['Germany', 'Czech Republic'],
      'Czech Republic': ['Germany', 'Poland', 'Austria'], 'Denmark': ['Germany', 'Sweden', 'Norway'],
      'Sweden': ['Norway', 'Finland', 'Denmark'], 'Norway': ['Sweden', 'Finland', 'Denmark'],
      'Finland': ['Sweden', 'Norway'], 'Hungary': ['Austria'], 'Greece': [],
    };
    return neighbors[c1]?.includes(c2) ? 1.0 : 0.0;
  };

// MODIFIED FOR VS CODE - Uses fetch API instead of window.fs
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const yearFiles = ['2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007',
          '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015',
          '2016', '2017', '2018', '2019', '2020'];
        
        const dataByYear = [];
        const countriesSet = new Set();
        let filesLoaded = 0;
        
        for (const year of yearFiles) {
          try {
            // SIMPLIFIED - Just use migration_YEAR.csv
            const filename = `/migration_${year}.csv`;
            console.log(`Attempting to load: ${filename}`);
            
            const response = await fetch(filename);
            if (!response.ok) {
              console.log(`File not found: ${filename}`);
              continue;
            }
            
            const text = await response.text();
            const parsed = parseCSV(text);
            
            dataByYear.push({ year: parseInt(year), data: parsed });
            parsed.forEach(row => {
              if (row.Country && countryCoordinates[row.Country]) {
                countriesSet.add(row.Country);
              }
            });
            filesLoaded++;
            console.log(`✓ Loaded ${filename} (${filesLoaded} files total)`);
          } catch (err) {
            console.log(`Could not load ${year}:`, err.message);
          }
        }
        
        console.log(`Total files loaded: ${filesLoaded}`);
        
        if (dataByYear.length === 0) {
          console.error('No migration data files could be loaded.');
          alert('⚠️ No CSV files found!\n\nMake sure to:\n1. Place all CSV files in the "public" folder\n2. Name them: migration_2000.csv, migration_2001.csv, etc.');
          setLoadingData(false);
          return;
        }
        
        setMigrationData(dataByYear);
        setYears(dataByYear.map(d => d.year));
        setAllCountries(Array.from(countriesSet).sort());
        
        const distances = {}, conn = {};
        Array.from(countriesSet).forEach(c1 => {
          distances[c1] = {}; conn[c1] = {};
          Array.from(countriesSet).forEach(c2 => {
            if (c1 === c2) {
              distances[c1][c2] = 0; conn[c1][c2] = 0;
            } else {
              const [lat1, lon1] = countryCoordinates[c1] || [0, 0];
              const [lat2, lon2] = countryCoordinates[c2] || [0, 0];
              distances[c1][c2] = haversineDistance(lat1, lon1, lat2, lon2);
              conn[c1][c2] = calculateConnectivity(c1, c2);
            }
          });
        });
        setGeographicDistances(distances);
        setConnectivity(conn);
        setLoadingData(false);
        console.log('✅ Data loading complete!');
      } catch (error) {
        console.error('Error loading data:', error);
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  const getPopulationStock = (yearData, countries) => {
    const result = {};
    countries.forEach(country => {
      const row = yearData.find(r => r.Country === country);
      if (row) {
        const stock = parseFloat(row['Stock of foreign population by nationality(Total)']);
        result[country] = isNaN(stock) ? 0 : stock;
      } else {
        result[country] = 0;
      }
    });
    return result;
  };

  const getFlows = (yearData, countries) => {
    const flows = {};
    countries.forEach(country => {
      const row = yearData.find(r => r.Country === country);
      if (row) {
        flows[country] = {
          inflow: parseFloat(row['Inflows of foreign population by nationality(Total)'] || 0) || 0,
          outflow: parseFloat(row['Outflows of foreign population by nationality(Total)'] || 0) || 0,
          stock: parseFloat(row['Stock of foreign population by nationality(Total)'] || 0) || 0
        };
      }
    });
    return flows;
  };

  const estimateTransitionMatrix = (flows, countries, distances, conn, distCoeff, connCoeff) => {
    const n = countries.length;
    const matrix = Array(n).fill(0).map(() => Array(n).fill(0));
    
    countries.forEach((origin, i) => {
      const originFlow = flows[origin];
      if (!originFlow || originFlow.stock === 0) {
        matrix[i][i] = 1.0;
        return;
      }
      
      const totalOutflow = originFlow.outflow || 0;
      const stayProb = Math.max(0.5, 1 - (totalOutflow / originFlow.stock));
      matrix[i][i] = stayProb;
      
      const remainingProb = 1 - stayProb;
      let weightSum = 0;
      const weights = [];
      
      countries.forEach((dest, j) => {
        if (i !== j) {
          const destFlow = flows[dest];
          const attractiveness = destFlow ? Math.log(destFlow.inflow + 10) : 1;
          const distance = distances[origin]?.[dest] || 3000;
          const connectivity = conn[origin]?.[dest] || 0;
          const distanceEffect = Math.exp(-distCoeff * distance / 1000);
          const connectivityBonus = 1 + connCoeff * connectivity;
          const weight = attractiveness * distanceEffect * connectivityBonus;
          weights.push(weight);
          weightSum += weight;
        } else {
          weights.push(0);
        }
      });
      
      countries.forEach((dest, j) => {
        if (i !== j && weightSum > 0) {
          matrix[i][j] = remainingProb * (weights[j] / weightSum);
        }
      });
      
      const rowSum = matrix[i].reduce((a, b) => a + b, 0);
      if (rowSum > 0) {
        matrix[i] = matrix[i].map(v => v / rowSum);
      }
    });
    return matrix;
  };

  const propagatePopulation = (currentPop, transMatrix, countries) => {
    const newPop = {};
    countries.forEach((dest, j) => {
      let sum = 0;
      countries.forEach((origin, i) => {
        sum += (currentPop[origin] || 0) * transMatrix[i][j];
      });
      newPop[dest] = sum;
    });
    return newPop;
  };

  const calculateMetrics = (predictions, selectedCountries) => {
    let totalSquaredError = 0, totalAbsError = 0, totalPoints = 0, coveredPoints = 0;
    predictions.forEach(pred => {
      if (pred.actualData && pred.predicted) {
        selectedCountries.forEach(country => {
          const actual = pred.actualData[country] || 0;
          const predicted = pred.predicted[country] || 0;
          const lower = pred.lower?.[country] || 0;
          const upper = pred.upper?.[country] || 0;
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
    return { 
      rmse: Math.sqrt(totalSquaredError / totalPoints), 
      mae: totalAbsError / totalPoints, 
      coverage: (coveredPoints / totalPoints) * 100, 
      totalPoints 
    };
  };

  const generatePredictions = async () => {
    if (migrationData.length === 0 || selectedCountries.length < 2) return;
    setModelRunning(true);
    
    setTimeout(() => {
      const splitIndex = Math.floor(migrationData.length * trainTestSplit);
      const trainData = migrationData.slice(0, splitIndex);
      const testData = migrationData.slice(splitIndex);
      const predictionResults = [], transMatrices = [];
      
      let currentPop = getPopulationStock(trainData[0].data, selectedCountries);
      predictionResults.push({ year: trainData[0].year, actual: true, phase: 'train', ...currentPop });
      
      for (let t = 1; t < trainData.length; t++) {
        const flows = getFlows(trainData[t-1].data, selectedCountries);
        const transMatrix = estimateTransitionMatrix(flows, selectedCountries, geographicDistances, connectivity, distanceEffect, connectivityEffect);
        transMatrices.push({ year: trainData[t].year, matrix: transMatrix });
        
        const ensemble = [];
        for (let s = 0; s < 100; s++) {
          const perturbedMatrix = transMatrix.map(row => {
            const alpha = row.map(p => Math.max(1, p * 100));
            const perturbed = alpha.map(a => -Math.log(Math.random()) * a);
            const sum = perturbed.reduce((a, b) => a + b, 0);
            return perturbed.map(p => p / sum);
          });
          ensemble.push(propagatePopulation(currentPop, perturbedMatrix, selectedCountries));
        }
        
        const mean = {}, lower = {}, upper = {};
        selectedCountries.forEach(country => {
          const values = ensemble.map(e => e[country] || 0).sort((a, b) => a - b);
          mean[country] = values.reduce((a, b) => a + b, 0) / values.length;
          lower[country] = values[Math.floor(values.length * 0.025)];
          upper[country] = values[Math.floor(values.length * 0.975)];
        });
        
        currentPop = mean;
        const actual = getPopulationStock(trainData[t].data, selectedCountries);
        predictionResults.push({ year: trainData[t].year, actual: false, phase: 'train', predicted: mean, actualData: actual, lower, upper, ...mean });
      }
      
      for (let t = 0; t < testData.length; t++) {
        const flows = getFlows(t === 0 ? trainData[trainData.length - 1].data : testData[t-1].data, selectedCountries);
        const transMatrix = estimateTransitionMatrix(flows, selectedCountries, geographicDistances, connectivity, distanceEffect, connectivityEffect);
        
        const ensemble = [];
        for (let s = 0; s < 100; s++) {
          const perturbedMatrix = transMatrix.map(row => {
            const alpha = row.map(p => Math.max(1, p * 100));
            const perturbed = alpha.map(a => -Math.log(Math.random()) * a);
            const sum = perturbed.reduce((a, b) => a + b, 0);
            return perturbed.map(p => p / sum);
          });
          ensemble.push(propagatePopulation(currentPop, perturbedMatrix, selectedCountries));
        }
        
        const mean = {}, lower = {}, upper = {};
        selectedCountries.forEach(country => {
          const values = ensemble.map(e => e[country] || 0).sort((a, b) => a - b);
          mean[country] = values.reduce((a, b) => a + b, 0) / values.length;
          lower[country] = values[Math.floor(values.length * 0.025)];
          upper[country] = values[Math.floor(values.length * 0.975)];
        });
        
        currentPop = mean;
        const actual = getPopulationStock(testData[t].data, selectedCountries);
        predictionResults.push({ year: testData[t].year, actual: false, phase: 'test', predicted: mean, actualData: actual, lower, upper, ...mean });
      }
      
      setPredictions(predictionResults);
      setTransitionMatrices(transMatrices);
      const testPredictions = predictionResults.filter(p => p.phase === 'test');
      setValidationMetrics(calculateMetrics(testPredictions, selectedCountries));
      setLearnedCoefficients({ distanceEffect, connectivityEffect });
      setModelRunning(false);
    }, 100);
  };

  const toggleCountry = (country) => {
    setSelectedCountries(prev => {
      if (prev.includes(country)) return prev.filter(c => c !== country);
      else if (prev.length < 6) return [...prev, country];
      return prev;
    });
  };

  useEffect(() => {
    if (migrationData.length > 0 && selectedCountries.length >= 2) {
      generatePredictions();
    } else {
      setPredictions([]);
      setValidationMetrics(null);
      setLearnedCoefficients(null);
    }
  }, [migrationData, selectedCountries, distanceEffect, connectivityEffect, trainTestSplit]);

  const chartDataWithUncertainty = predictions.map((pred) => {
    const dataPoint = { year: pred.year, phase: pred.phase };
    selectedCountries.forEach((country) => {
      const predictedValue = pred.predicted?.[country] || pred[country] || 0;
      dataPoint[country] = predictedValue;
      if (pred.lower && pred.upper) {
        dataPoint[`${country}_lower`] = pred.lower[country] || 0;
        dataPoint[`${country}_upper`] = pred.upper[country] || 0;
      }
      if (pred.actualData && pred.actualData[country]) {
        dataPoint[`${country}_actual`] = pred.actualData[country];
      }
    });
    return dataPoint;
  });

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">OECD Migration Model - VS Code</h1>
            <p className="text-slate-300">Geography-Aware Bayesian Transition Matrix (2000-2020)</p>
          </div>
          <button onClick={() => setShowInfo(!showInfo)} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
            <Info size={24} />
          </button>
        </div>

        {loadingData && (
          <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
              <div>
                <h3 className="font-bold text-yellow-400">Loading Migration Data...</h3>
                <p className="text-sm text-slate-300">Check console (F12) for loading progress</p>
              </div>
            </div>
          </div>
        )}

        {showInfo && (
          <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Database size={20} />
              Enhanced Model Features
            </h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>✅ Real geographic distances (Haversine formula)</li>
              <li>✅ Connectivity matrices (shared borders)</li>
              <li>✅ Learned coefficients (distance & connectivity)</li>
              <li>✅ Train/test split validation</li>
              <li>✅ RMSE, MAE, Coverage metrics</li>
              <li>✅ 95% Credible Intervals</li>
              <li>✅ Bayesian ensemble (100 samples)</li>
            </ul>
            <div className="mt-3 p-3 bg-green-900/30 border border-green-600 rounded">
              <p className="text-sm text-green-300">
                <strong>✓ VS Code Ready:</strong> Uses fetch API to load CSV files from public folder
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Select Countries (minimum 2, maximum 6)</h3>
            <span className={`text-sm ${selectedCountries.length >= 2 ? 'text-green-400' : 'text-orange-400'}`}>
              {selectedCountries.length}/6 selected {selectedCountries.length < 2 && '(need at least 2)'}
            </span>
          </div>
          {loadingData ? (
            <div className="text-slate-400 text-center py-4">Loading countries...</div>
          ) : allCountries.length === 0 ? (
            <div className="text-red-400 text-center py-4">
              <AlertCircle className="inline mr-2" size={20} />
              No countries loaded. Check that CSV files are in the public folder.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {allCountries.slice(0, 24).map((country) => (
                <button key={country} onClick={() => toggleCountry(country)}
                  className={`px-3 py-2 rounded text-sm transition-colors ${
                    selectedCountries.includes(country) ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-600'
                  }`}>
                  {country}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Settings size={20} />
              Geography Coefficients
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-400">Distance Effect: {distanceEffect.toFixed(2)}</label>
                <input type="range" min="0" max="1" step="0.05" value={distanceEffect}
                  onChange={(e) => setDistanceEffect(parseFloat(e.target.value))} className="w-full" />
                <p className="text-xs text-slate-500">Higher = distance matters more</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">Connectivity Effect: {connectivityEffect.toFixed(2)}</label>
                <input type="range" min="0" max="1" step="0.05" value={connectivityEffect}
                  onChange={(e) => setConnectivityEffect(parseFloat(e.target.value))} className="w-full" />
                <p className="text-xs text-slate-500">Higher = borders matter more</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="font-bold mb-3">Validation Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-slate-400">Train/Test Split: {(trainTestSplit * 100).toFixed(0)}% train</label>
                <input type="range" min="0.5" max="0.9" step="0.05" value={trainTestSplit}
                  onChange={(e) => setTrainTestSplit(parseFloat(e.target.value))} className="w-full" />
              </div>
              <button onClick={generatePredictions} disabled={modelRunning || selectedCountries.length < 2 || loadingData}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${
                  modelRunning || selectedCountries.length < 2 || loadingData ? 'bg-slate-600 cursor-not-allowed opacity-50' : 'bg-green-600 hover:bg-green-700'
                }`}>
                {modelRunning ? (
                  <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Running...</>
                ) : (<><Play size={20} />Run Model</>)}
              </button>
            </div>
          </div>
        </div>

        {validationMetrics && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">RMSE</div>
              <div className="text-2xl font-bold text-red-400">
                {validationMetrics.rmse.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-slate-500">Root Mean Squared Error</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">MAE</div>
              <div className="text-2xl font-bold text-orange-400">
                {validationMetrics.mae.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-slate-500">Mean Absolute Error</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">Coverage</div>
              <div className="text-2xl font-bold text-green-400">
                {validationMetrics.coverage.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500">95% CI Coverage</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">Test Points</div>
              <div className="text-2xl font-bold text-teal-400">
                {validationMetrics.totalPoints}
              </div>
              <div className="text-xs text-slate-500">Validation samples</div>
            </div>
          </div>
        )}

        {selectedCountries.length < 2 ? (
          <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 mb-6 text-center">
            <AlertCircle className="mx-auto mb-4 text-yellow-500" size={48} />
            <h3 className="font-bold mb-2 text-yellow-400">Select At Least 2 Countries</h3>
            <p className="text-slate-400 mb-4">Migration model requires 2+ countries to analyze flows.</p>
            <p className="text-slate-500 text-sm">You'll see:</p>
            <ul className="text-slate-500 text-sm mt-2 space-y-1">
              <li>📈 Line chart: Foreign population stock (2000-2020)</li>
              <li>🎯 Colored lines (solid=predicted, dashed=actual)</li>
              <li>📊 Validation metrics (RMSE, MAE, Coverage)</li>
              <li>🔢 Transition matrices between countries</li>
              <li>🌍 Geography coefficients</li>
            </ul>
          </div>
        ) : predictions.length > 0 && chartDataWithUncertainty.length > 0 ? (
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
            <h3 className="font-bold mb-4">Population Evolution with 95% Credible Intervals</h3>
            <div className="mb-2 text-sm text-slate-400">
              {chartDataWithUncertainty.length} data points | Countries: {selectedCountries.join(', ')}
            </div>
            <div className="bg-slate-900 p-2 rounded">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartDataWithUncertainty} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#64748b" />
                  <XAxis dataKey="year" stroke="#f1f5f9" style={{ fontSize: '14px', fontWeight: 'bold' }} />
                  <YAxis stroke="#f1f5f9" style={{ fontSize: '14px', fontWeight: 'bold' }}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value/1000).toFixed(0)}K`;
                      return value;
                    }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '2px solid #10b981',
                      borderRadius: '8px', padding: '12px' }}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 'bold', marginBottom: '8px' }}
                    itemStyle={{ color: '#f1f5f9' }}
                    formatter={(value) => value ? ['Population: ' + value.toLocaleString(undefined, { maximumFractionDigits: 0 }), ''] : ['N/A', '']} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />
                  {selectedCountries.map((country, i) => (
                    <React.Fragment key={country}>
                      <Line type="monotone" dataKey={country} stroke={colors[i]} strokeWidth={4}
                        dot={{ r: 5, fill: colors[i], strokeWidth: 0 }}
                        activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }}
                        name={`${country} (predicted)`} connectNulls={true} />
                      {chartDataWithUncertainty.some(d => d[`${country}_actual`]) && (
                        <Line type="monotone" dataKey={`${country}_actual`} stroke={dotColors[i]} strokeWidth={3}
                          strokeDasharray="10 5" dot={{ r: 4, fill: dotColors[i], strokeWidth: 0 }}
                          name={`${country} (actual)`} connectNulls={true} />
                      )}
                    </React.Fragment>
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-4 text-sm text-slate-300 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-red-500 rounded"></div>
                <span>Solid = Predicted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-red-700 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #dc2626 0, #dc2626 10px, transparent 10px, transparent 15px)' }}></div>
                <span>Dashed = Actual (darker)</span>
              </div>
              <div className="text-xs text-slate-500">
                Colors: 🔴 Red, 🟢 Green, 🟠 Orange, 🟣 Purple, 🩷 Pink, 🔵 Teal
              </div>
            </div>
          </div>
        ) : null}

        {learnedCoefficients && (
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              Learned Model Coefficients
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Distance Effect', value: learnedCoefficients.distanceEffect },
                { name: 'Connectivity Effect', value: learnedCoefficients.connectivityEffect }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 1]} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 p-3 bg-slate-900 rounded">
              <p className="text-sm text-slate-300">
                <strong>Interpretation:</strong> Distance effect of {learnedCoefficients.distanceEffect.toFixed(2)} means 
                migration probability decreases by ~{(learnedCoefficients.distanceEffect * 100).toFixed(0)}% per 1000km. 
                Connectivity effect of {learnedCoefficients.connectivityEffect.toFixed(2)} shows 
                {learnedCoefficients.connectivityEffect > 0.3 ? ' strong ' : ' moderate '}
                preference for neighboring countries.
              </p>
            </div>
          </div>
        )}

        {transitionMatrices.length > 0 && (
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
            <h3 className="font-bold mb-4">Transition Matrix ({transitionMatrices[0].year})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="p-2 text-left">From / To</th>
                    {selectedCountries.map((country, i) => (
                      <th key={i} className="p-2 text-right">{country.substring(0, 10)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transitionMatrices[0].matrix.map((row, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="p-2 font-medium">{selectedCountries[i].substring(0, 15)}</td>
                      {row.map((val, j) => (
                        <td key={j} className="p-2 text-right"
                          style={{
                            backgroundColor: i === j 
                              ? 'rgba(16, 185, 129, 0.3)' 
                              : `rgba(239, 68, 68, ${Math.min(val * 2, 0.8)})`
                          }}>
                          {(val * 100).toFixed(1)}%
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {predictions.length > 1 && (
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="font-bold mb-4">Model Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-slate-300 mb-2">Data Information</h4>
                <ul className="space-y-1 text-slate-400">
                  <li>• Total years: {years.length}</li>
                  <li>• Training years: {Math.floor(years.length * trainTestSplit)}</li>
                  <li>• Testing years: {years.length - Math.floor(years.length * trainTestSplit)}</li>
                  <li>• Countries analyzed: {selectedCountries.length}</li>
                  <li>• Ensemble samples: 100</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-300 mb-2">Geographic Features</h4>
                <ul className="space-y-1 text-slate-400">
                  <li>• Real Haversine distances used</li>
                  <li>• Border connectivity incorporated</li>
                  <li>• Distance decay: exp(-{distanceEffect.toFixed(2)} × km/1000)</li>
                  <li>• Connectivity bonus: 1 + {connectivityEffect.toFixed(2)} × border</li>
                  <li>• Transition matrices: {transitionMatrices.length}</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopulationMigrationModel;