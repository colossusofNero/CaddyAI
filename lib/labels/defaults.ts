/**
 * Default label definitions — single source of truth for all display strings.
 * Used as fallback when Firebase is unavailable.
 * Firebase `config/labels` document can override any of these values.
 */

export const DEFAULT_LABELS = {
  roundTypes: {
    '18': '18 Holes',
    '9-front': 'Front 9',
    '9-back': 'Back 9',
  },
  scores: {
    '-3': 'Albatross',
    '-2': 'Eagle',
    '-1': 'Birdie',
    '0': 'Par',
    '1': 'Bogey',
    '2': 'Double',
    '3': 'Triple',
  },
  scoring: {
    birdiesOrBetter: 'Birdies or Better',
    pars: 'Pars',
    bogeys: 'Bogeys',
    doubles: 'Double Bogeys or Worse',
  },
  stats: {
    fairwaysHit: 'Fairways Hit',
    greensInRegulation: 'Greens in Regulation',
    totalPutts: 'Total Putts',
    averagePuttsPerHole: 'Avg Putts/Hole',
    handicapIndex: 'Handicap Index',
    averageScore: 'Average Score',
    bestScore: 'Best Score',
    totalRounds: 'Total Rounds',
  },
  scorecard: {
    hole: 'Hole',
    par: 'Par',
    yards: 'Yards',
    score: 'Score',
    putts: 'Putts',
    fir: 'FIR',
    gir: 'GIR',
    out: 'Out',
    in: 'In',
    total: 'Total',
  },
  filters: {
    last7: 'Last 7 Days',
    last30: 'Last 30 Days',
    last90: 'Last 90 Days',
    allTime: 'All Time',
  },
};

export type Labels = typeof DEFAULT_LABELS;
