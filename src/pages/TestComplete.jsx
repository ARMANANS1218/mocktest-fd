import { useLocation, Link } from 'react-router-dom';
import { Card, Button } from '../components/UI';

export default function TestComplete() {
  const { state } = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Test Submitted!</h1>
        <p className="text-sm text-gray-500 mt-2">Your answers have been recorded successfully.</p>

        {state && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Objective Score</p>
                <p className="text-lg font-bold text-indigo-600">{state.objectiveScore}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Score</p>
                <p className="text-lg font-bold text-indigo-600">{state.score}/{state.total}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Percentage</p>
                <p className="text-2xl font-bold text-indigo-600">{state.percentage}%</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          Written answers (if any) will be evaluated by the administrator. Final results may differ.
        </p>
      </Card>
    </div>
  );
}
