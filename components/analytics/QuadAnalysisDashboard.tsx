'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { QuadAnalysisService, QuadAnalysis } from '@/services/quadAnalysisService';
import { TrendingUp, TrendingDown, CheckCircle, XCircle, AlertCircle, Lightbulb } from 'lucide-react';

export function QuadAnalysisDashboard() {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<QuadAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('all');

  useEffect(() => {
    if (!user) return;

    const loadAnalysis = async () => {
      setIsLoading(true);
      try {
        const service = new QuadAnalysisService(user.uid);
        const data = await service.analyzeQuadrants(dateRange);
        setAnalysis(data);
      } catch (error) {
        console.error('[QuadAnalysis] Error loading analysis:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalysis();
  }, [user, dateRange]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please sign in to view quad analysis</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!analysis || analysis.totalEvents === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">No data available for quad analysis</p>
        <p className="text-sm text-gray-400">
          Start tracking recommendations with outcomes to see your analysis
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quad Analysis</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Decision quality matrix based on {analysis.totalEvents} shots
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange('week')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              dateRange === 'week'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              dateRange === 'month'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setDateRange('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              dateRange === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              AI Confidence Score
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              How much to trust recommendations
            </p>
          </div>
          <div className="text-5xl font-bold text-primary">{analysis.confidenceScore}</div>
        </div>
        <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              analysis.confidenceScore >= 70
                ? 'bg-green-500'
                : analysis.confidenceScore >= 40
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${analysis.confidenceScore}%` }}
          />
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Adherence Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {analysis.adherenceRate.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            How often you follow AI recommendations
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {analysis.successRate.toFixed(1)}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Shots with excellent or good outcomes
          </p>
        </div>
      </div>

      {/* Quad Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quad 1: Trust & Validate */}
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-green-900 dark:text-green-100 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Trust & Validate
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Followed + Good Outcome
              </p>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {analysis.trustAndValidate.percentage.toFixed(0)}%
            </div>
          </div>
          <p className="text-sm text-green-800 dark:text-green-200">
            {analysis.trustAndValidate.count} shots | Avg: {Math.round(analysis.trustAndValidate.averageDistance)} yds
          </p>
          {analysis.trustAndValidate.examples.length > 0 && (
            <div className="mt-3 text-xs text-green-700 dark:text-green-300">
              <p className="font-medium">Latest:</p>
              <p>
                Hole {analysis.trustAndValidate.examples[0].holeNumber} -{' '}
                {analysis.trustAndValidate.examples[0].recommendedClub} →{' '}
                {analysis.trustAndValidate.examples[0].landingArea}
              </p>
            </div>
          )}
        </div>

        {/* Quad 2: Questionable Recommendations */}
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-red-900 dark:text-red-100 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Questionable
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Followed + Bad Outcome
              </p>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {analysis.questionableRecommendations.percentage.toFixed(0)}%
            </div>
          </div>
          <p className="text-sm text-red-800 dark:text-red-200">
            {analysis.questionableRecommendations.count} shots | Avg:{' '}
            {Math.round(analysis.questionableRecommendations.averageDistance)} yds
          </p>
          {analysis.questionableRecommendations.examples.length > 0 && (
            <div className="mt-3 text-xs text-red-700 dark:text-red-300">
              <p className="font-medium">Latest:</p>
              <p>
                Hole {analysis.questionableRecommendations.examples[0].holeNumber} -{' '}
                {analysis.questionableRecommendations.examples[0].recommendedClub} →{' '}
                {analysis.questionableRecommendations.examples[0].landingArea}
              </p>
            </div>
          )}
        </div>

        {/* Quad 3: User Expertise */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                User Expertise
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Didn't Follow + Good Outcome
              </p>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {analysis.userExpertise.percentage.toFixed(0)}%
            </div>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {analysis.userExpertise.count} shots | Avg: {Math.round(analysis.userExpertise.averageDistance)} yds
          </p>
          {analysis.userExpertise.examples.length > 0 && (
            <div className="mt-3 text-xs text-blue-700 dark:text-blue-300">
              <p className="font-medium">Latest:</p>
              <p>
                Hole {analysis.userExpertise.examples[0].holeNumber} -{' '}
                {analysis.userExpertise.examples[0].chosenClub} instead of{' '}
                {analysis.userExpertise.examples[0].recommendedClub} →{' '}
                {analysis.userExpertise.examples[0].landingArea}
              </p>
            </div>
          )}
        </div>

        {/* Quad 4: Should Have Followed */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Should Have Followed
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                Didn't Follow + Bad Outcome
              </p>
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {analysis.shouldHaveFollowed.percentage.toFixed(0)}%
            </div>
          </div>
          <p className="text-sm text-orange-800 dark:text-orange-200">
            {analysis.shouldHaveFollowed.count} shots | Avg: {Math.round(analysis.shouldHaveFollowed.averageDistance)} yds
          </p>
          {analysis.shouldHaveFollowed.examples.length > 0 && (
            <div className="mt-3 text-xs text-orange-700 dark:text-orange-300">
              <p className="font-medium">Latest:</p>
              <p>
                Hole {analysis.shouldHaveFollowed.examples[0].holeNumber} -{' '}
                {analysis.shouldHaveFollowed.examples[0].chosenClub} instead of{' '}
                {analysis.shouldHaveFollowed.examples[0].recommendedClub} →{' '}
                {analysis.shouldHaveFollowed.examples[0].landingArea}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      {analysis.insights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Insights
          </h3>
          <ul className="space-y-2">
            {analysis.insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-primary mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Recommendations for Improvement
          </h3>
          <ul className="space-y-2">
            {analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-accent mt-1">→</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
