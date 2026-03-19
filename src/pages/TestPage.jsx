import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Button, Input, Card, Loader, Textarea } from '../components/UI';
import toast from 'react-hot-toast';

export default function TestPage() {
  const { uniqueLink } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [stage, setStage] = useState('loading'); // loading, info, instructions, test, submitting
  const [error, setError] = useState('');

  // Candidate info
  const [candidateInfo, setCandidateInfo] = useState({
    fullName: '',
    ecnNumber: '',
    organization: '',
    email: ''
  });

  // Test state
  const [attemptId, setAttemptId] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Timers
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  const ROLE_LABELS = { agent: 'Agent', tl: 'Team Leader', qa: 'QA' };

  // Load test
  useEffect(() => {
    api.get(`/tests/link/${uniqueLink}`)
      .then(res => {
        setTest(res.data);
        // Auto-fill organization name from the test's organization
        if (res.data.organizationName) {
          setCandidateInfo(prev => ({ ...prev, organization: res.data.organizationName }));
        }
        setStage('info');
      })
      .catch(() => {
        setError('Test not found or is no longer active.');
        setStage('error');
      });
  }, [uniqueLink]);

  // Timer effect
  useEffect(() => {
    if (stage !== 'test' || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (test.timerMode === 'full') {
            handleSubmit();
          } else {
            handleNextQuestion();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [stage, timeLeft, test?.timerMode, currentQuestion]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartTest = async (e) => {
    e.preventDefault();
    if (!candidateInfo.fullName.trim()) return toast.error('Full name is required');
    if (!candidateInfo.ecnNumber.trim()) return toast.error('Employee Code Number is required');
    if (!candidateInfo.organization.trim()) return toast.error('Organization is required');

    try {
      const sid = crypto.randomUUID();
      setSessionId(sid);
      const res = await api.post('/attempts/start', {
        testId: test._id,
        ...candidateInfo,
        sessionId: sid
      });
      setAttemptId(res.data.attemptId);

      if (test.questionPaper.instructions) {
        setStage('instructions');
      } else {
        startTestTimers();
        setStage('test');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start test');
    }
  };

  const startTestTimers = () => {
    if (test.timerMode === 'full') {
      setTimeLeft(test.fullTimerMinutes * 60);
    } else {
      const q = test.questionPaper.questions[0];
      setTimeLeft(q?.timerSeconds || 60);
    }
  };

  const handleBeginTest = () => {
    startTestTimers();
    setStage('test');
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNextQuestion = useCallback(() => {
    const questions = test.questionPaper.questions;
    if (currentQuestion < questions.length - 1) {
      clearInterval(timerRef.current);
      const nextIdx = currentQuestion + 1;
      setCurrentQuestion(nextIdx);
      if (test.timerMode === 'per_question') {
        setTimeLeft(questions[nextIdx]?.timerSeconds || 60);
      }
    } else {
      handleSubmit();
    }
  }, [currentQuestion, test]);

  const handleSubmit = async () => {
    if (stage === 'submitting') return;
    setStage('submitting');
    clearInterval(timerRef.current);

    try {
      const answerPayload = test.questionPaper.questions.map(q => ({
        questionId: q._id,
        selectedAnswer: answers[q._id] || ''
      }));

      const res = await api.post(`/attempts/${attemptId}/submit`, { answers: answerPayload });
      navigate('/test-complete', {
        state: {
          score: res.data.totalScore,
          total: res.data.totalPossibleMarks,
          percentage: res.data.percentage,
          objectiveScore: res.data.objectiveScore
        }
      });
    } catch (err) {
      toast.error('Failed to submit test');
      setStage('test');
    }
  };

  // Loading
  if (stage === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader />
    </div>
  );

  // Error
  if (stage === 'error') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 max-w-md text-center">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-lg font-bold mt-4">Test Not Available</h2>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
      </Card>
    </div>
  );

  // Candidate Info Form
  if (stage === 'info') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-indigo-600">{import.meta.env.VITE_APP_NAME}</h1>
          <h2 className="text-lg font-semibold mt-2">{test.title}</h2>
          {test.organizationName && (
            <p className="text-sm text-indigo-500 font-medium mt-1">
              {test.organizationName}
              {test.targetRole && ` · ${ROLE_LABELS[test.targetRole] || test.targetRole}`}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {test.questionPaper.questions.length} questions · {test.questionPaper.totalMarks} marks
            {test.timerMode === 'full' ? ` · ${test.fullTimerMinutes} minutes` : ' · Per-question timer'}
          </p>
        </div>

        <form onSubmit={handleStartTest} className="space-y-4">
          <Input
            label="Full Name *"
            value={candidateInfo.fullName}
            onChange={e => setCandidateInfo({ ...candidateInfo, fullName: e.target.value })}
            placeholder="Enter your full name"
          />
          <Input
            label="Employee Code Number *"
            value={candidateInfo.ecnNumber}
            onChange={e => setCandidateInfo({ ...candidateInfo, ecnNumber: e.target.value })}
            placeholder="Enter your employee code number"
          />
          <Input
            label="Organization / Center Name *"
            value={candidateInfo.organization}
            onChange={e => setCandidateInfo({ ...candidateInfo, organization: e.target.value })}
            placeholder="Enter your organization"
            readOnly={!!test.organizationName}
            className={test.organizationName ? 'bg-gray-50' : ''}
          />
          <Input
            label="Email (optional)"
            type="email"
            value={candidateInfo.email}
            onChange={e => setCandidateInfo({ ...candidateInfo, email: e.target.value })}
            placeholder="Enter your email"
          />
          <Button type="submit" className="w-full" size="lg">Start Test</Button>
        </form>
      </Card>
    </div>
  );

  // Instructions
  if (stage === 'instructions') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl p-8">
        <h2 className="text-lg font-bold mb-4">Instructions</h2>
        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-6">
          {test.questionPaper.instructions}
        </div>
        <ul className="text-sm text-gray-600 space-y-1 mb-6">
          {test.timerMode === 'full' ? (
            <li>• Total time: <strong>{test.fullTimerMinutes} minutes</strong>. The test will auto-submit when time runs out.</li>
          ) : (
            <>
              <li>• Each question has its own timer.</li>
              <li>• You cannot go back to previous questions.</li>
              <li>• Unanswered questions will be skipped automatically when the timer expires.</li>
            </>
          )}
        </ul>
        <Button onClick={handleBeginTest} size="lg" className="w-full">Begin Test</Button>
      </Card>
    </div>
  );

  // Submitting
  if (stage === 'submitting') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader />
        <p className="mt-4 text-sm text-gray-500">Submitting your answers...</p>
      </div>
    </div>
  );

  // Test Taking
  const questions = test.questionPaper.questions;
  const isPerQuestion = test.timerMode === 'per_question';
  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-gray-900">{test.title}</h1>
            <p className="text-xs text-gray-500">{candidateInfo.fullName} · {candidateInfo.ecnNumber}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg font-mono text-lg font-bold ${
              timeLeft <= 60 ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
            }`}>
              {formatTime(timeLeft)}
            </div>
            {!isPerQuestion && (
              <Button variant="danger" size="sm" onClick={() => {
                if (window.confirm('Are you sure you want to submit the test?')) handleSubmit();
              }}>
                Submit Test
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Full test mode - show all questions */}
        {!isPerQuestion ? (
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q._id}
                question={q}
                index={idx}
                answer={answers[q._id] || ''}
                onAnswer={(val) => handleAnswer(q._id, val)}
              />
            ))}
            <div className="flex justify-end pt-4">
              <Button variant="danger" size="lg" onClick={() => {
                if (window.confirm('Are you sure you want to submit the test?')) handleSubmit();
              }}>
                Submit Test
              </Button>
            </div>
          </div>
        ) : (
          // Per-question mode
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <QuestionCard
              question={currentQ}
              index={currentQuestion}
              answer={answers[currentQ._id] || ''}
              onAnswer={(val) => handleAnswer(currentQ._id, val)}
            />

            <div className="flex justify-end mt-4">
              <Button onClick={handleNextQuestion} size="lg">
                {currentQuestion === questions.length - 1 ? 'Submit Test' : 'Next Question →'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionCard({ question, index, answer, onAnswer }) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-sm font-bold">
          {index + 1}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{question.questionText}</p>
          <p className="text-xs text-gray-400 mt-1">{question.marks} mark{question.marks !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* MCQ */}
      {question.type === 'mcq' && (
        <div className="space-y-2 ml-11">
          {question.options.map((opt, i) => (
            <label
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                answer === opt
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name={`q-${question._id}`}
                checked={answer === opt}
                onChange={() => onAnswer(opt)}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* True/False */}
      {question.type === 'true_false' && (
        <div className="flex gap-3 ml-11">
          {['True', 'False'].map(val => (
            <label
              key={val}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                answer === val
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name={`q-${question._id}`}
                checked={answer === val}
                onChange={() => onAnswer(val)}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="text-sm font-medium">{val}</span>
            </label>
          ))}
        </div>
      )}

      {/* Written */}
      {question.type === 'written' && (
        <div className="ml-11">
          <textarea
            value={answer}
            onChange={e => onAnswer(e.target.value)}
            placeholder="Write your answer here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px]"
            rows={5}
          />
        </div>
      )}
    </Card>
  );
}
