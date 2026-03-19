import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { Card, Button, Input, Textarea, Select, Loader } from '../components/UI';
import toast from 'react-hot-toast';

const emptyQuestion = {
  type: 'mcq',
  questionText: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  marks: 1,
  timerSeconds: 60,
};

export default function QuestionPaperBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [targetRole, setTargetRole] = useState('agent');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [questions, setQuestions] = useState([{ ...emptyQuestion }]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orgs, setOrgs] = useState([]);

  useEffect(() => {
    api.get('/organizations').then(res => setOrgs(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api.get(`/question-papers/${id}`)
        .then(res => {
          const p = res.data;
          setTitle(p.title);
          setOrganization(p.organization?._id || p.organization || '');
          setTargetRole(p.targetRole || 'agent');
          setDescription(p.description || '');
          setInstructions(p.instructions || '');
          setQuestions(p.questions.length > 0 ? p.questions : [{ ...emptyQuestion }]);
        })
        .catch(() => toast.error('Failed to load question paper'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const updateQuestion = (index, field, value) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateOption = (qIndex, optIndex, value) => {
    setQuestions(prev => {
      const updated = [...prev];
      const options = [...updated[qIndex].options];
      options[optIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options };
      return updated;
    });
  };

  const addOption = (qIndex) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], options: [...updated[qIndex].options, ''] };
      return updated;
    });
  };

  const removeOption = (qIndex, optIndex) => {
    setQuestions(prev => {
      const updated = [...prev];
      const options = updated[qIndex].options.filter((_, i) => i !== optIndex);
      updated[qIndex] = { ...updated[qIndex], options };
      return updated;
    });
  };

  const addQuestion = () => {
    setQuestions(prev => [...prev, { ...emptyQuestion, options: ['', '', '', ''] }]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return toast.error('At least one question is required');
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const duplicateQuestion = (index) => {
    setQuestions(prev => {
      const copy = { ...prev[index], options: [...prev[index].options] };
      const updated = [...prev];
      updated.splice(index + 1, 0, copy);
      return updated;
    });
  };

  const moveQuestion = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= questions.length) return;
    setQuestions(prev => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Title is required');
    if (!organization) return toast.error('Organization is required');

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return toast.error(`Question ${i + 1}: text is required`);
      if (q.type === 'mcq') {
        const validOptions = q.options.filter(o => o.trim());
        if (validOptions.length < 2) return toast.error(`Question ${i + 1}: at least 2 options required`);
        if (!q.correctAnswer.trim()) return toast.error(`Question ${i + 1}: correct answer is required`);
      }
      if (q.type === 'true_false' && !q.correctAnswer.trim()) {
        return toast.error(`Question ${i + 1}: select True or False as correct answer`);
      }
    }

    setSaving(true);
    try {
      const payload = {
        title,
        organization,
        targetRole,
        description,
        instructions,
        questions: questions.map(q => ({
          type: q.type,
          questionText: q.questionText,
          options: q.type === 'mcq' ? q.options.filter(o => o.trim()) : q.type === 'true_false' ? ['True', 'False'] : [],
          correctAnswer: q.type === 'written' ? '' : q.correctAnswer,
          marks: Number(q.marks) || 1,
          timerSeconds: Number(q.timerSeconds) || 60,
        }))
      };

      if (isEdit) {
        await api.put(`/question-papers/${id}`, payload);
        toast.success('Question paper updated');
      } else {
        await api.post('/question-papers', payload);
        toast.success('Question paper created');
      }
      navigate('/question-papers');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit' : 'Create'} Question Paper</h1>
          <p className="text-sm text-gray-500 mt-1">
            {questions.length} question{questions.length !== 1 ? 's' : ''} · {totalMarks} total marks
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/question-papers')}>Cancel</Button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Paper Details */}
        <Card className="p-5 mb-6">
          <h2 className="text-base font-semibold mb-4">Paper Details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Title *"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Live Chat CRM - Agent Mock Test"
            />
            <Select
              label="Organization *"
              value={organization}
              onChange={e => setOrganization(e.target.value)}
              options={[
                { value: '', label: 'Select Organization' },
                ...orgs.map(o => ({ value: o._id, label: o.name }))
              ]}
            />
            <Select
              label="Target Role *"
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              options={[
                { value: 'agent', label: 'Agent' },
                { value: 'tl', label: 'Team Leader (TL)' },
                { value: 'qa', label: 'QA' },
              ]}
            />
            <Input
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description"
            />
          </div>
          <Textarea
            label="Instructions for Candidates"
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder="Enter instructions that will be shown to candidates before they start..."
            rows={3}
            className="mt-4"
          />
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q, qIndex) => (
            <Card key={qIndex} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Question {qIndex + 1}</h3>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => moveQuestion(qIndex, -1)} disabled={qIndex === 0}>↑</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => moveQuestion(qIndex, 1)} disabled={qIndex === questions.length - 1}>↓</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => duplicateQuestion(qIndex)}>⧉</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-600">✕</Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3 mb-4">
                <Select
                  label="Question Type"
                  value={q.type}
                  onChange={e => updateQuestion(qIndex, 'type', e.target.value)}
                  options={[
                    { value: 'mcq', label: 'Multiple Choice (MCQ)' },
                    { value: 'true_false', label: 'True / False' },
                    { value: 'written', label: 'Written Answer' },
                  ]}
                />
                <Input
                  label="Marks"
                  type="number"
                  min="1"
                  value={q.marks}
                  onChange={e => updateQuestion(qIndex, 'marks', e.target.value)}
                />
                <Input
                  label="Timer (seconds per question)"
                  type="number"
                  min="10"
                  value={q.timerSeconds}
                  onChange={e => updateQuestion(qIndex, 'timerSeconds', e.target.value)}
                />
              </div>

              <Textarea
                label="Question Text *"
                value={q.questionText}
                onChange={e => updateQuestion(qIndex, 'questionText', e.target.value)}
                placeholder="Enter the question..."
                rows={2}
                className="mb-4"
              />

              {/* MCQ Options */}
              {q.type === 'mcq' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                  <div className="space-y-2">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={q.correctAnswer === opt && opt !== ''}
                          onChange={() => updateQuestion(qIndex, 'correctAnswer', opt)}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={e => {
                            const oldVal = opt;
                            updateOption(qIndex, optIndex, e.target.value);
                            if (q.correctAnswer === oldVal) {
                              updateQuestion(qIndex, 'correctAnswer', e.target.value);
                            }
                          }}
                          placeholder={`Option ${optIndex + 1}`}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {q.options.length > 2 && (
                          <button type="button" onClick={() => removeOption(qIndex, optIndex)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => addOption(qIndex)}>
                    + Add Option
                  </Button>
                  <p className="text-xs text-gray-400 mt-1">Select the radio button next to the correct answer</p>
                </div>
              )}

              {/* True/False */}
              {q.type === 'true_false' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
                  <div className="flex gap-4">
                    {['True', 'False'].map(val => (
                      <label key={val} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`tf-${qIndex}`}
                          checked={q.correctAnswer === val}
                          onChange={() => updateQuestion(qIndex, 'correctAnswer', val)}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-sm">{val}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Written */}
              {q.type === 'written' && (
                <p className="text-sm text-gray-500 italic">Written answers will be evaluated manually by admin after submission.</p>
              )}
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6">
          <Button type="button" variant="secondary" onClick={addQuestion}>+ Add Question</Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Paper' : 'Create Paper'}
          </Button>
        </div>
      </form>
    </div>
  );
}
