import React, { useState } from 'react';
import { Upload, FileText, Loader2, Search, CheckCircle2, AlertCircle, Download, BrainCircuit, Sparkles, Target, Zap, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { predictQuestions, PredictionResult, PredictionQuestion, RepeatedQuestion } from './services/geminiService';

type AppMode = 'architect' | 'predictor';

export default function App() {
  const [pyqFile, setPyqFile] = useState<File | null>(null);
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusSubject, setFocusSubject] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pyq' | 'syllabus') => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      if (type === 'pyq') setPyqFile(selectedFile);
      else setSyllabusFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePredict = async () => {
    if (!pyqFile || !syllabusFile) {
      setError('Please upload both PYQ and Syllabus files.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setPredictionResult(null);

    try {
      const pyqBase64 = await readFileAsBase64(pyqFile);
      const syllabusBase64 = await readFileAsBase64(syllabusFile);
      const result = await predictQuestions(pyqBase64, syllabusBase64, focusSubject);
      setPredictionResult(result);
    } catch (err) {
      console.error(err);
      setError('An error occurred while predicting questions. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadJson = () => {
    if (!predictionResult) return;
    const blob = new Blob([JSON.stringify(predictionResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rgpv_prediction.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterQuestions = (questions: PredictionQuestion[]) => {
    return questions.filter(q => 
      q.question_hindi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.question_english.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.reasoning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.unit.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filterRepeated = (questions: RepeatedQuestion[]) => {
    return questions.filter(q => 
      q.question_hindi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.question_english.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#141414]/10 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#5A5A40] rounded-full flex items-center justify-center text-white">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">RGPV Academic Predictor</h1>
              <p className="text-xs text-[#141414]/60 uppercase tracking-widest font-medium">Subject Matter Expert AI</p>
            </div>
          </div>
          {predictionResult && (
            <button 
              onClick={downloadJson}
              className="flex items-center gap-2 px-4 py-2 bg-[#5A5A40] text-white rounded-full text-sm font-medium hover:bg-[#4A4A30] transition-colors"
            >
              <Download size={16} />
              Export Predictions
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Dual Upload & Controls */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-white rounded-3xl p-8 shadow-sm border border-[#141414]/5">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Sparkles size={18} className="text-[#5A5A40]" />
                Analysis Inputs
              </h2>
              
              <div className="space-y-6">
                {/* File A: PYQ */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#141414]/50">File A: Previous Papers (PYQ)</label>
                  <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-300 flex flex-col items-center justify-center text-center group
                    ${pyqFile ? 'border-[#5A5A40] bg-[#5A5A40]/5' : 'border-[#141414]/10 hover:border-[#5A5A40]/40'}`}
                  >
                    <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'pyq')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <Upload size={20} className={pyqFile ? 'text-[#5A5A40]' : 'text-[#141414]/20'} />
                    <p className="text-xs font-medium mt-2">{pyqFile ? pyqFile.name : 'Upload PYQ PDF'}</p>
                  </div>
                </div>

                {/* File B: Syllabus */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#141414]/50">File B: 2026 Syllabus</label>
                  <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-300 flex flex-col items-center justify-center text-center group
                    ${syllabusFile ? 'border-[#5A5A40] bg-[#5A5A40]/5' : 'border-[#141414]/10 hover:border-[#5A5A40]/40'}`}
                  >
                    <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'syllabus')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <FileText size={20} className={syllabusFile ? 'text-[#5A5A40]' : 'text-[#141414]/20'} />
                    <p className="text-xs font-medium mt-2">{syllabusFile ? syllabusFile.name : 'Upload Syllabus PDF'}</p>
                  </div>
                </div>

                {/* Focus Subject (Optional) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#141414]/50">Focus Subject (Optional)</label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]/30 group-focus-within:text-[#5A5A40] transition-colors" size={16} />
                    <input 
                      type="text"
                      placeholder="e.g., Computer Network"
                      value={focusSubject}
                      onChange={(e) => setFocusSubject(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#F5F5F0] rounded-xl border border-[#141414]/5 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePredict}
                  disabled={!pyqFile || !syllabusFile || isAnalyzing}
                  className={`w-full py-4 rounded-2xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3
                    ${!pyqFile || !syllabusFile || isAnalyzing ? 'bg-[#141414]/20 cursor-not-allowed' : 'bg-[#141414] hover:bg-[#141414]/90 active:scale-[0.98]'}`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Predicting Questions...
                    </>
                  ) : (
                    <>
                      <Target size={20} />
                      Generate Full Analysis
                    </>
                  )}
                </button>

                {error && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </motion.div>
                )}
              </div>
            </section>

            <section className="bg-[#5A5A40] rounded-3xl p-8 text-white shadow-lg">
              <h3 className="text-lg font-semibold mb-4 italic serif">Prediction Methodology</h3>
              <div className="space-y-4 text-sm opacity-90">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                  <p><strong>Pattern Analysis:</strong> Identifies questions repeating every 1-3 years.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                  <p><strong>Syllabus Sync:</strong> Cross-references with 2026 scheme to ensure relevance.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                  <p><strong>Gap Detection:</strong> Finds core topics missing from recent exams.</p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Prediction Results */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!predictionResult && !isAnalyzing ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-white/30 rounded-3xl border border-dashed border-[#141414]/10">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#141414]/20 mb-6 shadow-sm">
                    <BrainCircuit size={40} />
                  </div>
                  <h3 className="text-xl font-medium text-[#141414]/40">Ready to Analyze</h3>
                  <p className="text-sm text-[#141414]/30 mt-2 max-w-xs">
                    Upload both your Previous Year Papers and the 2026 Syllabus to generate repeated questions and high-probability predictions.
                  </p>
                </motion.div>
              ) : isAnalyzing ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-[#141414]/5 shadow-sm">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-[#5A5A40]/10 border-t-[#5A5A40] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-[#5A5A40]">
                      <Sparkles size={32} />
                    </div>
                  </div>
                  <h3 className="text-xl font-medium mt-8">Cross-Referencing Data...</h3>
                  <p className="text-sm text-[#141414]/50 mt-2 max-w-xs">
                    Gemini Pro is identifying repeated patterns and cross-referencing with the syllabus.
                  </p>
                </motion.div>
              ) : (
                <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  {/* Search Bar */}
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]/30 group-focus-within:text-[#5A5A40] transition-colors" size={20} />
                    <input 
                      type="text"
                      placeholder="Search questions, units, or topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl border border-[#141414]/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                    />
                  </div>

                  {/* Repeated Questions Section (First) */}
                  <RepeatedSection questions={filterRepeated(predictionResult.repeated_questions)} />

                  {/* Prediction Categories */}
                  <div className="pt-8 border-t border-[#141414]/10">
                    <h3 className="text-2xl font-bold serif italic mb-6">Expert Predictions for 2026</h3>
                    <div className="space-y-8">
                      <PredictionSection title="Must-Learn Questions" icon={<Zap className="text-amber-500" size={20} />} questions={filterQuestions(predictionResult.must_learn)} color="amber" />
                      <PredictionSection title="Gap Questions" icon={<Target className="text-blue-500" size={20} />} questions={filterQuestions(predictionResult.gap_questions)} color="blue" />
                      <PredictionSection title="Challenge Questions" icon={<Sparkles className="text-purple-500" size={20} />} questions={filterQuestions(predictionResult.challenge_questions)} color="purple" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function RepeatedSection({ questions }: { questions: RepeatedQuestion[] }) {
  if (questions.length === 0) return null;

  // Group by subject
  const grouped = questions.reduce((acc, q) => {
    if (!acc[q.subject]) acc[q.subject] = [];
    acc[q.subject].push(q);
    return acc;
  }, {} as Record<string, RepeatedQuestion[]>);

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <History className="text-[#5A5A40]" size={24} />
        <h2 className="text-2xl font-bold serif italic">Repeated Questions (Historical Data)</h2>
      </div>
      
      {Object.entries(grouped).map(([subject, subjectQuestions]) => (
        <div key={subject} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#141414]/5">
          <div className="bg-[#141414] px-8 py-4 flex items-center justify-between text-white">
            <h3 className="font-semibold text-lg">{subject}</h3>
            <span className="text-white/60 text-xs font-mono uppercase tracking-widest">
              {subjectQuestions.length} Repeats Found
            </span>
          </div>
          <div className="divide-y divide-[#141414]/5">
            {subjectQuestions.map((q, idx) => (
              <div key={idx} className="p-8 hover:bg-[#F5F5F0]/50 transition-colors">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <h4 className="text-[#141414] text-lg font-semibold leading-tight">
                        <span className="block mb-2 text-[#5A5A40]">{q.question_hindi}</span>
                        <span className="block text-[#141414]/70 font-medium">{q.question_english}</span>
                      </h4>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Frequency</span>
                      <span className="text-xl font-bold text-[#5A5A40]">{q.frequency}x</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#141414]/40 font-mono uppercase tracking-widest">Appeared in:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {q.years.map(year => (
                        <span key={year} className="text-[10px] font-bold px-2 py-0.5 border border-[#141414]/10 rounded-full text-[#141414]/60">
                          {year}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function PredictionSection({ title, icon, questions, color }: { title: string, icon: React.ReactNode, questions: PredictionQuestion[], color: string }) {
  if (questions.length === 0) return null;

  const colorClasses: Record<string, string> = {
    amber: 'bg-amber-500 border-amber-600',
    blue: 'bg-blue-500 border-blue-600',
    purple: 'bg-purple-500 border-purple-600'
  };

  return (
    <section className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#141414]/5">
      <div className={`${colorClasses[color]} px-8 py-4 flex items-center justify-between text-white`}>
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="font-semibold serif italic text-lg">{title}</h2>
        </div>
        <span className="text-white/80 text-xs font-mono uppercase tracking-widest">
          {questions.length} Questions
        </span>
      </div>
      
      <div className="divide-y divide-[#141414]/5">
        {questions.map((q, idx) => (
          <div key={idx} className="p-8 hover:bg-[#F5F5F0]/50 transition-colors group">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#141414]/5 text-[#141414]/60 text-[10px] font-bold uppercase tracking-wider rounded">
                      Unit {q.unit}
                    </span>
                    <span className="px-2 py-0.5 bg-[#5A5A40]/10 text-[#5A5A40] text-[10px] font-bold uppercase tracking-wider rounded">
                      {q.marks} Marks
                    </span>
                  </div>
                  <h4 className="text-[#141414] text-lg font-semibold leading-tight">
                    <span className="block mb-2 text-[#5A5A40]">{q.question_hindi}</span>
                    <span className="block text-[#141414]/70 font-medium">{q.question_english}</span>
                  </h4>
                </div>
              </div>
              
              <div className="bg-[#F5F5F0] rounded-xl p-4 border border-[#141414]/5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-1">Architect's Reasoning</p>
                <p className="text-sm text-[#141414]/70 leading-relaxed">{q.reasoning}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
