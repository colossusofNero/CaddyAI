'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function RoundsDiagnosticPage() {
  const { user } = useAuth();
  const [rawRounds, setRawRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) return;

    const fetchRawRounds = async () => {
      try {
        console.log('[Diagnostics] Current user ID:', user.uid);

        // Fetch ALL rounds without userId filter to see what exists
        const roundsRef = collection(db!, 'rounds');
        const q = query(roundsRef, orderBy('date', 'desc'), limit(10));

        const snapshot = await getDocs(q);
        const rounds = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log('[Diagnostics] Raw rounds from Firestore:', rounds);
        setRawRounds(rounds);
      } catch (err) {
        console.error('[Diagnostics] Error fetching rounds:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch rounds');
      } finally {
        setLoading(false);
      }
    };

    fetchRawRounds();
  }, [user]);

  if (!user) {
    return <div className="p-4">Please log in to view diagnostics</div>;
  }

  if (loading) {
    return <div className="p-4">Loading rounds data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-4">Rounds Diagnostic Tool</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-2">Current User Information</h2>
        <p className="font-mono text-sm">User ID: {user.uid}</p>
        <p className="font-mono text-sm">Email: {user.email}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-semibold mb-4">Rounds in Firestore (Last 10)</h2>
        {rawRounds.length === 0 ? (
          <p className="text-gray-500">No rounds found in Firestore</p>
        ) : (
          <div className="space-y-4">
            {rawRounds.map((round, index) => (
              <div key={round.id} className="border border-gray-300 rounded p-4 bg-gray-50">
                <div className="font-semibold mb-2">Round {index + 1}</div>
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  <div>
                    <span className="font-semibold">ID:</span> {round.id}
                  </div>
                  <div>
                    <span className="font-semibold">User ID:</span>{' '}
                    <span className={round.userId === user.uid ? 'text-green-600' : 'text-red-600'}>
                      {round.userId}
                      {round.userId === user.uid ? ' ✓ MATCH' : ' ✗ MISMATCH'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Course:</span> {round.courseName || 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold">Date:</span> {round.date || 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold">Score:</span> {round.score || 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold">Holes:</span> {round.holes?.length || 0}
                  </div>
                  <div>
                    <span className="font-semibold">Has startTime:</span> {round.startTime ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <span className="font-semibold">Has createdAt:</span> {round.createdAt ? 'Yes' : 'No'}
                  </div>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    View full data
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                    {JSON.stringify(round, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">What to Look For:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Check if the userId in rounds matches your current user ID (should show green ✓ MATCH)</li>
          <li>Check if rounds have the required fields: userId, date, holes array</li>
          <li>Check if rounds have score values and populated holes</li>
          <li>Note whether rounds have startTime (mobile app) or createdAt (web app)</li>
        </ul>
      </div>
    </div>
  );
}
