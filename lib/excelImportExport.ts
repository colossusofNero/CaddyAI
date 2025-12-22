/**
 * Excel Import/Export Utilities
 * Generate Excel templates and import club/shot data
 */

import * as XLSX from 'xlsx';
import type { Club, ClubFace } from '@/src/types/clubs';
import type { Shot, ShotName, Takeback, ShotFace } from '@/src/types/shots';

export interface ExcelClubRow {
  'Club Name': string;
  'Face': ClubFace;
  'Carry (yards)': number;
  'Roll (yards)': number;
}

export interface ExcelShotRow {
  'Club Name': string;
  'Shot Name': ShotName;
  'Takeback': Takeback;
  'Face': ShotFace;
  'Carry (yards)': number;
  'Roll (yards)': number;
}

/**
 * Generate and download Excel template with clubs and shots
 */
export function downloadExcelTemplate(clubs: Club[], shots: Shot[]): void {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // === CLUBS SHEET ===
  const clubsData: ExcelClubRow[] = clubs.map(club => ({
    'Club Name': club.name,
    'Face': club.face,
    'Carry (yards)': club.carryYards,
    'Roll (yards)': club.rollYards,
  }));

  // Add sample/instruction row if no clubs
  if (clubsData.length === 0) {
    clubsData.push({
      'Club Name': 'Driver',
      'Face': 'Square',
      'Carry (yards)': 250,
      'Roll (yards)': 50,
    });
    clubsData.push({
      'Club Name': '7 Iron',
      'Face': 'Draw',
      'Carry (yards)': 145,
      'Roll (yards)': 10,
    });
  }

  const clubsSheet = XLSX.utils.json_to_sheet(clubsData);

  // Set column widths
  clubsSheet['!cols'] = [
    { wch: 20 }, // Club Name
    { wch: 12 }, // Face
    { wch: 15 }, // Carry
    { wch: 15 }, // Roll
  ];

  XLSX.utils.book_append_sheet(workbook, clubsSheet, 'Clubs');

  // === SHOTS SHEET ===
  const shotsData: ExcelShotRow[] = shots.map(shot => ({
    'Club Name': shot.clubName,
    'Shot Name': shot.name,
    'Takeback': shot.takeback,
    'Face': shot.face,
    'Carry (yards)': shot.carryYards,
    'Roll (yards)': shot.rollYards,
  }));

  // Add sample/instruction rows if no shots
  if (shotsData.length === 0) {
    shotsData.push({
      'Club Name': 'Driver',
      'Shot Name': 'Standard',
      'Takeback': 'Full',
      'Face': 'Square',
      'Carry (yards)': 250,
      'Roll (yards)': 50,
    });
    shotsData.push({
      'Club Name': 'Driver',
      'Shot Name': 'Knockdown',
      'Takeback': '3/4',
      'Face': 'Square',
      'Carry (yards)': 225,
      'Roll (yards)': 40,
    });
    shotsData.push({
      'Club Name': '56°',
      'Shot Name': 'Chip',
      'Takeback': 'Chip',
      'Face': 'Square',
      'Carry (yards)': 20,
      'Roll (yards)': 30,
    });
  }

  const shotsSheet = XLSX.utils.json_to_sheet(shotsData);

  // Set column widths
  shotsSheet['!cols'] = [
    { wch: 20 }, // Club Name
    { wch: 15 }, // Shot Name
    { wch: 12 }, // Takeback
    { wch: 12 }, // Face
    { wch: 15 }, // Carry
    { wch: 15 }, // Roll
  ];

  XLSX.utils.book_append_sheet(workbook, shotsSheet, 'Shots');

  // === INSTRUCTIONS SHEET ===
  const instructions = [
    ['CaddyAI - Clubs & Shots Import Template', '', '', ''],
    ['', '', '', ''],
    ['INSTRUCTIONS:', '', '', ''],
    ['1. Fill out the "Clubs" sheet with your club data', '', '', ''],
    ['2. Fill out the "Shots" sheet with your shot variations', '', '', ''],
    ['3. Save this file', '', '', ''],
    ['4. Upload it back to CaddyAI to import your data', '', '', ''],
    ['', '', '', ''],
    ['CLUBS SHEET:', '', '', ''],
    ['- Club Name: Any name (e.g., Driver, 7 Iron, 52°, PW)', '', '', ''],
    ['- Face: Must be one of the options below (copy/paste from reference)', '', '', ''],
    ['- Carry (yards): Distance ball travels in the air', '', '', ''],
    ['- Roll (yards): Distance ball rolls after landing', '', '', ''],
    ['', '', '', ''],
    ['SHOTS SHEET:', '', '', ''],
    ['- Club Name: Must match a club name from Clubs sheet', '', '', ''],
    ['- Shot Name: Must be one of the options below (copy/paste)', '', '', ''],
    ['- Takeback: Must be one of the options below (copy/paste)', '', '', ''],
    ['- Face: Must be one of the options below (copy/paste)', '', '', ''],
    ['- Carry (yards): Distance for this shot variation', '', '', ''],
    ['- Roll (yards): Can be negative for backspin shots', '', '', ''],
    ['', '', '', ''],
    ['TIPS:', '', '', ''],
    ['- Maximum 14 clubs allowed', '', '', ''],
    ['- You can have multiple shots per club', '', '', ''],
    ['- Make sure Club Names match exactly between sheets', '', '', ''],
    ['- Delete sample rows before uploading', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['═══════════════════════════════════════════════════════', '', '', ''],
    ['VALID OPTIONS REFERENCE (Copy & Paste These Values)', '', '', ''],
    ['═══════════════════════════════════════════════════════', '', '', ''],
    ['', '', '', ''],
    ['CLUB FACE OPTIONS:', 'SHOT NAME OPTIONS:', 'TAKEBACK OPTIONS:', 'SHOT FACE OPTIONS:'],
    ['(for Clubs sheet)', '(for Shots sheet)', '(for Shots sheet)', '(for Shots sheet)'],
    ['', '', '', ''],
    ['Square', 'Standard', 'Full', 'Square'],
    ['Draw', 'Pitch', '3/4', 'Draw'],
    ['Fade', 'Flop', '1/2', 'Fade'],
    ['', 'Chokedown', '1/4', 'Hood'],
    ['', 'Stinger', 'Chip', 'Open'],
    ['', 'Fairway Finder', 'Flop', 'Flat'],
    ['', 'Knockdown', '', ''],
    ['', 'Spinner', '', ''],
    ['', 'Power', '', ''],
    ['', 'Runner', '', ''],
    ['', 'Punch', '', ''],
    ['', 'Bump & Run', '', ''],
    ['', 'Lob', '', ''],
    ['', 'Chip', '', ''],
    ['', 'Custom', '', ''],
    ['', '', '', ''],
    ['HOW TO USE:', '', '', ''],
    ['1. Click on a cell in the reference table above', '', '', ''],
    ['2. Press Ctrl+C to copy', '', '', ''],
    ['3. Go to your Clubs or Shots sheet', '', '', ''],
    ['4. Click on the cell where you want to paste', '', '', ''],
    ['5. Press Ctrl+V to paste', '', '', ''],
    ['', '', '', ''],
    ['IMPORTANT: Copy the exact text (case-sensitive!)']  ,
  ];

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
  instructionsSheet['!cols'] = [
    { wch: 40 }, // Column A - wider for instructions
    { wch: 25 }, // Column B - Shot Names
    { wch: 20 }, // Column C - Takeback
    { wch: 25 }, // Column D - Shot Faces
  ];
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

  // Generate file and trigger download
  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `CaddyAI_Clubs_Shots_${timestamp}.xlsx`);
}

/**
 * Parse uploaded Excel file and extract clubs and shots
 */
export function parseExcelFile(file: File): Promise<{
  clubs: Partial<Club>[];
  shots: Partial<Shot>[];
  errors: string[];
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const clubs: Partial<Club>[] = [];
        const shots: Partial<Shot>[] = [];
        const errors: string[] = [];

        // Parse Clubs sheet
        const clubsSheet = workbook.Sheets['Clubs'];
        if (clubsSheet) {
          const clubsData: ExcelClubRow[] = XLSX.utils.sheet_to_json(clubsSheet);

          clubsData.forEach((row, index) => {
            const rowNum = index + 2; // Excel row number (1-indexed + header)

            // Validate required fields
            if (!row['Club Name']) {
              errors.push(`Row ${rowNum} in Clubs: Club Name is required`);
              return;
            }

            const carry = Number(row['Carry (yards)']);
            const roll = Number(row['Roll (yards)']);

            if (isNaN(carry) || carry < 0 || carry > 400) {
              errors.push(`Row ${rowNum} in Clubs: Invalid Carry value (must be 0-400)`);
              return;
            }

            if (isNaN(roll) || roll < 0 || roll > 100) {
              errors.push(`Row ${rowNum} in Clubs: Invalid Roll value (must be 0-100)`);
              return;
            }

            const validFaces: ClubFace[] = ['Square', 'Draw', 'Fade'];
            const face = row['Face'] as ClubFace;
            if (!validFaces.includes(face)) {
              errors.push(`Row ${rowNum} in Clubs: Invalid Face (must be Square, Draw, or Fade)`);
              return;
            }

            clubs.push({
              name: row['Club Name'].trim(),
              face: face,
              carryYards: carry,
              rollYards: roll,
              totalYards: carry + roll,
              isActive: true,
              isDefault: false,
            });
          });
        } else {
          errors.push('Clubs sheet not found in Excel file');
        }

        // Parse Shots sheet
        const shotsSheet = workbook.Sheets['Shots'];
        if (shotsSheet) {
          const shotsData: ExcelShotRow[] = XLSX.utils.sheet_to_json(shotsSheet);

          shotsData.forEach((row, index) => {
            const rowNum = index + 2;

            // Validate required fields
            if (!row['Club Name']) {
              errors.push(`Row ${rowNum} in Shots: Club Name is required`);
              return;
            }

            if (!row['Shot Name']) {
              errors.push(`Row ${rowNum} in Shots: Shot Name is required`);
              return;
            }

            const carry = Number(row['Carry (yards)']);
            const roll = Number(row['Roll (yards)']);

            if (isNaN(carry) || carry < 0 || carry > 400) {
              errors.push(`Row ${rowNum} in Shots: Invalid Carry value (must be 0-400)`);
              return;
            }

            if (isNaN(roll) || roll < -20 || roll > 100) {
              errors.push(`Row ${rowNum} in Shots: Invalid Roll value (must be -20 to 100)`);
              return;
            }

            const validTakebacks: Takeback[] = ['Full', '3/4', '1/2', '1/4', 'Chip', 'Flop'];
            const takeback = row['Takeback'] as Takeback;
            if (!validTakebacks.includes(takeback)) {
              errors.push(`Row ${rowNum} in Shots: Invalid Takeback (must be Full, 3/4, 1/2, 1/4, Chip, or Flop)`);
              return;
            }

            const validShotFaces: ShotFace[] = ['Square', 'Draw', 'Fade', 'Hood', 'Open', 'Flat'];
            const face = row['Face'] as ShotFace;
            if (!validShotFaces.includes(face)) {
              errors.push(`Row ${rowNum} in Shots: Invalid Face (must be Square, Draw, Fade, Hood, Open, or Flat)`);
              return;
            }

            shots.push({
              clubName: row['Club Name'].trim(),
              name: row['Shot Name'] as ShotName,
              takeback: takeback,
              face: face,
              carryYards: carry,
              rollYards: roll,
              totalYards: carry + roll,
              isActive: true,
              isDefault: false,
            });
          });
        }

        // Validate that all shots reference valid clubs
        const clubNames = new Set(clubs.map(c => c.name));
        shots.forEach((shot, index) => {
          if (!clubNames.has(shot.clubName!)) {
            errors.push(`Shot #${index + 1}: Club "${shot.clubName}" not found in Clubs sheet`);
          }
        });

        resolve({ clubs, shots, errors });
      } catch (_error) {
        resolve({
          clubs: [],
          shots: [],
          errors: ['Failed to parse Excel file. Please ensure it\'s a valid .xlsx file.'],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        clubs: [],
        shots: [],
        errors: ['Failed to read file. Please try again.'],
      });
    };

    reader.readAsArrayBuffer(file);
  });
}
