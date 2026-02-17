import { Metadata } from 'next';
import { QuadAnalysisDashboard } from '@/components/analytics/QuadAnalysisDashboard';

export const metadata: Metadata = {
  title: 'Quad Analysis - Copperline Golf',
  description: 'Analyze your recommendation decision quality with quad analysis',
};

export default function QuadAnalysisPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-white dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Quad Analysis
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Understand your decision-making patterns and recommendation quality
          </p>
        </div>

        <QuadAnalysisDashboard />

        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Understanding Quad Analysis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-green-600 mb-2">Trust & Validate (Top Left)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You followed the AI recommendation and got a good outcome. This validates both your
                decision to trust the AI and the quality of the recommendation. High percentages
                here indicate the AI is providing valuable guidance.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-red-600 mb-2">Questionable (Top Right)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You followed the AI recommendation but got a poor outcome. This suggests the
                recommendation quality may need improvement. High percentages here indicate you
                should review club distances or environmental factors.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-blue-600 mb-2">User Expertise (Bottom Left)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You didn't follow the AI recommendation and got a good outcome. This shows your
                personal course knowledge and experience led to better results. High percentages
                suggest you have strong intuition.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-orange-600 mb-2">Should Have Followed (Bottom Right)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You didn't follow the AI recommendation and got a poor outcome. This suggests
                trusting the AI more could improve your results. High percentages here indicate
                room for improvement by following recommendations.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Pro Tip:</strong> The ideal pattern shows high "Trust & Validate" and low
              "Questionable" quadrants. This indicates accurate recommendations that improve your
              game when followed. Review the insights and recommendations above to optimize your
              strategy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
