/**
 * US State Mappings for iGolf API Integration
 *
 * Maps US state codes to iGolf state IDs for API queries
 * and transforms iGolf state IDs back to standard state codes
 */

export interface StateInfo {
  code: string;
  name: string;
  id: number;
}

/**
 * Complete list of US states with iGolf ID mappings
 * Ordered alphabetically by state name
 */
export const US_STATES: StateInfo[] = [
  { code: 'AL', name: 'Alabama', id: 1 },
  { code: 'AK', name: 'Alaska', id: 2 },
  { code: 'AZ', name: 'Arizona', id: 3 },
  { code: 'AR', name: 'Arkansas', id: 4 },
  { code: 'CA', name: 'California', id: 5 },
  { code: 'CO', name: 'Colorado', id: 6 },
  { code: 'CT', name: 'Connecticut', id: 7 },
  { code: 'DE', name: 'Delaware', id: 8 },
  { code: 'FL', name: 'Florida', id: 9 },
  { code: 'GA', name: 'Georgia', id: 10 },
  { code: 'HI', name: 'Hawaii', id: 11 },
  { code: 'ID', name: 'Idaho', id: 12 },
  { code: 'IL', name: 'Illinois', id: 13 },
  { code: 'IN', name: 'Indiana', id: 14 },
  { code: 'IA', name: 'Iowa', id: 15 },
  { code: 'KS', name: 'Kansas', id: 16 },
  { code: 'KY', name: 'Kentucky', id: 17 },
  { code: 'LA', name: 'Louisiana', id: 18 },
  { code: 'ME', name: 'Maine', id: 19 },
  { code: 'MD', name: 'Maryland', id: 20 },
  { code: 'MA', name: 'Massachusetts', id: 21 },
  { code: 'MI', name: 'Michigan', id: 22 },
  { code: 'MN', name: 'Minnesota', id: 23 },
  { code: 'MS', name: 'Mississippi', id: 24 },
  { code: 'MO', name: 'Missouri', id: 25 },
  { code: 'MT', name: 'Montana', id: 26 },
  { code: 'NE', name: 'Nebraska', id: 27 },
  { code: 'NV', name: 'Nevada', id: 28 },
  { code: 'NH', name: 'New Hampshire', id: 29 },
  { code: 'NJ', name: 'New Jersey', id: 30 },
  { code: 'NM', name: 'New Mexico', id: 31 },
  { code: 'NY', name: 'New York', id: 32 },
  { code: 'NC', name: 'North Carolina', id: 33 },
  { code: 'ND', name: 'North Dakota', id: 34 },
  { code: 'OH', name: 'Ohio', id: 35 },
  { code: 'OK', name: 'Oklahoma', id: 36 },
  { code: 'OR', name: 'Oregon', id: 37 },
  { code: 'PA', name: 'Pennsylvania', id: 38 },
  { code: 'RI', name: 'Rhode Island', id: 39 },
  { code: 'SC', name: 'South Carolina', id: 40 },
  { code: 'SD', name: 'South Dakota', id: 41 },
  { code: 'TN', name: 'Tennessee', id: 42 },
  { code: 'TX', name: 'Texas', id: 43 },
  { code: 'UT', name: 'Utah', id: 44 },
  { code: 'VT', name: 'Vermont', id: 45 },
  { code: 'VA', name: 'Virginia', id: 46 },
  { code: 'WA', name: 'Washington', id: 47 },
  { code: 'WV', name: 'West Virginia', id: 48 },
  { code: 'WI', name: 'Wisconsin', id: 49 },
  { code: 'WY', name: 'Wyoming', id: 50 },
  { code: 'DC', name: 'District of Columbia', id: 51 },
];

// Create lookup maps for O(1) access
const stateCodeToIdMap = new Map<string, number>(
  US_STATES.map(state => [state.code, state.id])
);

const stateIdToCodeMap = new Map<number, string>(
  US_STATES.map(state => [state.id, state.code])
);

const stateIdToNameMap = new Map<number, string>(
  US_STATES.map(state => [state.id, state.name])
);

/**
 * Get iGolf state ID from US state code
 * @param stateCode - Two-letter state code (e.g., 'CA', 'NY')
 * @returns iGolf state ID or undefined if not found
 *
 * @example
 * getStateId('CA') // Returns 5
 * getStateId('NY') // Returns 32
 */
export function getStateId(stateCode: string): number | undefined {
  return stateCodeToIdMap.get(stateCode.toUpperCase());
}

/**
 * Get US state code from iGolf state ID
 * @param stateId - iGolf state ID
 * @returns Two-letter state code or undefined if not found
 *
 * @example
 * getStateCode(5) // Returns 'CA'
 * getStateCode(32) // Returns 'NY'
 */
export function getStateCode(stateId: number): string | undefined {
  return stateIdToCodeMap.get(stateId);
}

/**
 * Get state name from iGolf state ID
 * @param stateId - iGolf state ID
 * @returns State name or undefined if not found
 *
 * @example
 * getStateName(5) // Returns 'California'
 * getStateName(32) // Returns 'New York'
 */
export function getStateName(stateId: number): string | undefined {
  return stateIdToNameMap.get(stateId);
}

/**
 * Get state info by code
 * @param stateCode - Two-letter state code
 * @returns Complete state info or undefined if not found
 */
export function getStateByCode(stateCode: string): StateInfo | undefined {
  return US_STATES.find(state => state.code === stateCode.toUpperCase());
}

/**
 * Get state info by iGolf ID
 * @param stateId - iGolf state ID
 * @returns Complete state info or undefined if not found
 */
export function getStateById(stateId: number): StateInfo | undefined {
  return US_STATES.find(state => state.id === stateId);
}

/**
 * Validate if a state code is valid
 * @param stateCode - Two-letter state code
 * @returns true if valid, false otherwise
 */
export function isValidStateCode(stateCode: string): boolean {
  return stateCodeToIdMap.has(stateCode.toUpperCase());
}

/**
 * Validate if an iGolf state ID is valid
 * @param stateId - iGolf state ID
 * @returns true if valid, false otherwise
 */
export function isValidStateId(stateId: number): boolean {
  return stateIdToCodeMap.has(stateId);
}
