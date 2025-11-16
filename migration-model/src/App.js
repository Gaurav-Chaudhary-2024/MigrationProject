/*
  Migration Model App (v22 - Final Enhanced Version)
  Last updated: 2025-11-10
  
  New Features:
  - Enhanced country selection grid with proper layout
  - Hover tooltips on parameter sliders
  - Scroll progress bar at top
  - Equations section moved below matrix
  - Model Summary Card
  - Enhanced chart visualization
*/

import React, {
  Component,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Play,
  Settings,
  Info,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Award,
  Hash,
} from "lucide-react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

/* Scroll Progress Component */
const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(10px)",
        zIndex: 1020,
      }}
    >
      <motion.div
        style={{
          scaleX,
          transformOrigin: "0%",
          height: "100%",
          background: "linear-gradient(90deg, #10b981, #34d399)",
        }}
      />
    </div>
  );
};

/* Tooltip Wrapper Component */
const TooltipSlider = ({ label, value, onChange, min, max, step, tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <label className="text-sm text-slate-400 mb-2 block">{label}</label>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="w-full"
        />
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 bg-slate-700 text-xs text-white px-3 py-2 rounded shadow-lg z-20 whitespace-nowrap"
              style={{ minWidth: "200px" }}
            >
              {tooltip}
              <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-700 transform rotate-45"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

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
    console.error("ErrorBoundary caught:", error);
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

/* Utility helpers */
const safeParseFloat = (v) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const parseCSV = (text) => {
  if (!text) return [];
  const lines = String(text).trim().split("\n").filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i];
    });
    return obj;
  });
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calculateConnectivity = (c1, c2) => {
  const neighbors = {
    "United States": ["Canada", "Mexico"],
    Canada: ["United States"],
    Mexico: ["United States"],
    Germany: [
      "France",
      "Austria",
      "Switzerland",
      "Belgium",
      "Netherlands",
      "Poland",
      "Czech Republic",
      "Denmark",
    ],
    France: ["Germany", "Belgium", "Switzerland", "Italy", "Spain"],
    "United Kingdom": ["Ireland"],
    Ireland: ["United Kingdom"],
    Italy: ["France", "Switzerland", "Austria"],
    Spain: ["France", "Portugal"],
    Portugal: ["Spain"],
    Belgium: ["France", "Germany", "Netherlands"],
    Netherlands: ["Germany", "Belgium"],
    Austria: ["Germany", "Switzerland", "Italy", "Czech Republic", "Hungary"],
    Switzerland: ["Germany", "France", "Italy", "Austria"],
    Poland: ["Germany", "Czech Republic"],
    "Czech Republic": ["Germany", "Poland", "Austria"],
    Denmark: ["Germany", "Sweden", "Norway"],
    Sweden: ["Norway", "Finland", "Denmark"],
    Norway: ["Sweden", "Finland", "Denmark"],
    Finland: ["Sweden", "Norway"],
    Hungary: ["Austria"],
    Greece: [],
  };
  return neighbors[c1]?.includes(c2) ? 1.0 : 0.0;
};

/* Animation variants */
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.02,
    },
  },
};

const celebrationBurst = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: [0, 1.2, 1],
    opacity: [0, 1, 1],
    transition: { duration: 0.6 },
  },
  exit: { scale: 0, opacity: 0 },
};

const shakeError = {
  initial: { x: 0 },
  animate: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
};

/* Main App Component */
function AppInner() {
  // State declarations
  const [migrationData, setMigrationData] = useState([]);
  const [years, setYears] = useState([]);
  const [allCountries, setAllCountries] = useState([]);
  const [yearIndex, setYearIndex] = useState({});
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [inputMode, setInputMode] = useState("single");
  const [inputYear, setInputYear] = useState(null);
  const [inputYearsMulti, setInputYearsMulti] = useState([]);
  const [targetYear, setTargetYear] = useState(null);
  const [distanceEffect, setDistanceEffect] = useState(0.5);
  const [connectivityEffect, setConnectivityEffect] = useState(0.3);
  const [ensembleSize, setEnsembleSize] = useState(100);
  const [rngSeed, setRngSeed] = useState("");
  const [expandedYears, setExpandedYears] = useState([]);
  const [trainingPairs, setTrainingPairs] = useState([]);
  const [transitionMatrices, setTransitionMatrices] = useState([]);
  const [averageTransitionMatrix, setAverageTransitionMatrix] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [validationMetrics, setValidationMetrics] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [modelRunning, setModelRunning] = useState(false);
  const [resultsReady, setResultsReady] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [geographicDistances, setGeographicDistances] = useState({});
  const [connectivity, setConnectivity] = useState({});
  const [targetValidationError, setTargetValidationError] = useState("");
  const [modelProgress, setModelProgress] = useState(0);
  const [modelStage, setModelStage] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);

  // Refs
  const chartRef = useRef(null);
  const matrixRef = useRef(null);
  const resultsRef = useRef(null);

  // Constants
  const colors = [
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
  ];

  const countryCoordinates = {
    "United States": [37.0902, -95.7129],
    Germany: [51.1657, 10.4515],
    "United Kingdom": [55.3781, -3.436],
    Canada: [56.1304, -106.3468],
    France: [46.2276, 2.2137],
    Australia: [-25.2744, 133.7751],
    Japan: [36.2048, 138.2529],
    Italy: [41.8719, 12.5674],
    Spain: [40.4637, -3.7492],
    Mexico: [23.6345, -102.5528],
    Netherlands: [52.1326, 5.2913],
    Sweden: [60.1282, 18.6435],
    Switzerland: [46.8182, 8.2275],
    Belgium: [50.5039, 4.4699],
    Austria: [47.5162, 14.5501],
    Poland: [51.9194, 19.1451],
    Norway: [60.472, 8.4689],
    Denmark: [56.2639, 9.5018],
    Finland: [61.9241, 25.7482],
    Greece: [39.0742, 21.8243],
    Portugal: [39.3999, -8.2245],
    "Czech Republic": [49.8175, 15.473],
    Hungary: [47.1625, 19.5033],
    Ireland: [53.4129, -8.2439],
    "New Zealand": [-40.9006, 174.886],
  };

  /* Metrics calculation */
  const calculateMetrics = (predictionsList, selectedCountriesList) => {
    let totalSquaredError = 0,
      totalAbsError = 0,
      totalPoints = 0,
      coveredPoints = 0;
    (predictionsList || []).forEach((pred) => {
      if (pred?.actualData && pred?.predicted) {
        (selectedCountriesList || []).forEach((country) => {
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
    if (totalPoints === 0)
      return { rmse: 0, mae: 0, coverage: 0, totalPoints: 0 };
    return {
      rmse: Math.sqrt(totalSquaredError / totalPoints),
      mae: totalAbsError / totalPoints,
      coverage: (coveredPoints / totalPoints) * 100,
      totalPoints,
    };
  };

  /* Chart data transformation */
  const chartDataWithUncertainty = predictions.map((pred) => {
    const dp = { year: pred.year, phase: pred.phase };
    (selectedCountries || []).forEach((c) => {
      dp[c] = pred.predicted?.[c] ?? 0;
      dp[`${c}_lower`] = pred.lower?.[c] ?? 0;
      dp[`${c}_upper`] = pred.upper?.[c] ?? 0;
      if (pred.actualData && pred.actualData[c] != null)
        dp[`${c}_actual`] = pred.actualData[c];
    });
    return dp;
  });

  /* Load CSV files */
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
            parsed.forEach((row) => {
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
          setMigrationData([]);
          setYears([]);
          setAllCountries([]);
          setLoadingData(false);
          return;
        }

        const sorted = dataByYear.sort((a, b) => a.year - b.year);
        const idx = {};
        sorted.forEach((d) => {
          idx[d.year] = d;
        });

        const distances = {},
          conn = {};
        Array.from(countriesSet).forEach((c1) => {
          distances[c1] = {};
          conn[c1] = {};
          Array.from(countriesSet).forEach((c2) => {
            if (c1 === c2) {
              distances[c1][c2] = 0;
              conn[c1][c2] = 0;
            } else {
              const [lat1, lon1] = countryCoordinates[c1] || [0, 0];
              const [lat2, lon2] = countryCoordinates[c2] || [0, 0];
              distances[c1][c2] = haversineDistance(lat1, lon1, lat2, lon2);
              conn[c1][c2] = calculateConnectivity(c1, c2);
            }
          });
        });

        setMigrationData(sorted);
        setYears(sorted.map((d) => d.year));
        setAllCountries(Array.from(countriesSet).sort());
        setYearIndex(idx);
        setGeographicDistances(distances);
        setConnectivity(conn);

        if (sorted.length) {
          setInputYear(sorted[0].year);
          setTargetYear(sorted[sorted.length - 1].year);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
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
      countries.forEach((c) => {
        result[c] = 0;
      });
      return result;
    }

    countries.forEach((country) => {
      const row = yearData.find((r) => r?.Country === country);
      if (!row || typeof row !== "object") {
        result[country] = 0;
        return;
      }

      const candidates = [
        "Stock of foreign population by nationality(Total)",
        "Stock of foreign-born population by country of birth(Total)",
      ];

      let stock = NaN;
      for (const h of candidates) {
        if (row[h] !== undefined && row[h] !== "") {
          stock = safeParseFloat(row[h]) || stock;
        }
      }

      if (Number.isNaN(stock)) {
        const numeric = Object.values(row)
          .map((v) => Number.parseFloat(v))
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
      countries.forEach((c) => {
        flows[c] = { inflow: 0, outflow: 0, stock: 0 };
      });
      return flows;
    }

    countries.forEach((country) => {
      const row = yearData.find((r) => r?.Country === country);
      if (!row || typeof row !== "object") {
        flows[country] = { inflow: 0, outflow: 0, stock: 0 };
        return;
      }

      const infl = safeParseFloat(
        row["Inflows of foreign population by nationality(Total)"]
      );
      const out = safeParseFloat(
        row["Outflows of foreign population by nationality(Total)"]
      );
      const stock = safeParseFloat(
        row["Stock of foreign population by nationality(Total)"] ||
          row["Stock of foreign-born population by country of birth(Total)"]
      );

      flows[country] = { inflow: infl, outflow: out, stock };
    });

    return flows;
  }, []);

  const estimateTransitionMatrix = useCallback(
    (flows, countries, distances, conn, distCoeff, connCoeff) => {
      const n = countries.length;
      const matrix = Array.from({ length: n }, () => Array(n).fill(0));

      countries.forEach((origin, i) => {
        const originFlow = flows?.[origin];
        if (!originFlow?.stock) {
          matrix[i][i] = 1.0;
          return;
        }

        const totalOutflow = originFlow.outflow || 0;
        const stayProb = Math.max(
          0.5,
          1 - totalOutflow / Math.max(1, originFlow.stock)
        );
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
          const connectivityBonus =
            1 + connCoeff * (conn?.[origin]?.[dest] || 0);
          const distanceEffect = Math.exp((-distCoeff * distance) / 1000);

          const weight =
            Math.max(0.0001, attractiveness) *
            distanceEffect *
            connectivityBonus;
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
          matrix[i] = matrix[i].map((v) => v / rowSum);
        }
      });

      return matrix;
    },
    []
  );

  const propagatePopulation = useCallback(
    (currentPop, transMatrix, countries) => {
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
    },
    []
  );

  const averageTransitionMatrixFrom = useCallback((matrices, countries) => {
    if (!Array.isArray(matrices) || !matrices.length) return null;

    const n = countries.length;
    const avg = Array.from({ length: n }, () => Array(n).fill(0));

    matrices.forEach((tm) => {
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
  const expandSelectedYearsWithAdjacents = useCallback(
    (selectedYears, availableYears) => {
      const availSet = new Set(availableYears);
      const expanded = new Set(selectedYears);

      selectedYears.forEach((y) => {
        if (availSet.has(y - 1)) expanded.add(y - 1);
        if (availSet.has(y + 1)) expanded.add(y + 1);
      });

      return Array.from(expanded).sort((a, b) => a - b);
    },
    []
  );

  const computePairsFromExpanded = useCallback((expandedYearsArr) => {
    const pairs = [];
    for (let i = 0; i < expandedYearsArr.length - 1; i++) {
      const y1 = expandedYearsArr[i],
        y2 = expandedYearsArr[i + 1];
      if (y2 - y1 === 1) pairs.push([y1, y2]);
    }
    return pairs;
  }, []);

  useEffect(() => {
    if (inputMode !== "multiple" || !inputYearsMulti.length || !years.length) {
      setExpandedYears([]);
      setTrainingPairs([]);
      return;
    }

    const expanded = expandSelectedYearsWithAdjacents(inputYearsMulti, years);
    setExpandedYears(expanded);
    setTrainingPairs(computePairsFromExpanded(expanded));
  }, [
    inputMode,
    inputYearsMulti,
    years,
    expandSelectedYearsWithAdjacents,
    computePairsFromExpanded,
  ]);

  /* Validation */
  useEffect(() => {
    const maxInput =
      inputMode === "single"
        ? inputYear
        : inputYearsMulti.length
        ? Math.max(...inputYearsMulti)
        : null;

    if (!maxInput || !targetYear) {
      setTargetValidationError("");
      return;
    }

    if (targetYear <= maxInput) {
      setTargetValidationError(
        "Target year must be later than the latest input/training year."
      );
    } else {
      setTargetValidationError("");
    }
  }, [inputMode, inputYear, inputYearsMulti, targetYear]);

  /* Build training matrices */
  const buildTrainingTransitionMatricesAndPairs = useCallback(
    (mode, multipleYears, canonicalTrainData) => {
      const matrices = [];
      const pairs = [];
      let expanded = [];

      if (
        mode === "multiple" &&
        Array.isArray(multipleYears) &&
        multipleYears.length > 0
      ) {
        expanded = expandSelectedYearsWithAdjacents(multipleYears, years);

        for (let i = 0; i < expanded.length - 1; i++) {
          const y1 = expanded[i],
            y2 = expanded[i + 1];
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
          if (canonicalTrainData[t - 1]?.data) {
            const flows = getFlows(
              canonicalTrainData[t - 1].data,
              selectedCountries
            );
            const tm = estimateTransitionMatrix(
              flows,
              selectedCountries,
              geographicDistances,
              connectivity,
              distanceEffect,
              connectivityEffect
            );
            matrices.push({ year: canonicalTrainData[t].year, matrix: tm });
            pairs.push([
              canonicalTrainData[t - 1].year,
              canonicalTrainData[t].year,
            ]);
          }
        }
      }

      return { matrices, pairs, expandedYears: [] };
    },
    [
      years,
      yearIndex,
      selectedCountries,
      geographicDistances,
      connectivity,
      distanceEffect,
      connectivityEffect,
      estimateTransitionMatrix,
      getFlows,
      expandSelectedYearsWithAdjacents,
    ]
  );

  /* Generate predictions */
  const generatePredictions = async () => {
    const hasInput =
      inputMode === "single"
        ? !!inputYear
        : Array.isArray(inputYearsMulti) && inputYearsMulti.length > 0;

    if (
      !hasInput ||
      !targetYear ||
      !migrationData.length ||
      selectedCountries.length < 2
    ) {
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
    setTrainingPairs([]);
    setModelProgress(0);
    setShowCelebration(false);

    try {
      setModelStage("Loading training data...");
      setModelProgress(10);

      const canonicalTrainData = migrationData
        .filter((d) => d.year >= 2002 && d.year <= 2020)
        .sort((a, b) => a.year - b.year);

      setModelStage("Building transition matrices...");
      setModelProgress(25);

      const {
        matrices: transMatricesBuilt,
        pairs,
        expandedYears: usedExpanded,
      } = buildTrainingTransitionMatricesAndPairs(
        inputMode,
        inputYearsMulti,
        canonicalTrainData
      );

      let transMatrices = transMatricesBuilt;
      let explicitPairs = pairs;
      let usedExpandedYears = usedExpanded;

      if (!transMatrices.length && canonicalTrainData.length > 1) {
        const fallback = buildTrainingTransitionMatricesAndPairs(
          "single",
          [],
          canonicalTrainData
        );
        transMatrices = fallback.matrices;
        explicitPairs = fallback.pairs;
        usedExpandedYears = [];
      }

      setModelProgress(40);
      setModelStage("Averaging transition matrices...");

      let finalAvgMatrix = averageTransitionMatrixFrom(
        transMatrices,
        selectedCountries
      );

      if (!finalAvgMatrix) {
        const sampleYear =
          inputMode === "single"
            ? inputYear
            : inputYearsMulti.length
            ? Math.max(...inputYearsMulti)
            : null;

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

      const initPopRow =
        inputMode === "single"
          ? yearIndex[inputYear]
          : yearIndex[Math.max(...inputYearsMulti)];

      if (!initPopRow?.data) {
        throw new Error("No initial population data available");
      }

      const initPop = getPopulationStock(initPopRow.data, selectedCountries);

      setTransitionMatrices(transMatrices);
      setTrainingPairs(explicitPairs);
      setExpandedYears(usedExpandedYears);

      setModelProgress(55);
      setModelStage("Running ensemble predictions...");

      const startYr =
        inputMode === "single" ? inputYear : Math.max(...inputYearsMulti);
      const steps = targetYear - startYr;

      const avgMat =
        finalAvgMatrix ||
        (transMatrices.length
          ? averageTransitionMatrixFrom(transMatrices, selectedCountries)
          : null);

      if (!avgMat) {
        throw new Error("No transition matrix available");
      }

      // Ensemble simulation
      const forwardResults = [];
      for (let step = 0; step <= steps; step++) {
        const predictions = [];

        for (let member = 0; member < ensembleSize; member++) {
          let currentPop = { ...initPop };

          const perturbedMatrix = avgMat.map((row) =>
            row.map((val) => {
              const noise = (Math.random() - 0.5) * 0.02;
              return Math.max(0, val + noise);
            })
          );

          perturbedMatrix.forEach((row, i) => {
            const sum = row.reduce((a, b) => a + b, 0);
            if (sum > 0) {
              perturbedMatrix[i] = row.map((v) => v / sum);
            }
          });

          for (let s = 0; s < step; s++) {
            currentPop = propagatePopulation(
              currentPop,
              perturbedMatrix,
              selectedCountries
            );
          }

          predictions.push(currentPop);
        }

        const mean = {};
        const lower = {};
        const upper = {};

        selectedCountries.forEach((country) => {
          const values = predictions
            .map((p) => p[country] || 0)
            .sort((a, b) => a - b);
          mean[country] = values.reduce((a, b) => a + b, 0) / values.length;
          lower[country] = values[Math.floor(values.length * 0.025)];
          upper[country] = values[Math.floor(values.length * 0.975)];
        });

        forwardResults.push({ mean, lower, upper });
      }

      setModelProgress(75);
      setModelStage("Generating predictions...");

      const allPredictions = [];
      for (let step = 0; step <= steps; step++) {
        const year = startYr + step;
        const pred = {
          year,
          phase: step === 0 ? "input" : "prediction",
        };

        if (forwardResults[step]) {
          pred.predicted = forwardResults[step].mean;
          pred.lower = forwardResults[step].lower;
          pred.upper = forwardResults[step].upper;
        } else {
          pred.predicted = {};
          pred.lower = {};
          pred.upper = {};
          selectedCountries.forEach((c) => {
            pred.predicted[c] = 0;
            pred.lower[c] = 0;
            pred.upper[c] = 0;
          });
        }

        const actualRow = yearIndex[year];
        if (actualRow?.data) {
          pred.actualData = getPopulationStock(
            actualRow.data,
            selectedCountries
          );
        }

        allPredictions.push(pred);
      }

      setPredictions(allPredictions);
      setAverageTransitionMatrix(finalAvgMatrix);

      setModelProgress(90);
      setModelStage("Calculating metrics...");

      const validationPredictions = allPredictions.filter(
        (p) => p.phase === "prediction" && p.actualData
      );

      if (validationPredictions.length > 0) {
        const metrics = calculateMetrics(
          validationPredictions,
          selectedCountries
        );
        setValidationMetrics(metrics);
      }

      setModelProgress(100);
      setModelStage("Complete!");
      setResultsReady(true);

      setTimeout(() => {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }, 300);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 500);
    } catch (error) {
      console.error("Model generation failed:", error);
      setModelRunning(false);
      alert("Failed to generate predictions: " + error.message);
    } finally {
      setTimeout(() => setModelRunning(false), 500);
    }
  };

  // Custom dot components
  const PredictedDot = (props) => {
    const { cx, cy, fill } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={fill}
        stroke="#1e293b"
        strokeWidth={1.5}
      />
    );
  };

  const ActualDot = (props) => {
    const { cx, cy, stroke } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="none"
        stroke={stroke}
        strokeWidth={2.5}
      />
    );
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 overflow-y-auto">
      {/* Scroll Progress Bar */}
      <ScrollProgressBar />

      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            variants={celebrationBurst}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <div className="text-center">
              <Sparkles size={80} className="text-green-400 mx-auto" />
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-green-400 mt-4"
              >
                Predictions Complete!
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          variants={fadeInDown}
          initial="initial"
          animate="animate"
          className="mb-6"
        >
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            OECD Migration Flow Model
          </h1>
          <p className="text-slate-400">
            Predict international migration patterns using Markov chain ensemble
            models
          </p>
        </motion.div>

        {/* Info Panel */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <h3 className="font-bold mb-2 text-green-400">
                  About This Model
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {[
                    "Uses transition matrices to model migration flows between countries",
                    "Incorporates geographic distance and connectivity between nations",
                    "Ensemble approach provides uncertainty estimates",
                    "Data sourced from OECD International Migration Database",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-400 mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Country Selection - Enhanced Grid Layout */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg">
              Select Countries (minimum 2, maximum 6)
            </h3>
            <motion.span
              key={selectedCountries.length}
              initial={{ scale: 1.2, color: "#34d399" }}
              animate={{
                scale: 1,
                color: selectedCountries.length >= 2 ? "#34d399" : "#fb923c",
              }}
              transition={{ duration: 0.3 }}
              className={`text-sm font-semibold ${
                selectedCountries.length >= 2
                  ? "text-green-400"
                  : "text-orange-400"
              }`}
            >
              {selectedCountries.length}/6 selected
              {selectedCountries.length < 2 && " (need at least 2)"}
            </motion.span>
          </div>

          {loadingData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {Array(24)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-slate-700/50 rounded animate-pulse"
                  />
                ))}
            </div>
          ) : allCountries.length === 0 ? (
            <div className="text-red-400 text-center py-4">
              <AlertCircle className="inline mr-2" size={20} />
              No countries loaded. Check that CSV files are in the public
              folder.
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2"
            >
              {allCountries.map((country, idx) => {
                const isSelected = selectedCountries.includes(country);
                const canSelect = selectedCountries.length < 6;
                return (
                  <motion.button
                    key={country}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCountries(
                          selectedCountries.filter((c) => c !== country)
                        );
                      } else if (canSelect) {
                        setSelectedCountries([...selectedCountries, country]);
                      }
                    }}
                    disabled={!isSelected && !canSelect}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: idx * 0.02 },
                    }}
                    whileHover={
                      isSelected || canSelect ? { scale: 1.03, y: -2 } : {}
                    }
                    whileTap={isSelected || canSelect ? { scale: 0.97 } : {}}
                    className={`
                      px-3 py-2 rounded text-sm font-medium transition-all duration-200
                      ${
                        isSelected
                          ? "bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg ring-2 ring-green-400/50"
                          : canSelect
                          ? "bg-slate-700 hover:bg-slate-600 text-slate-100"
                          : "bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-50"
                      }
                    `}
                  >
                    {country}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </motion.div>

        {/* Controls Section with Tooltips */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
          className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings size={18} />
              <h3 className="font-bold">Model Parameters</h3>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 hover:bg-slate-700 rounded transition-colors"
            >
              <Info size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input Mode */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">
                Input Mode
              </label>
              <select
                value={inputMode}
                onChange={(e) => setInputMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 text-white focus:ring-2 focus:ring-green-500 transition-all"
              >
                <option value="single">Single Year</option>
                <option value="multiple">Multiple Years</option>
              </select>
            </div>

            {/* Input Year (Single Mode) */}
            {inputMode === "single" && (
              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Input Year
                </label>
                <select
                  value={inputYear || ""}
                  onChange={(e) => setInputYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 text-white focus:ring-2 focus:ring-green-500 transition-all"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Multiple Years Selection */}
            {inputMode === "multiple" && (
              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Training Years (select multiple)
                </label>
                <select
                  multiple
                  value={inputYearsMulti.map(String)}
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (opt) => Number(opt.value)
                    );
                    setInputYearsMulti(selected);
                  }}
                  className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 text-white focus:ring-2 focus:ring-green-500 transition-all"
                  style={{ minHeight: "120px" }}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Hold Ctrl/Cmd to select multiple years
                </p>
              </div>
            )}

            {/* Target Year */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">
                Target Year
              </label>
              <select
                value={targetYear || ""}
                onChange={(e) => setTargetYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 text-white focus:ring-2 focus:ring-green-500 transition-all"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              {targetValidationError && (
                <motion.p
                  variants={shakeError}
                  initial="initial"
                  animate="animate"
                  className="text-red-400 text-sm mt-1 flex items-center gap-1"
                >
                  <AlertCircle size={14} />
                  {targetValidationError}
                </motion.p>
              )}
            </div>

            {/* Distance Effect with Tooltip */}
            <TooltipSlider
              label={`Distance Effect: ${distanceEffect.toFixed(2)}`}
              value={distanceEffect}
              onChange={(e) => setDistanceEffect(parseFloat(e.target.value))}
              min="0"
              max="1"
              step="0.01"
              tooltip="Higher values = distance matters more"
            />

            {/* Connectivity Effect with Tooltip */}
            <TooltipSlider
              label={`Connectivity Effect: ${connectivityEffect.toFixed(2)}`}
              value={connectivityEffect}
              onChange={(e) =>
                setConnectivityEffect(parseFloat(e.target.value))
              }
              min="0"
              max="1"
              step="0.01"
              tooltip="Boost for neighboring countries"
            />

            {/* Ensemble Size with Tooltip */}
            <TooltipSlider
              label={`Ensemble Size: ${ensembleSize}`}
              value={ensembleSize}
              onChange={(e) => setEnsembleSize(parseInt(e.target.value))}
              min="10"
              max="500"
              step="10"
              tooltip="More members = better uncertainty estimates but slower"
            />

            {/* RNG Seed */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">
                Random Seed (optional)
              </label>
              <input
                type="text"
                value={rngSeed}
                onChange={(e) => setRngSeed(e.target.value)}
                placeholder="Leave empty for random"
                className="w-full px-3 py-2 bg-slate-700 rounded border border-slate-600 text-white focus:ring-2 focus:ring-green-500 transition-all"
              />
            </div>
          </div>

          {/* Training Pairs Info */}
          {trainingPairs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-3 bg-slate-900 rounded border border-slate-600"
            >
              <p className="text-sm text-slate-400 mb-2">
                <strong>Training Pairs:</strong> {trainingPairs.length} year
                transitions
              </p>
              <div className="flex flex-wrap gap-2">
                {trainingPairs.map(([y1, y2], i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-xs px-2 py-1 bg-slate-700 rounded text-green-400"
                  >
                    {y1} → {y2}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Run Button */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <button
            onClick={generatePredictions}
            disabled={
              modelRunning ||
              selectedCountries.length < 2 ||
              !!targetValidationError ||
              loadingData
            }
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              modelRunning ||
              selectedCountries.length < 2 ||
              !!targetValidationError ||
              loadingData
                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
            }`}
          >
            <Play size={18} />
            {modelRunning ? "Running Model..." : "Run Prediction Model"}
          </button>

          {/* Progress Indicator */}
          <AnimatePresence>
            {modelRunning && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${modelProgress}%` }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
                <motion.p
                  key={modelStage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-slate-400 mt-2 text-center"
                >
                  {modelStage}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Disabled state message */}
          {!modelRunning && selectedCountries.length < 2 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-orange-400 mt-2 text-center flex items-center justify-center gap-1"
            >
              <AlertCircle size={14} />
              Select at least 2 countries to run the model
            </motion.p>
          )}
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {resultsReady && (
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
            >
              {/* Metrics Cards */}
              {validationMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-800 p-4 rounded-lg border border-slate-700"
                  >
                    <p className="text-sm text-slate-400 mb-1">RMSE</p>
                    <p className="text-2xl font-bold text-red-400">
                      {validationMetrics.rmse?.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Root Mean Squared Error
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-800 p-4 rounded-lg border border-slate-700"
                  >
                    <p className="text-sm text-slate-400 mb-1">MAE</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {validationMetrics.mae?.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Mean Absolute Error
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-slate-800 p-4 rounded-lg border border-slate-700"
                  >
                    <p className="text-sm text-slate-400 mb-1">Coverage</p>
                    <p className="text-2xl font-bold text-teal-400">
                      {validationMetrics.coverage
                        ? validationMetrics.coverage.toFixed(1) + "%"
                        : "N/A"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      % inside 95% CI
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-slate-800 p-4 rounded-lg border border-slate-700"
                  >
                    <p className="text-sm text-slate-400 mb-1">Test Points</p>
                    <p className="text-2xl font-bold text-sky-400">
                      {validationMetrics.totalPoints || 0}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Validation samples
                    </p>
                  </motion.div>
                </div>
              )}

              {/* Model Summary Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6 p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border-2 border-green-500/30"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Award className="text-green-400" size={24} />
                  <h3 className="text-xl font-bold text-green-400">
                    Model Summary
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-slate-700/50 p-3 rounded"
                  >
                    <p className="text-xs text-slate-400">Training Mode</p>
                    <p className="text-lg font-semibold text-white">
                      {inputMode === "single"
                        ? "Single Year"
                        : "Multiple Years"}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-slate-700/50 p-3 rounded"
                  >
                    <p className="text-xs text-slate-400">Training Pairs</p>
                    <p className="text-lg font-semibold text-white">
                      {trainingPairs.length}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-slate-700/50 p-3 rounded"
                  >
                    <p className="text-xs text-slate-400">Prediction Steps</p>
                    <p className="text-lg font-semibold text-white">
                      {targetYear -
                        (inputMode === "single"
                          ? inputYear
                          : Math.max(...inputYearsMulti))}{" "}
                      years
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-slate-700/50 p-3 rounded"
                  >
                    <p className="text-xs text-slate-400">Countries</p>
                    <p className="text-lg font-semibold text-white">
                      {selectedCountries.length}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 }}
                    className="bg-slate-700/50 p-3 rounded"
                  >
                    <p className="text-xs text-slate-400">Ensemble Size</p>
                    <p className="text-lg font-semibold text-white">
                      {ensembleSize} members
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 }}
                    className="bg-slate-700/50 p-3 rounded"
                  >
                    <p className="text-xs text-slate-400">Model Type</p>
                    <p className="text-lg font-semibold text-white">
                      Markov Chain
                    </p>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="mt-4 pt-4 border-t border-slate-700"
                >
                  <p className="text-sm text-slate-400 mb-2">Coefficients:</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="px-2 py-1 bg-slate-700 rounded">
                      Distance: <strong>{distanceEffect.toFixed(2)}</strong>
                    </span>
                    <span className="px-2 py-1 bg-slate-700 rounded">
                      Connectivity:{" "}
                      <strong>{connectivityEffect.toFixed(2)}</strong>
                    </span>
                    <span className="px-2 py-1 bg-slate-700 rounded">
                      Seed: <strong>{rngSeed || "Random"}</strong>
                    </span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Enhanced Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                ref={chartRef}
                className="mb-6 p-6 bg-slate-800 rounded-lg border border-slate-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold flex items-center gap-2 text-lg">
                    <TrendingUp size={20} />
                    Predictions with Uncertainty
                  </h3>
                </div>

                <ResponsiveContainer width="100%" height={500}>
                  <LineChart
                    data={chartDataWithUncertainty}
                    margin={{ top: 10, right: 30, left: 60, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="year"
                      stroke="#94a3b8"
                      style={{ fontSize: "13px" }}
                      label={{
                        value: "Year",
                        position: "insideBottom",
                        offset: -10,
                        style: { fill: "#94a3b8" },
                      }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      style={{ fontSize: "13px" }}
                      tickFormatter={(val) => val.toLocaleString()}
                      label={{
                        value: "Population",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: "#94a3b8", textAnchor: "middle" },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                      formatter={(val) => val.toLocaleString()}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />

                    {selectedCountries.map((country, idx) => (
                      <React.Fragment key={country}>
                        <Line
                          type="monotone"
                          dataKey={country}
                          stroke={colors[idx % colors.length]}
                          strokeWidth={2.5}
                          dot={
                            <PredictedDot fill={colors[idx % colors.length]} />
                          }
                          name={`${country} (Predicted)`}
                          animationDuration={1000}
                        />
                        <Line
                          type="monotone"
                          dataKey={`${country}_actual`}
                          stroke={colors[idx % colors.length]}
                          strokeWidth={2.5}
                          strokeDasharray="8 4"
                          dot={
                            <ActualDot stroke={colors[idx % colors.length]} />
                          }
                          name={`${country} (Actual)`}
                          animationDuration={1000}
                        />
                      </React.Fragment>
                    ))}
                  </LineChart>
                </ResponsiveContainer>

                {/* Visual Guide */}
                <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
                  <h4 className="text-sm font-semibold text-green-400 mb-3">
                    Chart Legend
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <div className="w-8 h-0.5 bg-green-500"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full -ml-1 border-2 border-slate-900"></div>
                      </div>
                      <span>
                        Predicted values (solid line with filled dots)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <div
                          className="w-8 h-0.5 bg-green-500"
                          style={{
                            backgroundImage:
                              "repeating-linear-gradient(to right, currentColor 0, currentColor 4px, transparent 4px, transparent 8px)",
                          }}
                        ></div>
                        <div className="w-2 h-2 rounded-full -ml-1 border-2 border-green-500"></div>
                      </div>
                      <span>
                        Actual observed values (dashed line with hollow dots)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-b from-green-500/20 to-transparent"></div>
                      <span>95% credible interval (shaded region)</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Transition Matrix */}
              {averageTransitionMatrix && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">Average Transition Matrix</h3>
                    <button
                      onClick={() => setShowMatrix(!showMatrix)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                    >
                      {showMatrix ? "Hide" : "Show"}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showMatrix && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        ref={matrixRef}
                        className="overflow-x-auto bg-slate-800 p-4 rounded-lg border border-slate-700"
                      >
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr>
                              <th className="p-2 bg-slate-700 border border-slate-600 sticky left-0 z-10">
                                From \ To
                              </th>
                              {selectedCountries.map((c, idx) => (
                                <th
                                  key={c}
                                  className="p-2 bg-slate-700 border border-slate-600 text-center"
                                  style={{
                                    color: colors[idx % colors.length],
                                  }}
                                >
                                  {c}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCountries.map((origin, i) => (
                              <motion.tr
                                key={origin}
                                custom={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{
                                  opacity: 1,
                                  x: 0,
                                  transition: {
                                    delay: i * 0.06,
                                    duration: 0.45,
                                  },
                                }}
                              >
                                <td
                                  className="p-2 bg-slate-800 border border-slate-600 font-medium sticky left-0 z-10"
                                  style={{
                                    color: colors[i % colors.length],
                                  }}
                                >
                                  {origin}
                                </td>
                                {selectedCountries.map((dest, j) => {
                                  const value =
                                    averageTransitionMatrix[i]?.[j] ?? 0;
                                  const isStay = i === j;
                                  return (
                                    <td
                                      key={dest}
                                      className={`p-2 border border-slate-600 text-center transition-all cursor-pointer hover:bg-slate-700 ${
                                        isStay ? "font-bold" : ""
                                      }`}
                                      style={{
                                        backgroundColor: isStay
                                          ? `${colors[i % colors.length]}20`
                                          : "transparent",
                                      }}
                                      title={`${origin} → ${dest}: ${(
                                        value * 100
                                      ).toFixed(2)}%`}
                                    >
                                      {(value * 100).toFixed(1)}%
                                    </td>
                                  );
                                })}
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="text-xs text-slate-400 mt-3">
                          Hover over cells for details. Diagonal values (same
                          country) show retention probability.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Mathematical Equations Section - Moved After Matrix */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-6"
              >
                <h3 className="text-xl font-bold mb-4 text-green-400 flex items-center gap-2">
                  <Hash size={20} />
                  Mathematical Framework
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Equation 1: Markov Chain Propagation */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-800 p-5 rounded-lg border border-slate-700 hover:border-green-500/50 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-400 mb-2">
                          Markov Chain Propagation
                        </h4>
                        <div className="bg-slate-900 p-3 rounded overflow-x-auto">
                          <BlockMath math="P_{t+1} = T \cdot P_t" />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          Core propagation formula where P is the population
                          vector and T is the transition matrix
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Equation 2: Transition Probability */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-800 p-5 rounded-lg border border-slate-700 hover:border-green-500/50 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-400 mb-2">
                          Transition Probability
                        </h4>
                        <div className="bg-slate-900 p-3 rounded overflow-x-auto">
                          <BlockMath math="T_{ij} = \begin{cases} p_{stay} & i = j \\ (1-p_{stay}) \cdot \frac{w_{ij}}{\sum_{k \neq i} w_{ik}} & i \neq j \end{cases}" />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          Probability of migrating from country i to j,
                          normalized by total outflow weights
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Equation 3: Migration Weight Function */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-800 p-5 rounded-lg border border-slate-700 hover:border-green-500/50 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-400 mb-2">
                          Migration Weight Function
                        </h4>
                        <div className="bg-slate-900 p-3 rounded overflow-x-auto">
                          <BlockMath math="w_{ij} = A_j \cdot e^{-\alpha d_{ij}} \cdot (1 + \beta c_{ij})" />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          Weight combining attractiveness, distance decay (α),
                          and connectivity bonus (β)
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Equation 4: Destination Attractiveness */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.0 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-800 p-5 rounded-lg border border-slate-700 hover:border-green-500/50 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                        4
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-400 mb-2">
                          Destination Attractiveness
                        </h4>
                        <div className="bg-slate-900 p-3 rounded overflow-x-auto">
                          <BlockMath math="A_j = \ln(\text{inflow}_j + 10)" />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          Logarithmic attractiveness based on historical inflow
                          to destination j
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Equation 5: Stay Probability */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-800 p-5 rounded-lg border border-slate-700 hover:border-green-500/50 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                        5
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-400 mb-2">
                          Stay Probability
                        </h4>
                        <div className="bg-slate-900 p-3 rounded overflow-x-auto">
                          <BlockMath math="p_{stay} = \max\left(0.5, 1 - \frac{\text{outflow}}{\text{stock}}\right)" />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          Probability of remaining in origin country, with
                          minimum threshold of 50%
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Equation 6: Geographic Distance */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-800 p-5 rounded-lg border border-slate-700 hover:border-green-500/50 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                        6
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-400 mb-2">
                          Geographic Distance
                        </h4>
                        <div className="bg-slate-900 p-3 rounded overflow-x-auto">
                          <BlockMath math="d = 2R \arctan\left(\sqrt{a}, \sqrt{1-a}\right)" />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          Haversine formula for great-circle distance between
                          coordinates (R = 6371 km)
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Equation 7: RMSE */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.3 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-800 p-5 rounded-lg border border-slate-700 hover:border-green-500/50 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                        7
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-400 mb-2">
                          Root Mean Squared Error
                        </h4>
                        <div className="bg-slate-900 p-3 rounded overflow-x-auto">
                          <BlockMath math="\text{RMSE} = \sqrt{\frac{1}{n}\sum_{i=1}^{n}(y_i - \hat{y}_i)^2}" />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          Validation metric measuring average prediction error
                          magnitude
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Equation 8: Credible Interval */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.4 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-800 p-5 rounded-lg border border-slate-700 hover:border-green-500/50 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                        8
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-400 mb-2">
                          95% Credible Interval
                        </h4>
                        <div className="bg-slate-900 p-3 rounded overflow-x-auto">
                          <BlockMath math="\text{CI}_{95\%} = [Q_{2.5\%}, Q_{97.5\%}]" />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          Uncertainty quantification using 2.5th and 97.5th
                          percentiles from ensemble
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

export default App;
