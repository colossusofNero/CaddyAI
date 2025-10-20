'use client';

/**
 * Scorecard Widget Component
 *
 * Displays course scorecard with hole-by-hole details
 */

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import type { Scorecard, TeeBox } from '@/types/course';

interface ScorecardWidgetProps {
  scorecard: Scorecard;
  selectedTeeBox?: string;
  onTeeBoxChange?: (teeBox: string) => void;
  onHoleSelect?: (holeNumber: number) => void;
  compact?: boolean;
}

const TEE_BOX_COLORS: Record<string, string> = {
  black: 'bg-gray-900 text-white',
  blue: 'bg-blue-600 text-white',
  white: 'bg-gray-200 text-gray-900',
  gold: 'bg-yellow-500 text-gray-900',
  red: 'bg-red-600 text-white',
};

export default function ScorecardWidget({
  scorecard,
  selectedTeeBox,
  onTeeBoxChange,
  onHoleSelect,
  compact = false,
}: ScorecardWidgetProps) {
  const [activeTeeBox, setActiveTeeBox] = useState(
    selectedTeeBox || scorecard.teeBoxes[0]?.name || 'blue'
  );

  const handleTeeBoxChange = (teeBoxName: string) => {
    setActiveTeeBox(teeBoxName);
    onTeeBoxChange?.(teeBoxName);
  };

  const getYardageForHole = (holeNumber: number): number | undefined => {
    const hole = scorecard.holes.find((h) => h.holeNumber === holeNumber);
    const yardage = hole?.yardages.find((y) => y.teeBox === activeTeeBox);
    return yardage?.yardage;
  };

  const getTotalYardage = (): number => {
    return scorecard.holes.reduce((total, hole) => {
      const yardage = hole.yardages.find((y) => y.teeBox === activeTeeBox);
      return total + (yardage?.yardage || 0);
    }, 0);
  };

  const frontNine = scorecard.holes.slice(0, 9);
  const backNine = scorecard.holes.slice(9, 18);

  const getFrontNinePar = () => frontNine.reduce((sum, hole) => sum + hole.par, 0);
  const getBackNinePar = () => backNine.reduce((sum, hole) => sum + hole.par, 0);

  const getFrontNineYardage = () =>
    frontNine.reduce((sum, hole) => {
      const yardage = hole.yardages.find((y) => y.teeBox === activeTeeBox);
      return sum + (yardage?.yardage || 0);
    }, 0);

  const getBackNineYardage = () =>
    backNine.reduce((sum, hole) => {
      const yardage = hole.yardages.find((y) => y.teeBox === activeTeeBox);
      return sum + (yardage?.yardage || 0);
    }, 0);

  const renderHoleRow = (hole: any, index: number) => (
    <tr
      key={hole.id}
      className={`border-b border-gray-700 hover:bg-[#1E293B] cursor-pointer transition-colors ${
        index % 2 === 0 ? 'bg-[#0B1220]' : 'bg-[#1E293B]/50'
      }`}
      onClick={() => onHoleSelect?.(hole.holeNumber)}
    >
      <td className="px-4 py-3 text-center font-semibold text-[#05A146]">
        {hole.holeNumber}
      </td>
      <td className="px-4 py-3 text-center text-gray-300">{hole.par}</td>
      <td className="px-4 py-3 text-center text-gray-300">
        {getYardageForHole(hole.holeNumber) || '-'}
      </td>
      <td className="px-4 py-3 text-center text-gray-400 text-sm">{hole.handicap}</td>
    </tr>
  );

  return (
    <div className="bg-[#1E293B] rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[#0B1220] p-6 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-2">{scorecard.courseName}</h2>
        <p className="text-gray-400">Official Scorecard</p>
      </div>

      {/* Tee Box Selector */}
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
          Select Tee Box
        </h3>
        <div className="flex flex-wrap gap-2">
          {scorecard.teeBoxes.map((teeBox) => (
            <button
              key={teeBox.name}
              onClick={() => handleTeeBoxChange(teeBox.name)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTeeBox === teeBox.name
                  ? TEE_BOX_COLORS[teeBox.color] || 'bg-[#05A146] text-white'
                  : 'bg-[#0B1220] text-gray-400 border border-gray-700 hover:border-[#05A146]'
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="capitalize">{teeBox.name}</span>
                <span className="text-xs opacity-75 mt-1">
                  {teeBox.totalYardage} yds
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Tee Box Stats */}
        {scorecard.teeBoxes.find((tb) => tb.name === activeTeeBox) && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-400">Rating</p>
              <p className="text-lg font-bold text-white">
                {scorecard.teeBoxes.find((tb) => tb.name === activeTeeBox)?.rating.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Slope</p>
              <p className="text-lg font-bold text-white">
                {scorecard.teeBoxes.find((tb) => tb.name === activeTeeBox)?.slope}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Yardage</p>
              <p className="text-lg font-bold text-white">{getTotalYardage()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Scorecard Table - Front Nine */}
      <div className="overflow-x-auto">
        <div className="p-6">
          <h3 className="text-lg font-bold text-white mb-3">Front Nine</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#05A146] text-white">
                <th className="px-4 py-3 text-center">Hole</th>
                <th className="px-4 py-3 text-center">Par</th>
                <th className="px-4 py-3 text-center">Yardage</th>
                <th className="px-4 py-3 text-center">HCP</th>
              </tr>
            </thead>
            <tbody>
              {frontNine.map((hole, index) => renderHoleRow(hole, index))}
              <tr className="bg-[#05A146]/20 font-bold">
                <td className="px-4 py-3 text-center text-white">OUT</td>
                <td className="px-4 py-3 text-center text-white">{getFrontNinePar()}</td>
                <td className="px-4 py-3 text-center text-white">{getFrontNineYardage()}</td>
                <td className="px-4 py-3 text-center text-gray-400">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Back Nine */}
        {backNine.length > 0 && (
          <div className="p-6 pt-0">
            <h3 className="text-lg font-bold text-white mb-3">Back Nine</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#05A146] text-white">
                  <th className="px-4 py-3 text-center">Hole</th>
                  <th className="px-4 py-3 text-center">Par</th>
                  <th className="px-4 py-3 text-center">Yardage</th>
                  <th className="px-4 py-3 text-center">HCP</th>
                </tr>
              </thead>
              <tbody>
                {backNine.map((hole, index) => renderHoleRow(hole, index))}
                <tr className="bg-[#05A146]/20 font-bold">
                  <td className="px-4 py-3 text-center text-white">IN</td>
                  <td className="px-4 py-3 text-center text-white">{getBackNinePar()}</td>
                  <td className="px-4 py-3 text-center text-white">{getBackNineYardage()}</td>
                  <td className="px-4 py-3 text-center text-gray-400">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="p-6 pt-0">
          <table className="w-full text-sm">
            <tbody>
              <tr className="bg-[#05A146] text-white font-bold">
                <td className="px-4 py-3 text-center">TOTAL</td>
                <td className="px-4 py-3 text-center">{scorecard.totalPar}</td>
                <td className="px-4 py-3 text-center">{getTotalYardage()}</td>
                <td className="px-4 py-3 text-center">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
