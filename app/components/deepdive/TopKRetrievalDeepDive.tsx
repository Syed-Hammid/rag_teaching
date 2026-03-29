'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ScoredChunk {
  id: string;
  source: string;
  text: string;
  score: number;
  url?: string;
  chunkIndex?: number;
}

interface TopKRetrievalDeepDiveProps {
  query: string;
  searchResults: ScoredChunk[];
  retrievedChunks: ScoredChunk[];
  mode: 'web' | 'document';
  onClose: () => void;
}

export function TopKRetrievalDeepDive({
  searchResults,
  retrievedChunks,
  mode,
  onClose
}: TopKRetrievalDeepDiveProps) {
  const [simulatorK, setSimulatorK] = useState(2);

  const containerVariants = {
    hidden: { opacity: 0, y: -20, height: 0 },
    visible: { 
      opacity: 1, 
      y: 0, 
      height: 'auto',
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1] as const,
        staggerChildren: 0.10,
        when: "beforeChildren"
      }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      height: 0,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const maxScore = searchResults.length > 0 ? searchResults[0].score : 1;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="bg-[#0a0c14] border-t-2 border-[#f59e0b] rounded-b-xl p-6 -mt-1 overflow-hidden"
    >
      {/* INTRO ANALOGY CARD */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl p-4 mb-8">
        <h4 className="text-amber-300 font-bold flex items-center gap-2 mb-2 text-sm">
          <span className="text-lg">🏆</span> What is Top-K Retrieval? — The simple idea
        </h4>
        <p className="text-slate-300 text-xs leading-relaxed">
          After scoring every document chunk by similarity, Top-K retrieval is simply: take the best K results and discard the rest. Think of it like a job interview — you might have 50 candidates (chunks) but you only invite the top 2 for the final round. Only those 2 go into the LLM&apos;s prompt. Too few and the LLM lacks context. Too many and the prompt gets bloated, costs more tokens, and the LLM gets confused by irrelevant information. K=2 is the setting used in this pipeline.
        </p>
      </motion.div>

      {/* SECTION 1 — WHAT EXACTLY IS K? */}
      <motion.div variants={itemVariants} className="mb-8 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-amber-500/20 text-amber-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider">Step 1 of 5</span>
          <h3 className="text-amber-300 font-bold text-sm">① What is K and Why Does It Matter?</h3>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed mb-6">
          K is simply the number of chunks retrieved and passed to the LLM. It is the most important hyperparameter in a RAG pipeline — it directly controls the quality and cost of the final answer. This app uses K=2.
        </p>

        {/* K Slider Simulator */}
        <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-5 mb-4">
          <div className="flex justify-between items-center mb-6 relative">
            <div className="absolute left-4 right-4 h-1 bg-slate-800 rounded-full z-0 top-1/2 -translate-y-1/2" />
            {[1, 2, 3, 4, 5].map(k => (
              <button
                key={k}
                onClick={() => setSimulatorK(k)}
                className={`w-8 h-8 rounded-full z-10 flex items-center justify-center text-xs font-bold transition-all ${simulatorK === k ? 'bg-amber-500 text-black scale-110 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <div className="flex-1 bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <span className="text-[10px] uppercase font-bold text-slate-500 mb-2 block tracking-wider">Included Chunks</span>
              <div className="flex flex-wrap gap-1.5">
                {searchResults.slice(0, simulatorK).map((chunk, i) => (
                  <span key={`inc-${i}`} className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-1 rounded border border-amber-500/30 truncate max-w-full">
                    {mode === 'web' ? chunk.source : `Chunk #${chunk.chunkIndex}`}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex-1 bg-slate-800/30 rounded-lg p-3 border border-slate-700/30 opacity-70">
              <span className="text-[10px] uppercase font-bold text-slate-500 mb-2 block tracking-wider">Excluded Chunks</span>
              <div className="flex flex-wrap gap-1.5">
                {searchResults.slice(simulatorK, 8).map((chunk, i) => (
                  <span key={`exc-${i}`} className="bg-slate-800 text-slate-500 text-[10px] px-2 py-1 rounded border border-slate-700 truncate max-w-[80px]">
                    {mode === 'web' ? chunk.source : `C#${chunk.chunkIndex}`}
                  </span>
                ))}
                {searchResults.length > Math.max(8, simulatorK) && (
                  <span className="text-slate-600 text-[10px] px-1 py-1 italic">+{searchResults.length - Math.max(8, simulatorK)} more</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 bg-[#0a0c14] border border-slate-800 rounded p-3 text-xs leading-relaxed min-h-[60px] flex items-center">
            {simulatorK === 1 && <span className="text-amber-400"><span className="mr-1 inline-block">⚠️</span> Minimal context — fast and cheap but the LLM only sees one perspective. Risks missing important information.</span>}
            {simulatorK === 2 && <span className="text-emerald-400"><span className="mr-1 inline-block">✅</span> Balanced — two high-quality chunks provide enough context without overwhelming the prompt. This is what was used for your query.</span>}
            {simulatorK === 3 && <span className="text-amber-300"><span className="mr-1 inline-block">⚡</span> Richer context — good for complex questions but prompt length increases. Watch for diminishing returns on relevance.</span>}
            {simulatorK === 4 && <span className="text-orange-400"><span className="mr-1 inline-block">⚠️</span> Getting noisy — lower-ranked chunks may introduce off-topic content and confuse the LLM.</span>}
            {simulatorK === 5 && <span className="text-red-400"><span className="mr-1 inline-block">❌</span> Too many chunks — the LLM prompt becomes bloated. Token costs rise and answer quality can decrease as irrelevant context dilutes the relevant signals.</span>}
          </div>
        </div>
      </motion.div>

      {/* SECTION 2 — THE SELECTED CHUNKS IN FULL */}
      <motion.div variants={itemVariants} className="mb-8 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-amber-500/20 text-amber-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider">Step 2 of 5</span>
          <h3 className="text-amber-300 font-bold text-sm">② The Retrieved Chunks — Full Content</h3>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed mb-4">
          These are the exact two text chunks that were handed to the LLM. Every word in the final answer traces back to information in these chunks. This is what makes RAG grounded — the LLM cannot hallucinate facts that contradict what is written here.
        </p>

        <div className="flex flex-col gap-4">
          {retrievedChunks.map((chunk, idx) => {
            const charCount = chunk.text.length;
            const tokenEstimate = Math.round(charCount / 4);
            return (
              <div key={`ret-${idx}`} className="bg-[#0f1117] border border-slate-800 border-l-4 border-l-amber-500 rounded-lg p-4 relative">
                <div className="flex justify-between items-start mb-3 border-b border-slate-800/50 pb-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-amber-400 font-semibold text-sm">
                      {mode === 'web' ? chunk.source : `Chunk #${chunk.chunkIndex}`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Score: <span className="text-amber-400">{chunk.score.toFixed(3)}</span></span>
                  </div>
                  <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Rank #{idx + 1}</span>
                </div>
                
                <p className="text-slate-300 text-xs leading-relaxed mb-4 whitespace-pre-wrap">
                  {chunk.text}
                </p>
                
                <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-2 border-t border-slate-800/50">
                  <span>Characters: <span className="text-slate-300">{charCount}</span></span>
                  <span>Tokens (est.): <span className="text-slate-300">~{tokenEstimate}</span></span>
                  {mode === 'web' && chunk.url && (
                    <a href={chunk.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors ml-auto">
                      🔗 View on Wikipedia
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* SECTION 3 — WHAT DIDN'T MAKE IT AND WHY */}
      <motion.div variants={itemVariants} className="mb-8 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-amber-500/20 text-amber-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider">Step 3 of 5</span>
          <h3 className="text-amber-300 font-bold text-sm">③ What Was Left Out — and Why That&apos;s Good</h3>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed mb-4">
          The chunks below were scored and ranked but not included in the LLM prompt. This is intentional — passing all chunks would overload the LLM with context it cannot effectively use. The cutoff is clean: anything below rank #2 stays in the retrieval results but never reaches the language model.
        </p>

        <div className="flex flex-col gap-1.5 mb-4">
          {searchResults.slice(2, Math.min(6, searchResults.length)).map((chunk, idx) => {
            const rank = idx + 3;
            const barWidth = (chunk.score / maxScore) * 100;
            return (
              <div key={`exc-${idx}`} className="bg-[#0f1117] border border-slate-800 rounded p-2 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 flex-shrink-0">#{rank}</span>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400 truncate max-w-[120px]">
                        {mode === 'web' ? chunk.source : `Chunk #${chunk.chunkIndex}`}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">{chunk.score.toFixed(3)}</span>
                      <div className="w-16 h-1 bg-slate-800 rounded overflow-hidden">
                        <div className="h-full bg-slate-600" style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 italic truncate whitespace-nowrap">
                      &quot;{chunk.text.substring(0, 60)}...&quot;
                    </span>
                  </div>
                </div>
                <span className="text-rose-400 text-[10px] font-semibold flex-shrink-0 bg-rose-500/10 px-1.5 py-0.5 rounded">✗ Excluded</span>
              </div>
            );
          })}
          {searchResults.length > 6 && (
            <div className="text-center text-[10px] text-slate-500 italic py-1 opacity-60">
              ... and {searchResults.length - 6} more skipped chunks lower in rank
            </div>
          )}
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 text-xs text-slate-400 leading-relaxed">
          <span className="text-amber-400 font-bold">💡 </span>
          These chunks contain real information about your query topic but scored lower in semantic similarity. In a production RAG system, you might increase K or use a reranking model (like a cross-encoder) to double-check whether any excluded chunks should actually be included.
        </div>
      </motion.div>

      {/* SECTION 4 — K IN REAL WORLD RAG SYSTEMS */}
      <motion.div variants={itemVariants} className="mb-8 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-amber-500/20 text-amber-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider">Step 4 of 5</span>
          <h3 className="text-amber-300 font-bold text-sm">④ How K is Chosen in Real RAG Systems</h3>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed mb-4">
          In production RAG systems, K is never randomly chosen. It is tuned based on the use case, the chunk size, the LLM&apos;s context window, and the nature of the queries.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-[#0f1117] border border-amber-500/20 rounded-lg p-3 text-xs text-slate-400">
            <h5 className="text-amber-300 font-semibold mb-1">📏 Chunk Size</h5>
            Smaller chunks (100–200 chars) → use higher K (5–10). Larger chunks (500+ chars) → use lower K (2–3). Each chunk in this app is ~300 chars, so K=2 is appropriate.
          </div>
          <div className="bg-[#0f1117] border border-amber-500/20 rounded-lg p-3 text-xs text-slate-400">
            <h5 className="text-amber-300 font-semibold mb-1">🧠 LLM Context Window</h5>
            Every retrieved chunk consumes tokens. GPT-4 supports 128K tokens — you could use K=20+. Smaller models (4K–8K tokens) force K=2–3. LLaMA 3.3 70B used here supports large contexts.
          </div>
          <div className="bg-[#0f1117] border border-amber-500/20 rounded-lg p-3 text-xs text-slate-400">
            <h5 className="text-amber-300 font-semibold mb-1">🎯 Query Complexity</h5>
            Simple factual queries: K=1–2 is enough. Multi-part or comparative questions: K=4–6 helps. Research-style queries: K=8–10 with reranking.
          </div>
          <div className="bg-[#0f1117] border border-amber-500/20 rounded-lg p-3 text-xs text-slate-400">
            <h5 className="text-amber-300 font-semibold mb-1">🔁 Reranking</h5>
            Advanced RAG pipelines add a second pass: a cross-encoder reranker re-scores the top K=20 chunks and keeps only the best 2–3. This two-stage approach gives better precision than single-pass K selection.
          </div>
        </div>
      </motion.div>

      {/* SECTION 5 — THE HANDOFF */}
      <motion.div variants={itemVariants} className="mb-8 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-amber-500/20 text-amber-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider">Step 5 of 5</span>
          <h3 className="text-amber-300 font-bold text-sm">⑤ The Handoff — What Happens Next</h3>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed mb-6">
          Top-K retrieval is the bridge between the vector database and the LLM. Once the top K chunks are selected, they are handed to the next step — Prompt Augmentation — where they get injected into the LLM&apos;s input as context. The LLM then generates an answer grounded in exactly what these chunks contain.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 bg-[#0f1117] border border-slate-800 rounded-xl p-6 mb-4">
          <div className="flex flex-col items-center bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 w-40 text-center">
            <span className="text-slate-300 font-bold text-sm mb-1 text-shadow-sm">📊 All Chunks</span>
            <span className="text-slate-500 text-[10px]">{searchResults.length} scored chunks</span>
          </div>

          <motion.svg width="40" height="24" viewBox="0 0 40 24" className="rotate-90 md:rotate-0">
            <motion.path d="M 0 12 L 36 12" stroke="#64748b" strokeWidth="2" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
            />
            <motion.path d="M 28 4 L 36 12 L 28 20" stroke="#64748b" strokeWidth="2" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
            />
          </motion.svg>

          <div className="flex flex-col items-center bg-amber-500/10 border border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] rounded-lg p-3 w-40 text-center relative">
            <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow">K=2</span>
            <span className="text-amber-400 font-bold text-sm mb-1 text-shadow-sm">🏆 Top K Selected</span>
            <span className="text-amber-500/70 text-[10px]">2 chunks chosen</span>
          </div>

          <motion.svg width="40" height="24" viewBox="0 0 40 24" className="rotate-90 md:rotate-0">
            <motion.path d="M 0 12 L 36 12" stroke="#f59e0b" strokeWidth="2" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5, repeat: Infinity, repeatDelay: 1 }}
            />
            <motion.path d="M 28 4 L 36 12 L 28 20" stroke="#f59e0b" strokeWidth="2" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5, repeat: Infinity, repeatDelay: 1 }}
            />
          </motion.svg>

          <div className="flex flex-col items-center bg-emerald-500/10 border border-emerald-500/50 rounded-lg p-3 w-40 text-center">
            <span className="text-emerald-400 font-bold text-sm mb-1 text-shadow-sm">✍️ Prompt Augmentation</span>
            <span className="text-emerald-500/70 text-[10px]">Next step →</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex flex-wrap gap-2 justify-center mb-1">
            {retrievedChunks.map((chunk, i) => (
              <span key={`pill-${i}`} className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] px-2 py-1 rounded-full shadow-sm">
                📄 {mode === 'web' ? chunk.source : `Chunk #${chunk.chunkIndex}`}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 italic text-center">These two chunks are now heading into the LLM prompt</p>
        </div>
      </motion.div>

      {/* PIPELINE RECAP */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
          <span className="bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">All Chunks Scored</span>
          <span className="text-slate-600">→</span>
          <span className="bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">Sort by Score</span>
          <span className="text-slate-600">→</span>
          <span className="bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">Set K=2</span>
          <span className="text-slate-600">→</span>
          <span className="bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">Slice Top K</span>
          <span className="text-slate-600">→</span>
          <span className="bg-amber-500/20 border border-amber-400/40 text-amber-200 px-2 py-1 rounded flex items-center gap-1">Pass to Prompt <span className="text-emerald-400">✓</span></span>
        </div>
        <p className="text-center text-slate-500 text-[10px] mt-3">
          K=2 means only the top 2 chunks survive to the next stage — everything else is discarded.
        </p>
      </motion.div>

      {/* COLLAPSE BUTTON */}
      <motion.div variants={itemVariants} className="flex justify-center mt-4">
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-widest font-bold flex items-center gap-2"
        >
          <span>▲</span> Close Deep Dive
        </button>
      </motion.div>
    </motion.div>
  );
}
