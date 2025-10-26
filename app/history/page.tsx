/**
 * History/Rounds Page - Phase 4
 * Comprehensive history page showing all past golf rounds with search, filter, and detail view
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Share2,
  Trash2,
  Eye,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import roundsApi from '@/lib/api/rounds';
import type { Round, RoundHole } from '@/lib/api/types';

// Items per page for pagination
const ITEMS_PER_PAGE = 20;

// Score type filters
type ScoreFilter = 'all' | 'under' | 'par' | 'over';

// Sort options
type SortOption = 'date-desc' | 'date-asc' | 'score-asc' | 'score-desc' | 'course-asc';

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // State
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all');
  const [holesFilter, setHolesFilter] = useState<number | 'all'>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Detail modal state
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deletingRound, setDeletingRound] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load rounds
  useEffect(() => {
    if (!user) return;

    const loadRounds = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await roundsApi.getRounds(100); // Get last 100 rounds
        setRounds(data);
      } catch (err: any) {
        console.error('Failed to load rounds:', err);
        setError(err.message || 'Failed to load rounds');
      } finally {
        setLoading(false);
      }
    };

    loadRounds();
  }, [user]);

  // Get unique courses for filter dropdown
  const uniqueCourses = useMemo(() => {
    const courses = new Set(rounds.map(r => r.courseName));
    return Array.from(courses).sort();
  }, [rounds]);

  // Calculate statistics for each round
  const calculateRoundStats = (round: Round) => {
    const totalPar = round.holes.reduce((sum, h) => sum + h.par, 0);
    const parDiff = round.score - totalPar;

    let fairwaysHit = 0;
    let fairwaysTotal = 0;
    let greensHit = 0;
    let greensTotal = 0;
    let totalPutts = 0;
    let birdies = 0;
    let pars = 0;
    let bogeys = 0;
    let doubleBogeys = 0;

    round.holes.forEach(hole => {
      if (hole.fairwayHit !== undefined) {
        if (hole.fairwayHit) fairwaysHit++;
        fairwaysTotal++;
      }
      if (hole.greenInRegulation !== undefined) {
        if (hole.greenInRegulation) greensHit++;
        greensTotal++;
      }
      if (hole.putts) {
        totalPutts += hole.putts;
      }
      if (hole.score && hole.par) {
        const diff = hole.score - hole.par;
        if (diff <= -2) birdies++; // Eagles count as birdies for simplicity
        else if (diff === -1) birdies++;
        else if (diff === 0) pars++;
        else if (diff === 1) bogeys++;
        else if (diff >= 2) doubleBogeys++;
      }
    });

    return {
      parDiff,
      totalPar,
      fairwaysHit,
      fairwaysTotal,
      fairwaysPercent: fairwaysTotal > 0 ? Math.round((fairwaysHit / fairwaysTotal) * 100) : 0,
      greensHit,
      greensTotal,
      greensPercent: greensTotal > 0 ? Math.round((greensHit / greensTotal) * 100) : 0,
      totalPutts,
      avgPutts: round.holes.length > 0 ? (totalPutts / round.holes.length).toFixed(1) : '0.0',
      birdies,
      pars,
      bogeys,
      doubleBogeys,
    };
  };

  // Filter and sort rounds
  const filteredAndSortedRounds = useMemo(() => {
    let filtered = [...rounds];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(round =>
        round.courseName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Course filter
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(round => round.courseName === selectedCourse);
    }

    // Holes filter
    if (holesFilter !== 'all') {
      filtered = filtered.filter(round => round.holes.length === holesFilter);
    }

    // Score filter
    if (scoreFilter !== 'all') {
      filtered = filtered.filter(round => {
        const totalPar = round.holes.reduce((sum, h) => sum + h.par, 0);
        const diff = round.score - totalPar;

        if (scoreFilter === 'under') return diff < 0;
        if (scoreFilter === 'par') return diff === 0;
        if (scoreFilter === 'over') return diff > 0;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'score-asc':
          return a.score - b.score;
        case 'score-desc':
          return b.score - a.score;
        case 'course-asc':
          return a.courseName.localeCompare(b.courseName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [rounds, searchQuery, selectedCourse, holesFilter, scoreFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRounds.length / ITEMS_PER_PAGE);
  const paginatedRounds = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredAndSortedRounds.slice(start, end);
  }, [filteredAndSortedRounds, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCourse, holesFilter, scoreFilter, sortBy]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Calculate duration (mock - would need to be stored in round data)
  const calculateDuration = (holes: number) => {
    const avgMinutesPerHole = holes === 9 ? 15 : 12;
    const totalMinutes = holes * avgMinutesPerHole;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  // Get score color
  const getScoreColor = (score: number, par: number) => {
    const diff = score - par;
    if (diff <= -2) return 'text-yellow-400'; // Eagle or better
    if (diff === -1) return 'text-blue-400'; // Birdie
    if (diff === 0) return 'text-green-400'; // Par
    if (diff === 1) return 'text-orange-400'; // Bogey
    return 'text-red-400'; // Double bogey or worse
  };

  // Get score background
  const getScoreBg = (score: number, par: number) => {
    const diff = score - par;
    if (diff <= -2) return 'bg-yellow-500 bg-opacity-20 border-yellow-500';
    if (diff === -1) return 'bg-blue-500 bg-opacity-20 border-blue-500';
    if (diff === 0) return 'bg-green-500 bg-opacity-20 border-green-500';
    if (diff === 1) return 'bg-orange-500 bg-opacity-20 border-orange-500';
    return 'bg-red-500 bg-opacity-20 border-red-500';
  };

  // Handle delete round
  const handleDeleteRound = async () => {
    if (!selectedRound) return;

    try {
      setDeletingRound(true);
      await roundsApi.deleteRound(selectedRound.id);

      // Remove from local state
      setRounds(prev => prev.filter(r => r.id !== selectedRound.id));

      // Close modals
      setShowDeleteConfirm(false);
      setShowDetailModal(false);
      setSelectedRound(null);
    } catch (err: any) {
      console.error('Failed to delete round:', err);
      alert('Failed to delete round. Please try again.');
    } finally {
      setDeletingRound(false);
    }
  };

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    if (rounds.length === 0) return null;

    const totalRounds = rounds.length;
    const avgScore = Math.round(rounds.reduce((sum, r) => sum + r.score, 0) / totalRounds);
    const bestScore = Math.min(...rounds.map(r => r.score));

    return {
      totalRounds,
      avgScore,
      bestScore,
    };
  }, [rounds]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
          <p className="text-text-secondary text-lg">Loading rounds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-lg font-semibold text-text-primary">Round History</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Summary */}
        {overallStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card variant="elevated" padding="lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm mb-1">Total Rounds</p>
                  <p className="text-3xl font-bold text-text-primary">{overallStats.totalRounds}</p>
                </div>
                <div className="w-12 h-12 bg-primary bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm mb-1">Average Score</p>
                  <p className="text-3xl font-bold text-text-primary">{overallStats.avgScore}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm mb-1">Best Score</p>
                  <p className="text-3xl font-bold text-text-primary">{overallStats.bestScore}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Search and Filter Bar */}
        <Card variant="elevated" padding="lg" className="mb-6">
          <div className="space-y-4">
            {/* Search and Sort Row */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <Input
                  type="text"
                  placeholder="Search by course name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort */}
              <div className="w-full md:w-64">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-4 py-2 bg-secondary border border-secondary-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="score-asc">Best Score First</option>
                  <option value="score-desc">Worst Score First</option>
                  <option value="course-asc">Course Name (A-Z)</option>
                </select>
              </div>

              {/* Filter Toggle */}
              <Button
                variant={showFilters ? 'primary' : 'outline'}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-secondary-700">
                {/* Course Filter */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Course
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-2 bg-secondary border border-secondary-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">All Courses</option>
                    {uniqueCourses.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>

                {/* Score Filter */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Score
                  </label>
                  <select
                    value={scoreFilter}
                    onChange={(e) => setScoreFilter(e.target.value as ScoreFilter)}
                    className="w-full px-4 py-2 bg-secondary border border-secondary-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">All Scores</option>
                    <option value="under">Under Par</option>
                    <option value="par">Par</option>
                    <option value="over">Over Par</option>
                  </select>
                </div>

                {/* Holes Filter */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Holes Played
                  </label>
                  <select
                    value={holesFilter}
                    onChange={(e) => setHolesFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="w-full px-4 py-2 bg-secondary border border-secondary-700 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">All</option>
                    <option value="9">9 Holes</option>
                    <option value="18">18 Holes</option>
                  </select>
                </div>
              </div>
            )}

            {/* Active Filter Tags */}
            {(searchQuery || selectedCourse !== 'all' || scoreFilter !== 'all' || holesFilter !== 'all') && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-secondary-700">
                <span className="text-sm text-text-secondary">Active filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary bg-opacity-20 text-primary rounded-full text-sm">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery('')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedCourse !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary bg-opacity-20 text-primary rounded-full text-sm">
                    Course: {selectedCourse}
                    <button onClick={() => setSelectedCourse('all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {scoreFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary bg-opacity-20 text-primary rounded-full text-sm">
                    Score: {scoreFilter}
                    <button onClick={() => setScoreFilter('all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {holesFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary bg-opacity-20 text-primary rounded-full text-sm">
                    Holes: {holesFilter}
                    <button onClick={() => setHolesFilter('all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-text-secondary text-sm">
            Showing {paginatedRounds.length} of {filteredAndSortedRounds.length} rounds
          </p>
        </div>

        {/* Rounds List */}
        {error ? (
          <Card variant="bordered" padding="lg">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Error Loading Rounds</h3>
              <p className="text-text-secondary mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </Card>
        ) : paginatedRounds.length === 0 ? (
          <Card variant="bordered" padding="lg">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-text-primary mb-2">No Rounds Yet</h3>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                Start tracking your golf rounds to see your history, statistics, and improvement over time.
              </p>
              <Button onClick={() => router.push('/courses')}>
                Find a Course to Play
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {paginatedRounds.map((round) => {
              const stats = calculateRoundStats(round);

              return (
                <Card
                  key={round.id}
                  variant="elevated"
                  padding="lg"
                  className="hover:border-primary transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedRound(round);
                    setShowDetailModal(true);
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Course Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-text-primary mb-1 truncate">
                            {round.courseName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(round.date)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {calculateDuration(round.holes.length)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-6">
                      {/* Main Score */}
                      <div className="text-center">
                        <p className="text-text-secondary text-xs mb-1">Score</p>
                        <div className={`text-3xl font-bold ${getScoreColor(round.score, stats.totalPar)}`}>
                          {round.score}
                        </div>
                        <p className="text-text-secondary text-xs mt-1">
                          {stats.parDiff > 0 ? '+' : ''}{stats.parDiff}
                        </p>
                      </div>

                      {/* Holes */}
                      <div className="text-center">
                        <p className="text-text-secondary text-xs mb-1">Holes</p>
                        <div className="text-2xl font-bold text-text-primary">
                          {round.holes.length}
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="hidden lg:flex flex-col gap-1 text-xs min-w-[150px]">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Fairways:</span>
                          <span className="text-text-primary font-medium">
                            {stats.fairwaysHit}/{stats.fairwaysTotal} ({stats.fairwaysPercent}%)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">GIR:</span>
                          <span className="text-text-primary font-medium">
                            {stats.greensHit}/{stats.greensTotal} ({stats.greensPercent}%)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Putts:</span>
                          <span className="text-text-primary font-medium">{stats.totalPutts}</span>
                        </div>
                      </div>

                      {/* View Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRound(round);
                          setShowDetailModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-primary text-white'
                        : 'bg-secondary-800 text-text-secondary hover:bg-secondary-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedRound && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-secondary-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-secondary-900 border-b border-secondary-700 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-1">
                  {selectedRound.courseName}
                </h2>
                <p className="text-text-secondary">{formatDate(selectedRound.date)}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRound(null);
                }}
                className="w-10 h-10 rounded-lg bg-secondary-800 hover:bg-secondary-700 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {(() => {
                const stats = calculateRoundStats(selectedRound);

                return (
                  <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-secondary-800 rounded-lg p-4 text-center">
                        <p className="text-text-secondary text-sm mb-1">Final Score</p>
                        <p className={`text-3xl font-bold ${getScoreColor(selectedRound.score, stats.totalPar)}`}>
                          {selectedRound.score}
                        </p>
                        <p className="text-text-secondary text-sm mt-1">
                          Par {stats.totalPar} ({stats.parDiff > 0 ? '+' : ''}{stats.parDiff})
                        </p>
                      </div>

                      <div className="bg-secondary-800 rounded-lg p-4 text-center">
                        <p className="text-text-secondary text-sm mb-1">Duration</p>
                        <p className="text-3xl font-bold text-text-primary">
                          {calculateDuration(selectedRound.holes.length).split(' ')[0]}
                        </p>
                        <p className="text-text-secondary text-sm mt-1">
                          {calculateDuration(selectedRound.holes.length).split(' ')[1]}
                        </p>
                      </div>

                      <div className="bg-secondary-800 rounded-lg p-4 text-center">
                        <p className="text-text-secondary text-sm mb-1">Holes</p>
                        <p className="text-3xl font-bold text-text-primary">
                          {selectedRound.holes.length}
                        </p>
                        <p className="text-text-secondary text-sm mt-1">holes</p>
                      </div>

                      <div className="bg-secondary-800 rounded-lg p-4 text-center">
                        <p className="text-text-secondary text-sm mb-1">Putts</p>
                        <p className="text-3xl font-bold text-text-primary">{stats.totalPutts}</p>
                        <p className="text-text-secondary text-sm mt-1">{stats.avgPutts} avg</p>
                      </div>
                    </div>

                    {/* Scorecard */}
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary mb-4">Scorecard</h3>
                      <div className="bg-secondary-800 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-secondary-700">
                                <th className="text-left p-3 text-text-secondary font-medium">Hole</th>
                                <th className="text-center p-3 text-text-secondary font-medium">Par</th>
                                <th className="text-center p-3 text-text-secondary font-medium">Score</th>
                                <th className="text-center p-3 text-text-secondary font-medium">Putts</th>
                                <th className="text-center p-3 text-text-secondary font-medium">FW</th>
                                <th className="text-center p-3 text-text-secondary font-medium">GIR</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedRound.holes.map((hole) => (
                                <tr key={hole.holeNumber} className="border-b border-secondary-700 last:border-0">
                                  <td className="p-3 font-medium text-text-primary">{hole.holeNumber}</td>
                                  <td className="p-3 text-center text-text-secondary">{hole.par}</td>
                                  <td className="p-3 text-center">
                                    <span
                                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                        hole.score ? getScoreBg(hole.score, hole.par) : 'bg-secondary-700 text-text-secondary'
                                      } border`}
                                    >
                                      {hole.score || '-'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center text-text-primary">{hole.putts || '-'}</td>
                                  <td className="p-3 text-center">
                                    {hole.fairwayHit !== undefined ? (
                                      hole.fairwayHit ? (
                                        <span className="text-green-400">✓</span>
                                      ) : (
                                        <span className="text-red-400">✗</span>
                                      )
                                    ) : (
                                      <span className="text-text-secondary">-</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    {hole.greenInRegulation !== undefined ? (
                                      hole.greenInRegulation ? (
                                        <span className="text-green-400">✓</span>
                                      ) : (
                                        <span className="text-red-400">✗</span>
                                      )
                                    ) : (
                                      <span className="text-text-secondary">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary mb-4">Statistics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-secondary-800 rounded-lg p-4">
                          <h4 className="text-text-secondary text-sm mb-3">Performance</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary">Fairways Hit</span>
                              <span className="text-text-primary font-medium">
                                {stats.fairwaysHit}/{stats.fairwaysTotal} ({stats.fairwaysPercent}%)
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary">Greens in Regulation</span>
                              <span className="text-text-primary font-medium">
                                {stats.greensHit}/{stats.greensTotal} ({stats.greensPercent}%)
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary">Total Putts</span>
                              <span className="text-text-primary font-medium">{stats.totalPutts}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary">Average Putts/Hole</span>
                              <span className="text-text-primary font-medium">{stats.avgPutts}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-secondary-800 rounded-lg p-4">
                          <h4 className="text-text-secondary text-sm mb-3">Score Breakdown</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary">Birdies or Better</span>
                              <span className="text-blue-400 font-medium">{stats.birdies}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary">Pars</span>
                              <span className="text-green-400 font-medium">{stats.pars}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary">Bogeys</span>
                              <span className="text-orange-400 font-medium">{stats.bogeys}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary">Double Bogeys or Worse</span>
                              <span className="text-red-400 font-medium">{stats.doubleBogeys}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-secondary-700">
                      <Button variant="outline" size="sm" disabled>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedRound && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4">
          <div className="bg-secondary-900 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Delete Round?</h3>
                <p className="text-text-secondary text-sm">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-text-secondary mb-6">
              Are you sure you want to delete your round at <strong className="text-text-primary">{selectedRound.courseName}</strong> on {formatDate(selectedRound.date)}?
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingRound}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleDeleteRound}
                disabled={deletingRound}
              >
                {deletingRound ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Round
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
