/* eslint-disable no-restricted-globals */
/*
  Worker: ensemble sampling + propagation
  - Lightweight seeded LCG RNG when seed provided
  - Dirichlet-like row perturbation (gamma-like)
  - Inputs: { finalAvgMatrix, initPop, selectedCountries, steps, ensembleSize, seed, startYear }
  - Output: { results: [{ year, mean, lower, upper }, ...] }
*/
(() => {
  self.onmessage = function (e) {
    const msg = e.data || {};
    const { finalAvgMatrix, initPop = {}, selectedCountries = [], steps = 0, ensembleSize = 100, seed, startYear = 0 } = msg;

    // RNG: LCG when seed provided; else Math.random
    let rng = Math.random;
    if (seed) {
      try {
        let state = 0;
        for (let i = 0; i < seed.length; i++) state = (state * 31 + seed.charCodeAt(i)) >>> 0;
        if (state === 0) state = 1;
        rng = function () {
          state = (1664525 * state + 1013904223) >>> 0;
          return (state & 0xffffffff) / 4294967295;
        };
      } catch (err) {
        rng = Math.random;
      }
    }

    const safeArray = (a, len = 0) => Array.isArray(a) && a.length ? a : Array.from({ length: len }, () => 0);

    const perturbRow = (row, alphaScale = 100) => {
      if (!Array.isArray(row) || row.length === 0) return [];
      const alphas = row.map(p => Math.max(1e-6, (typeof p === 'number' ? p : 0) * alphaScale));
      const gammas = alphas.map(a => -Math.log(Math.max(rng(), 1e-12)) * a);
      const s = gammas.reduce((a, b) => a + b, 0) || 1;
      return gammas.map(g => g / s);
    };

    const propagate = (currentPop, transMatrix, countries) => {
      const newPop = {};
      const n = countries.length;
      if (!Array.isArray(transMatrix) || transMatrix.length !== n) {
        countries.forEach(c => { newPop[c] = currentPop[c] || 0; });
        return newPop;
      }
      countries.forEach((dest, j) => {
        let sum = 0;
        countries.forEach((origin, i) => {
          const originVal = currentPop && typeof currentPop[origin] === 'number' ? currentPop[origin] : 0;
          const prob = (Array.isArray(transMatrix[i]) && typeof transMatrix[i][j] === 'number') ? transMatrix[i][j] : 0;
          sum += originVal * prob;
        });
        newPop[dest] = sum;
      });
      return newPop;
    };

    const baseMatrix = Array.isArray(finalAvgMatrix) ? finalAvgMatrix : [];
    const results = [];
    results.push({ year: startYear, mean: initPop, lower: initPop, upper: initPop });

    let currentPop = Object.assign({}, initPop || {});
    const nCountries = selectedCountries.length || 0;

    for (let step = 1; step <= Math.max(0, steps); step++) {
      const ensembleValues = [];

      for (let s = 0; s < Math.max(1, ensembleSize); s++) {
        const perturbed = baseMatrix.map(row => {
          const pr = perturbRow(row, 100);
          if (!pr || pr.length === 0) {
            if (Array.isArray(row) && row.length === nCountries) {
              const sumRow = row.reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) || 1;
              return row.map(v => (typeof v === 'number' ? v : 0) / sumRow);
            }
            // uniform fallback
            return Array.from({ length: nCountries || 1 }, () => 1 / (nCountries || 1));
          }
          return pr;
        });

        const nextPop = propagate(currentPop, perturbed, selectedCountries);
        ensembleValues.push(nextPop);
      }

      const mean = {}, lower = {}, upper = {};
      selectedCountries.forEach(country => {
        const vals = ensembleValues.map(e => (e && typeof e[country] === 'number' ? e[country] : 0)).sort((a, b) => a - b);
        const len = Math.max(1, vals.length);
        const m = vals.reduce((a, b) => a + b, 0) / len;
        const l = vals[Math.floor(len * 0.025)] ?? 0;
        const u = vals[Math.floor(len * 0.975)] ?? 0;
        mean[country] = m;
        lower[country] = l;
        upper[country] = u;
      });

      const year = startYear + step;
      results.push({ year, mean, lower, upper });
      currentPop = mean;
    }

    try {
      self.postMessage({ results });
    } catch (err) {
      // fallback: send simplified payload
      const safeResults = results.map(r => ({ year: r.year, mean: r.mean, lower: r.lower, upper: r.upper }));
      try { self.postMessage({ results: safeResults }); } catch (_) { /* swallow */ }
    }
  };
})();