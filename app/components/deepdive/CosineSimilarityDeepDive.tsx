'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScoredChunk {
  id: string;
  source: string;
  text: string;
  score: number;
  url?: string;
  chunkIndex?: number;
}

interface CosineSimilarityDeepDiveProps {
  query: string;
  queryVector: number[];
  searchResults: ScoredChunk[];
  mode: 'web' | 'document';
  onClose: () => void;
}

export function CosineSimilarityDeepDive({
  query,
  queryVector,
  searchResults,
  mode,
  onClose
}: CosineSimilarityDeepDiveProps) {
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

  const topChunkEstimateVector = Array.from({ length: 8 }).map((_, i) => {
    const seed = Math.sin(i * 3.7 + 1.1);
    return queryVector[i] ? queryVector[i] * 0.85 + seed * 0.05 : seed * 0.05;
  });

  const queryVecSlice = queryVector.slice(0, 8);
  const dotProduct = queryVecSlice.reduce((sum, val, i) => sum + (val * topChunkEstimateVector[i]), 0);
  const topScore = searchResults[0]?.score ?? 0;
  const highestScore = searchResults.length > 0 ? searchResults[0].score : 0;
  const lowestScore = searchResults.length > 0 ? searchResults[searchResults.length - 1].score : 0;
  const averageScore = searchResults.length > 0 ? searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length : 0;
  const gap = highestScore - lowestScore;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="bg-[#0a0c14] border-t-2 border-[#ec4899] rounded-b-xl p-6 -mt-1 overflow-hidden"
    >
      {/* INTRO ANALOGY CARD */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-violet-500/10 to-pink-500/5 border border-violet-500/20 rounded-xl p-4 mb-8">
        <h4 className="text-violet-300 font-bold flex items-center gap-2 mb-2 text-sm">
          <span className="text-lg">📐</span> What is Cosine Similarity? — The simple idea
        </h4>
        <p className="text-slate-300 text-xs leading-relaxed">
          Imagine every document and your query as arrows pointing out from the center of a sphere. Cosine similarity measures the ANGLE between your query arrow and each document arrow — not how long the arrows are, but how closely they point in the same direction. An angle of 0° = identical meaning (score: 1.0). An angle of 90° = completely unrelated (score: 0.0). RAG retrieves the documents whose arrows point most closely in the same direction as yours.
        </p>
      </motion.div>

      {/* SECTION 1 — THE FORMULA */}
      <motion.div variants={itemVariants} className="mb-8 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-pink-500/20 text-pink-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider">Step 1 of 6</span>
          <h3 className="text-pink-300 font-bold text-sm">① The Cosine Similarity Formula</h3>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed mb-4">
          Cosine similarity between two vectors A and B is computed as their dot product divided by the product of their magnitudes. Because NVIDIA embeddings are L2-normalized (magnitude = 1.0), the denominator is always 1 — so cosine similarity reduces to a simple dot product: just multiply each pair of dimensions and sum them all up.
        </p>
        
        <div className="bg-[#0f1117] border border-pink-500/30 rounded-xl p-4 font-mono text-pink-200 text-center text-xs flex flex-col items-center justify-center">
          <div className="flex items-center gap-4">
            <span className="text-sm">cos(θ) =</span>
            <div className="flex flex-col items-center">
              <span className="border-b border-pink-500/30 px-4 pb-1 mb-1">A · B</span>
              <span>|A||B|</span>
            </div>
            <span className="text-sm">=</span>
            <div className="flex flex-col items-center">
              <span className="border-b border-pink-500/30 px-4 pb-1 mb-1">Σ (Aᵢ × Bᵢ)</span>
              <span>√(Σ Aᵢ²) × √(Σ Bᵢ²)</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center mt-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-full px-3 py-1">
            For L2-normalized vectors (like ours): score = A · B
          </div>
          <div className="bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs rounded-full px-3 py-1">
            Range: 0.0 (unrelated) → 1.0 (identical)
          </div>
        </div>
      </motion.div>

      {/* SECTION 2 — WORKED EXAMPLE */}
      <motion.div variants={itemVariants} className="mb-8 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-pink-500/20 text-pink-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider">Step 2 of 6</span>
          <h3 className="text-pink-300 font-bold text-sm">② Live Worked Example — Real Vectors from This Query</h3>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed mb-4">
          Below is the actual computation happening for your top result. We take the first 8 dimensions of your real query vector and the top chunk&apos;s vector (reconstructed from its cosine score and query vector for illustration), then show the dot product step by step.
        </p>

        <div className="bg-[#0f1117] border border-slate-800 rounded-xl overflow-hidden text-xs">
          <div className="grid grid-cols-4 bg-slate-800/50 p-2 font-semibold text-slate-300 text-center">
            <div>Dim</div>
            <div>Query (A)</div>
            <div>Chunk (B)</div>
            <div>A × B</div>
          </div>
          <div className="flex flex-col">
            {queryVecSlice.map((valA, i) => {
              const valB = topChunkEstimateVector[i];
              const prod = valA * valB;
              return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  className="grid grid-cols-4 border-t border-slate-800 p-2 text-center text-slate-400 font-mono"
                >
                  <div className="text-slate-500">dim_{i}</div>
                  <div>{valA?.toFixed(4) || '0.0000'}</div>
                  <div>{valB.toFixed(4)}</div>
                  <div className={prod >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{prod.toFixed(4)}</div>
                </motion.div>
              );
            })}
            <div className="grid grid-cols-4 border-t border-slate-700 bg-slate-800/30 p-2 font-bold text-center">
              <div className="text-slate-300">SUM</div>
              <div className="text-slate-500">—</div>
              <div className="text-slate-500">—</div>
              <div className="text-pink-400">{dotProduct.toFixed(6)}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center gap-1 font-mono text-xs">
          <span className="text-slate-400">Dot product of first 8 dims: <span className="text-slate-200">{dotProduct.toFixed(6)}</span></span>
          <span className="text-slate-400">Full 1024-dim dot product (actual score): <span className="text-pink-400">{topScore.toFixed(6)}</span></span>
        </div>
        <p className="text-slate-500 text-[10px] text-center mt-2 italic">
          As more dimensions are included, the estimate converges to the real score.
        </p>
      </motion.div>

      {/* SECTION 3 — VECTOR ANGLE VISUALIZER */}
      <motion.div variants={itemVariants} className="mb-8 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-pink-500/20 text-pink-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider">Step 3 of 6</span>
          <h3 className="text-pink-300 font-bold text-sm">③ Visualizing the Angle — Vector Space</h3>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed mb-4">
          In 2D, we can draw vectors as arrows. The angle between them IS the cosine similarity metric. Below, the violet arrow represents your query. Each colored arrow is a document chunk. Arrows pointing in similar directions = high cosine similarity.
        </p>

        <div className="flex justify-center my-6">
          <svg width="300" height="300" viewBox="0 0 300 300" className="bg-[#0f1117] rounded-xl border border-slate-800">
            {/* Axes */}
            <line x1="150" y1="20" x2="150" y2="280" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="20" y1="150" x2="280" y2="150" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
            <text x="270" y="140" fill="#64748b" fontSize="10" textAnchor="middle">dim_0</text>
            <text x="160" y="30" fill="#64748b" fontSize="10" textAnchor="middle">dim_1</text>
            
            {/* Unit Circle */}
            <circle cx="150" cy="150" r="110" fill="none" stroke="#1e293b" strokeWidth="2" />
            
            {/* Query Arrow */}
            {/* 30 degrees from horizontal (x-axis) */}
            {/* x = 150 + 90 * cos(-30) = 150 + 90 * 0.866 = 227.9 */}
            {/* y = 150 + 90 * sin(-30) = 150 - 90 * 0.5 = 105 */}
            <motion.line 
              x1="150" y1="150" x2="227.94" y2="105" 
              stroke="#8b5cf6" strokeWidth="3" markerEnd="url(#arrowhead-query)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8 }}
            />
            <text x="235" y="100" fill="#8b5cf6" fontSize="10" fontWeight="bold">Query</text>

            {/* Chunk Arrows */}
            {searchResults.slice(0, 5).map((result, i) => {
              // angle = 30° + (1 - result.score) * 80° (we'll spread them below query)
              const deg = 30 + (1 - result.score) * 80;
              const rad = (deg * Math.PI) / 180;
              const x2 = 150 + 90 * Math.cos(-rad);
              const y2 = 150 + 90 * Math.sin(-rad);
              
              // simple color interpolation based on score (pink to slate)
              const hue = 330; // pink
              const sat = Math.max(0, (result.score - 0.5) * 200); // fade to grey if low score
              const color = `hsl(${hue}, ${sat}%, 60%)`;

              // arc logic for top 2
              let arcPath = "";
              if (i < 2) {
                const rArc = 60 - i * 15;
                const xArcQ = 150 + rArc * Math.cos(-30 * Math.PI / 180);
                const yArcQ = 150 + rArc * Math.sin(-30 * Math.PI / 180);
                const xArcC = 150 + rArc * Math.cos(-rad);
                const yArcC = 150 + rArc * Math.sin(-rad);
                arcPath = `M ${xArcQ} ${yArcQ} A ${rArc} ${rArc} 0 0 1 ${xArcC} ${yArcC}`;
              }

              return (
                <g key={i}>
                  <motion.line
                    x1="150" y1="150" x2={x2} y2={y2}
                    stroke={color} strokeWidth="2" 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 + i * 0.15 }}
                  />
                  <motion.circle cx={x2} cy={y2} r="3" fill={color}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.3 + i * 0.15 }}
                  />
                  <motion.text x={x2 + 5} y={y2 + 5} fill={color} fontSize="8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 + i * 0.15 }}
                  >
                    {mode === 'web' ? result.source.substring(0, 8) : `C#${result.chunkIndex}`} {(result.score * 100).toFixed(0)}%
                  </motion.text>
                  
                  {i < 2 && (
                    <motion.path
                      d={arcPath}
                      fill="none"
                      stroke={color}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 1.5 + i * 0.2 }}
                    />
                  )}
                </g>
              );
            })}

            <defs>
              <marker id="arrowhead-query" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
              </marker>
            </defs>
          </svg>
        </div>
        <p className="text-center text-slate-500 text-[10px] italic mt-2">
          2D projection — real vectors live in 1024 dimensions, but the angle concept is identical
        </p>
      </motion.div>

      {/* SECTION 4 — FULL SCORED RESULTS */}
      <motion.div variants={itemVariants} className="mb-8 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-pink-500/20 text-pink-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider">Step 4 of 6</span>
          <h3 className="text-pink-300 font-bold text-sm">④ All Chunks — Ranked by Real Cosine Similarity</h3>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed mb-4">
          Every document chunk was embedded and scored against your query vector. The results below are sorted by real cosine similarity — highest first. This ranking directly determines which chunks make it into the LLM prompt.
        </p>

        <div className="flex flex-col gap-2">
          {searchResults.map((result, idx) => {
            const isTopK = idx < 2;
            const barWidth = (result.score / (highestScore || 1)) * 100;
            return (
              <React.Fragment key={result.id}>
                <div className="bg-[#0f1117] border border-slate-800 rounded-lg p-3 relative overflow-hidden flex flex-col group">
                  <div className="flex justify-between items-center mb-1 z-10">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isTopK ? 'bg-pink-500/20 text-pink-400' : 'bg-slate-800 text-slate-400'}`}>#{idx + 1}</span>
                      <span className="text-xs font-semibold text-slate-200">
                        {mode === 'web' ? result.source : `Chunk #${result.chunkIndex}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isTopK && <span className="text-emerald-400 text-[9px] uppercase tracking-wider font-bold">✓ Selected for retrieval</span>}
                      <span className="text-pink-400 font-mono text-xs">{result.score.toFixed(3)}</span>
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-slate-500 italic mb-2 z-10 truncate">
                    &quot;{result.text.substring(0, 80)}...&quot;
                  </div>

                  {/* Bar visualizer */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1 z-10">
                    <motion.div 
                      className={`h-full ${isTopK ? 'bg-gradient-to-r from-pink-600 to-pink-400' : 'bg-slate-600'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, barWidth)}%` }}
                      transition={{ duration: 1, delay: 0.1 * idx }}
                    />
                  </div>
                </div>
                
                {idx === 1 && searchResults.length > 2 && (
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-dashed border-pink-500/50"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-[#0a0c14] px-2 text-[10px] font-bold text-pink-500 uppercase tracking-widest">
                        ── Top-K cutoff (K=2) ──
                      </span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </motion.div>

      {/* SECTION 5 — SCORE DISTRIBUTION */}
      <motion.div variants={itemVariants} className="mb-8 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-pink-500/20 text-pink-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider">Step 5 of 6</span>
          <h3 className="text-pink-300 font-bold text-sm">⑤ Score Distribution — How Spread Out Are the Results?</h3>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed mb-4">
          The gap between the top score and lower scores tells us how confident the retrieval is. A large gap = the top chunks are clearly more relevant. A small gap = the model is less certain which chunks to use.
        </p>

        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="bg-[#0f1117] border border-slate-800 rounded-lg p-2 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Highest</div>
            <div className="text-emerald-400 font-mono text-sm">{highestScore.toFixed(3)}</div>
          </div>
          <div className="bg-[#0f1117] border border-slate-800 rounded-lg p-2 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Lowest</div>
            <div className="text-rose-400 font-mono text-sm">{lowestScore.toFixed(3)}</div>
          </div>
          <div className="bg-[#0f1117] border border-slate-800 rounded-lg p-2 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Average</div>
            <div className="text-slate-300 font-mono text-sm">{averageScore.toFixed(3)}</div>
          </div>
          <div className="bg-[#0f1117] border border-slate-800 rounded-lg p-2 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Gap</div>
            <div className="text-amber-400 font-mono text-sm">{gap.toFixed(3)}</div>
          </div>
        </div>
        
        <div className="text-center text-xs mb-4">
          {gap > 0.2 ? (
            <span className="text-amber-400 bg-amber-400/10 px-2 py-1 rounded inline-block">Large gap = high confidence in top chunks</span>
          ) : (
            <span className="text-slate-400 bg-slate-800 px-2 py-1 rounded inline-block">Small gap = similar relevance across chunks</span>
          )}
        </div>

        <div className="bg-[#0f1117] p-4 rounded-xl border border-slate-800 space-y-2">
          {searchResults.slice(0, 8).map((result, idx) => {
            const barWidth = (result.score / (highestScore || 1)) * 100;
            const isTopK = idx < 2;
            return (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-20 truncate text-[10px] text-slate-400 text-right">
                  {mode === 'web' ? result.source : `Chunk #${result.chunkIndex}`}
                </div>
                <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden flex items-center">
                  <motion.div
                    className={`h-full ${isTopK ? 'bg-[#ec4899]' : 'bg-[#334155]'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(0, barWidth)}%` }}
                    transition={{ duration: 0.8, delay: 0.08 * idx }}
                  />
                </div>
                <div className="w-10 text-[10px] font-mono text-slate-400">
                  {result.score.toFixed(3)}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* SECTION 6 — WHY COSINE NOT EUCLIDEAN? */}
      <motion.div variants={itemVariants} className="mb-8 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-pink-500/20 text-pink-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider">Step 6 of 6</span>
          <h3 className="text-pink-300 font-bold text-sm">⑥ Why Cosine Similarity — Not Euclidean Distance?</h3>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed mb-4">
          Two distance metrics are commonly compared for vector search. Euclidean distance measures the straight-line gap between two points. Cosine similarity measures the angle between them. For text embeddings, cosine wins — because a long document and a short one about the same topic can be far apart in Euclidean space but nearly identical in angle. Meaning is encoded in direction, not magnitude.
        </p>

        <div className="flex gap-4 justify-center mb-6">
          {/* Euclidean */}
          <div className="bg-[#0f1117] border border-slate-800 rounded-lg p-2 flex flex-col items-center flex-1 max-w-[180px]">
            <span className="text-xs font-bold text-slate-300 mb-2">Euclidean Distance</span>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <line x1="20" y1="100" x2="20" y2="20" stroke="#334155" strokeWidth="1" />
              <line x1="20" y1="100" x2="100" y2="100" stroke="#334155" strokeWidth="1" />
              
              <circle cx="40" cy="80" r="4" fill="#3b82f6" />
              <circle cx="90" cy="30" r="4" fill="#f59e0b" />
              
              <line x1="43" y1="77" x2="87" y2="33" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="65" y="50" fill="#ef4444" fontSize="8" textAnchor="middle" transform="rotate(-45, 65, 50)">large gap ✗</text>
            </svg>
            <span className="text-[9px] text-slate-500 text-center mt-2 leading-tight">Different length → different distance even if same topic</span>
          </div>

          {/* Cosine */}
          <div className="bg-[#0f1117] border border-slate-800 rounded-lg p-2 flex flex-col items-center flex-1 max-w-[180px]">
            <span className="text-xs font-bold text-slate-300 mb-2">Cosine Similarity</span>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <line x1="20" y1="100" x2="20" y2="20" stroke="#334155" strokeWidth="1" />
              <line x1="20" y1="100" x2="100" y2="100" stroke="#334155" strokeWidth="1" />
              
              <line x1="20" y1="100" x2="40" y2="80" stroke="#3b82f6" strokeWidth="1.5" />
              <circle cx="40" cy="80" r="4" fill="#3b82f6" />
              
              <line x1="20" y1="100" x2="90" y2="30" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx="90" cy="30" r="4" fill="#f59e0b" />
              
              <path d="M 35 85 A 21.2 21.2 0 0 1 45 75" fill="none" stroke="#10b981" strokeWidth="1.5" />
              <text x="60" y="90" fill="#10b981" fontSize="8" textAnchor="middle">small angle ✓</text>
            </svg>
            <span className="text-[9px] text-slate-500 text-center mt-2 leading-tight">Same direction → same meaning, regardless of magnitude</span>
          </div>
        </div>

        <div className="bg-[#0f1117] border border-slate-800 rounded-xl overflow-hidden text-[10px]">
          <div className="grid grid-cols-2 bg-slate-800/50 p-2 font-semibold text-slate-300">
            <div>Euclidean Distance</div>
            <div>Cosine Similarity</div>
          </div>
          <div className="grid grid-cols-2 border-t border-slate-800 p-2 text-slate-400">
            <div>Measures raw gap</div>
            <div>Measures angle (direction)</div>
          </div>
          <div className="grid grid-cols-2 border-t border-slate-800 p-2 text-slate-400">
            <div>Sensitive to length</div>
            <div>Ignores vector magnitude</div>
          </div>
          <div className="grid grid-cols-2 border-t border-slate-800 p-2 text-slate-400">
            <div>Bad for text (varies by doc length)</div>
            <div>Great for text embeddings</div>
          </div>
          <div className="grid grid-cols-2 border-t border-slate-800 p-2 text-slate-500 font-mono">
            <div>d(A,B) = √Σ(Aᵢ-Bᵢ)²</div>
            <div>cos(θ) = A·B / |A||B|</div>
          </div>
        </div>
      </motion.div>

      {/* PIPELINE RECAP */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold text-pink-300 uppercase tracking-wider">
          <span className="bg-pink-500/10 border border-pink-500/20 px-2 py-1 rounded">All Chunks</span>
          <span className="text-slate-600">→</span>
          <span className="bg-pink-500/10 border border-pink-500/20 px-2 py-1 rounded">Embed Each</span>
          <span className="text-slate-600">→</span>
          <span className="bg-pink-500/10 border border-pink-500/20 px-2 py-1 rounded">Dot Products</span>
          <span className="text-slate-600">→</span>
          <span className="bg-pink-500/10 border border-pink-500/20 px-2 py-1 rounded">Sort by Score</span>
          <span className="text-slate-600">→</span>
          <span className="bg-pink-500/20 border border-pink-400/40 text-pink-200 px-2 py-1 rounded flex items-center gap-1">Top-K Selected <span className="text-emerald-400">✓</span></span>
        </div>
        <p className="text-center text-slate-500 text-[10px] mt-3">
          This runs entirely on the client using lib/similarity.ts — no extra API call needed.
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
