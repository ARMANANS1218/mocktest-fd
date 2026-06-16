import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Card, Button, Input, Textarea, Select } from '../components/UI';
import toast from 'react-hot-toast';

const SAMPLE_JSON = `[
  {
    "type": "mcq",
    "questionText": "What is the first step when handling a live chat?",
    "options": ["Greet the customer", "Ask for order number", "Close the chat", "Transfer to manager"],
    "correctAnswer": "Greet the customer",
    "marks": 1
  },
  {
    "type": "true_false",
    "questionText": "You should always use canned responses without personalizing them.",
    "correctAnswer": "False",
    "marks": 1
  },
  {
    "type": "written",
    "questionText": "Describe how you would handle an angry customer in live chat.",
    "marks": 5
  }
]`;

const SAMPLE_TEXT = `Q: What is the first step when handling a live chat?
A) Greet the customer
B) Ask for order number
C) Close the chat
D) Transfer to manager
Answer: A
Marks: 1

Q: You should always use canned responses without personalizing them.
Type: true_false
Answer: False
Marks: 1

Q: Describe how you would handle an angry customer in live chat.
Type: written
Marks: 5`;

const getOrgThreshold = (orgs, orgId) => {
  const org = orgs.find(o => o._id === orgId);
  return org?.passingThreshold ?? 75;
};

function parseTextFormat(text) {
  const questions = [];
  const blocks = text.split(/\n\s*\n/).filter(b => b.trim());

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim());
    const q = { type: 'mcq', questionText: '', options: [], correctAnswer: '', marks: 1 };

    for (const line of lines) {
      if (/^Q:\s*/i.test(line)) {
        q.questionText = line.replace(/^Q:\s*/i, '');
      } else if (/^[A-F]\)\s*/i.test(line)) {
        q.options.push(line.replace(/^[A-F]\)\s*/i, ''));
      } else if (/^Answer:\s*/i.test(line)) {
        const ans = line.replace(/^Answer:\s*/i, '').trim();
        // If answer is a letter like "A", convert to option text
        if (/^[A-F]$/i.test(ans) && q.options.length > 0) {
          const idx = ans.toUpperCase().charCodeAt(0) - 65;
          q.correctAnswer = q.options[idx] || ans;
        } else {
          q.correctAnswer = ans;
        }
      } else if (/^Type:\s*/i.test(line)) {
        q.type = line.replace(/^Type:\s*/i, '').trim().toLowerCase().replace('/', '_');
      } else if (/^Marks:\s*/i.test(line)) {
        q.marks = Number(line.replace(/^Marks:\s*/i, '')) || 1;
      }
    }

    // Auto-detect type
    if (q.type === 'mcq' && q.options.length === 0) {
      if (/^(true|false)$/i.test(q.correctAnswer)) {
        q.type = 'true_false';
        q.options = ['True', 'False'];
      } else {
        q.type = 'written';
      }
    }

    if (q.questionText) {
      questions.push(q);
    }
  }
  return questions;
}

export default function BulkImport() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [targetRole, setTargetRole] = useState('agent');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [importMode, setImportMode] = useState('json'); // json | text
  const [rawInput, setRawInput] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/organizations').then(res => setOrgs(res.data)).catch(() => {});
  }, []);

  const handleParse = () => {
    if (!rawInput.trim()) return toast.error('Please paste your questions');
    try {
      let questions;
      if (importMode === 'json') {
        questions = JSON.parse(rawInput);
        if (!Array.isArray(questions)) {
          questions = [questions];
        }
      } else {
        questions = parseTextFormat(rawInput);
      }
      if (questions.length === 0) return toast.error('No questions found');
      setParsedQuestions(questions);
      toast.success(`Parsed ${questions.length} questions!`);
    } catch (err) {
      toast.error(`Parse error: ${err.message}`);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error('Title is required');
    if (!organization) return toast.error('Organization is required');
    if (parsedQuestions.length === 0) return toast.error('Parse questions first');

    setSaving(true);
    try {
      await api.post('/question-papers/bulk-import', {
        title,
        organization,
        targetRole,
        description,
        instructions,
        questions: parsedQuestions
      });
      toast.success(`Question paper created with ${parsedQuestions.length} questions!`);
      navigate('/question-papers');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to import');
    } finally {
      setSaving(false);
    }
  };

  const loadSample = () => {
    setRawInput(importMode === 'json' ? SAMPLE_JSON : SAMPLE_TEXT);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Import Questions</h1>
          <p className="text-sm text-gray-500 mt-1">Paste JSON or text to create a question paper instantly</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/question-papers')}>Cancel</Button>
      </div>

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
          {organization && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <p className="font-medium text-gray-700">Organization Passing Threshold</p>
              <p className="text-gray-600">{getOrgThreshold(orgs, organization)}% and above pass</p>
            </div>
          )}
        </div>
        <Textarea
          label="Instructions for Candidates"
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          placeholder="Enter instructions..."
          rows={2}
          className="mt-4"
        />
      </Card>

      {/* Import Mode & Input */}
      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Paste Questions</h2>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setImportMode('json')}
                className={`px-3 py-1.5 text-sm font-medium ${importMode === 'json' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                JSON
              </button>
              <button
                onClick={() => setImportMode('text')}
                className={`px-3 py-1.5 text-sm font-medium ${importMode === 'text' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Text
              </button>
            </div>
            <Button variant="ghost" size="sm" onClick={loadSample}>Load Sample</Button>
          </div>
        </div>

        {importMode === 'json' ? (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">Paste a JSON array of questions. Each question needs: <code className="text-indigo-600">type</code> (mcq/true_false/written), <code className="text-indigo-600">questionText</code>, <code className="text-indigo-600">options</code> (for MCQ), <code className="text-indigo-600">correctAnswer</code>, <code className="text-indigo-600">marks</code></p>
          </div>
        ) : (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">Paste questions in text format. Separate questions with blank lines. Format:</p>
            <p className="text-xs text-gray-400 font-mono">Q: question text | A) option ... | Answer: A | Type: mcq/true_false/written | Marks: 1</p>
          </div>
        )}

        <textarea
          value={rawInput}
          onChange={e => setRawInput(e.target.value)}
          rows={12}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          placeholder={importMode === 'json' ? 'Paste JSON array here...' : 'Paste questions in text format here...'}
        />

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            {parsedQuestions.length > 0 && `✅ ${parsedQuestions.length} questions parsed`}
          </p>
          <Button onClick={handleParse}>
            Parse Questions
          </Button>
        </div>
      </Card>

      {/* Preview */}
      {parsedQuestions.length > 0 && (
        <Card className="p-5 mb-6">
          <h2 className="text-base font-semibold mb-4">Preview ({parsedQuestions.length} questions)</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {parsedQuestions.map((q, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    q.type === 'mcq' ? 'bg-blue-100 text-blue-700' :
                    q.type === 'true_false' ? 'bg-purple-100 text-purple-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {q.type === 'mcq' ? 'MCQ' : q.type === 'true_false' ? 'True/False' : 'Written'}
                  </span>
                  <span className="text-xs text-gray-400">{q.marks || 1} mark(s)</span>
                </div>
                <p className="text-sm text-gray-800 ml-8">{q.questionText || q.question || q.text}</p>
                {q.options?.length > 0 && (
                  <div className="ml-8 mt-1 text-xs text-gray-500 flex flex-wrap gap-2">
                    {q.options.map((opt, j) => (
                      <span key={j} className={`px-2 py-0.5 rounded ${
                        (q.correctAnswer || q.answer || q.correct) === opt ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100'
                      }`}>
                        {String.fromCharCode(65 + j)}) {opt}
                      </span>
                    ))}
                  </div>
                )}
                {q.correctAnswer && q.type !== 'written' && (
                  <p className="ml-8 mt-1 text-xs text-green-600">Answer: {q.correctAnswer}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleSubmit} disabled={saving} size="lg">
              {saving ? 'Creating...' : `Create Paper with ${parsedQuestions.length} Questions`}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
