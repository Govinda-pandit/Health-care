import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api.js';

// ─── Debounce Hook ────────────────────────────────────────────────────────────
function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

const SymptomChecker = () => {
  const [symptom, setSymptom]     = useState('');
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const lastCheckedSymptom = useRef(''); // ← cache check on frontend too

  // ─── Main API call (only on button click / Enter) ─────────────────────────
  const handleCheck = async () => {
    const trimmed = symptom.trim();
    if (!trimmed || loading) return;           // guard: no empty, no double-click
    if (trimmed === lastCheckedSymptom.current) return; // same query? skip call

    setLoading(true);
    setResult(null);
    setError('');
    setRateLimited(false);

    try {
      const { data } = await api.post('/api/ai/check-symptoms', { symptom: trimmed });
      lastCheckedSymptom.current = trimmed; // save last successful query
      setResult({
        spec:   data.specialist,
        emoji:  data.emoji,
        reason: data.reason,
        cached: data.cached || false,
      });
    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.reason || err.response?.data?.error;

      if (status === 429) {
        setRateLimited(true);
        setError(message || 'Too many requests. Please wait 60 seconds.');
      } else {
        setResult({
          spec:   'General Physician',
          emoji:  '🩺',
          reason: 'Unable to connect to AI service. Please try again later.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Enter key → trigger check (debounced 300ms to avoid accidental spam)
  const debouncedCheck = useDebounce(handleCheck, 300);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') debouncedCheck();
  };

  // Clear result when user types new symptom
  const handleInputChange = (e) => {
    setSymptom(e.target.value);
    if (result) setResult(null);
    if (error)  setError('');
  };

  const isSameAsBefore = symptom.trim() === lastCheckedSymptom.current && !!result;

  return (
    <div className="w-full max-w-xl mx-auto space-y-3">

      {/* Input row */}
      <div className="bg-white/10 backdrop-blur rounded-2xl p-2 flex gap-2 border border-white/20">
        <input
          type="text"
          value={symptom}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="e.g. chest pain, fever, headache..."
          disabled={loading || rateLimited}
          maxLength={500}
          className="flex-1 bg-transparent text-white placeholder:text-blue-300 px-4 py-2 focus:outline-none text-sm disabled:opacity-60"
        />
        <button
          onClick={handleCheck}
          disabled={!symptom.trim() || loading || rateLimited || isSameAsBefore}
          className="bg-white text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold px-5 py-2 rounded-xl text-sm transition-all whitespace-nowrap flex items-center gap-1.5"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : rateLimited ? (
            '⏳ Wait...'
          ) : (
            'Check Symptoms →'
          )}
        </button>
      </div>

      {/* Rate limit warning */}
      {rateLimited && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 text-red-200 text-sm text-center">
          ⚠️ {error}
        </div>
      )}

      {/* Result card */}
      {result && (
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 text-left animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 border border-white/30 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
              {result.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">
                  Suggested Specialist
                </p>
                {result.cached && (
                  <span className="text-xs bg-green-500/30 text-green-300 px-2 py-0.5 rounded-full">
                    ⚡ Instant
                  </span>
                )}
              </div>
              <h3 className="text-white text-xl font-extrabold mb-1">{result.spec}</h3>
              <p className="text-blue-200 text-sm leading-relaxed">{result.reason}</p>
            </div>
          </div>
          <Link
            to={`/doctors?specialty=${encodeURIComponent(result.spec)}`}
            className="mt-4 w-full py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            🔍 Find {result.spec}s Near You →
          </Link>
        </div>
      )}

      <p className="text-blue-300 text-xs text-center">⚕ Not a substitute for professional medical advice.</p>
    </div>
  );
};

export default SymptomChecker;
