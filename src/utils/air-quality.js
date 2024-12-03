// Breakpoints for pollutants
export const breakpoints = {
    pm25: [
        { concentration: 0.0, index: 0 },
        { concentration: 12.0, index: 50 },
        { concentration: 35.4, index: 100 },
        { concentration: 55.4, index: 150 },
        { concentration: 150.4, index: 200 },
        { concentration: 250.4, index: 300 },
        { concentration: 500.4, index: 500 },
    ],
    pm10: [
        { concentration: 0, index: 0 },
        { concentration: 54, index: 50 },
        { concentration: 154, index: 100 },
        { concentration: 254, index: 150 },
        { concentration: 354, index: 200 },
        { concentration: 424, index: 300 },
        { concentration: 604, index: 500 },
    ],
    tvoc: [
        { concentration: 0, index: 0 },
        { concentration: 220, index: 50 },
        { concentration: 660, index: 100 },
        { concentration: 2200, index: 150 },
        { concentration: 5500, index: 200 },
        { concentration: 11000, index: 300 },
        { concentration: 30000, index: 500 },
    ],
    eco2: [
        { concentration: 400, index: 0 },
        { concentration: 600, index: 50 },
        { concentration: 1000, index: 100 },
        { concentration: 1500, index: 150 },
        { concentration: 2000, index: 200 },
        { concentration: 5000, index: 300 },
        { concentration: 10000, index: 500 },
    ],
    pm1_0: [
        { concentration: 0.0, index: 0 },
        { concentration: 12.0, index: 50 },
        { concentration: 35.4, index: 100 },
        { concentration: 55.4, index: 150 },
        { concentration: 150.4, index: 200 },
        { concentration: 250.4, index: 300 },
        { concentration: 500.4, index: 500 },
    ],
};

// Function to calculate sub-index
export function calculateSubIndex(concentration, pollutant) {
    const bp = breakpoints[pollutant];
    for (let i = 0; i < bp.length - 1; i++) {
        if (concentration >= bp[i].concentration && concentration <= bp[i + 1].concentration) {
            const I_hi = bp[i + 1].index;
            const I_lo = bp[i].index;
            const C_hi = bp[i + 1].concentration;
            const C_lo = bp[i].concentration;
            const C_p = concentration;
            const I_p = ((I_hi - I_lo) / (C_hi - C_lo)) * (C_p - C_lo) + I_lo;
            return Math.round(I_p);
        }
    }
    // If concentration is above highest breakpoint
    return bp[bp.length - 1].index;
}