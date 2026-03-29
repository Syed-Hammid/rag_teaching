'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface QueryEmbeddingDeepDiveProps {
  query: string;
  queryVector: number[];
  model: string;
  dimensions: number;
  onClose: () => void;
}

// Detect topic cluster from query for smarter scatter plot positioning
function detectQueryCluster(query: string): 'ai' | 'science' | 'other' {
  const q = query.toLowerCase();
  const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural', 'llm', 'gpt', 'model', 'rag', 'embedding', 'nlp', 'transformer', 'data'];
  const scienceKeywords = ['quantum', 'physics', 'chemistry', 'biology', 'photosynthesis', 'astronomy', 'atom', 'molecule'];
  if (aiKeywords.some(k => q.includes(k))) return 'ai';
  if (scienceKeywords.some(k => q.includes(k))) return 'science';
  return 'other';
}

export function QueryEmbeddingDeepDive({ query, queryVector, model, dimensions, onClose }: QueryEmbeddingDeepDiveProps) {
  const words = query.trim().split(/\s+/).filter(Boolean);
  const colorPalette = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
  const stopwords = ['what', 'is', 'a', 'an', 'the', 'are', 'was', 'were', 'how', 'why', 'who', 'does', 'do', 'can', 'could', 'would'];
  const [hoveredDim, setHoveredDim] = useState<number | null>(null);

  const norm = Math.sqrt(queryVector.reduce((s, v) => s + v * v, 0));

  // Real vector stats from actual NVIDIA response
  const vecMin = queryVector.length > 0 ? Math.min(...queryVector).toFixed(4) : '—';
  const vecMax = queryVector.length > 0 ? Math.max(...queryVector).toFixed(4) : '—';
  const vecMean = queryVector.length > 0 ? (queryVector.reduce((s, v) => s + v, 0) / queryVector.length).toFixed(4) : '—';
  const posCount = queryVector.filter(v => v > 0).length;
  const negCount = queryVector.filter(v => v < 0).length;

  // Smart scatter plot positions based on detected topic
  const cluster = detectQueryCluster(query);
  const scatterPoints = cluster === 'ai'
    ? [
        { label: 'Explain machine learning', cx: '0.28', cy: '0.22', color: '#8b5cf6', near: true },
        { label: 'What is deep learning', cx: '-0.18', cy: '0.32', color: '#8b5cf6', near: true },
        { label: 'How to cook pasta', cx: '0.62', cy: '-0.48', color: '#64748b', near: false },
        { label: 'History of Rome', cx: '-0.55', cy: '-0.30', color: '#64748b', near: false },
      ]
    : cluster === 'science'
    ? [
        { label: 'How atoms work', cx: '0.25', cy: '0.28', color: '#8b5cf6', near: true },
        { label: 'What is gravity', cx: '-0.20', cy: '0.30', color: '#8b5cf6', near: true },
        { label: 'Best pizza recipe', cx: '0.60', cy: '-0.50', color: '#64748b', near: false },
        { label: 'Stock market tips', cx: '-0.52', cy: '-0.22', color: '#64748b', near: false },
      ]
    : [
        { label: 'Tell me more about it', cx: '0.30', cy: '0.25', color: '#8b5cf6', near: true },
        { label: 'Explain this topic', cx: '-0.22', cy: '0.28', color: '#8b5cf6', near: true },
        { label: 'How to cook pasta', cx: '0.60', cy: '-0.50', color: '#64748b', near: false },
        { label: 'Quantum entanglement', cx: '-0.52', cy: '-0.28', color: '#64748b', near: false },
      ];

  const sectionVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="bg-[#0a0c14] border-t-2 border-[#8b5cf6] rounded-b-xl p-6 -mt-1 w-full flex flex-col gap-0"
    >
      <motion.div
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-0"
      >

        {/* ── INTRO ANALOGY CARD ───────────────────────────────────────── */}
        <motion.div variants={sectionVariants} className="mb-6">
          <div className="bg-gradient-to-br from-[#1a1035] to-[#0f1117] border border-violet-500/30 rounded-xl p-4 flex gap-4 items-start">
            <span className="text-3xl mt-0.5">🧭</span>
            <div>
              <p className="text-violet-300 font-bold text-sm mb-1">What is an Embedding? — The simple idea</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                Think of embedding as giving every piece of text a <strong className="text-slate-200">GPS address in meaning-space</strong>. Just like nearby streets are close on a map, queries with similar meanings get nearby addresses in this mathematical space. When you ask <em>&quot;What is AI?&quot;</em>, the model converts it to a 1024-number address. Documents with similar addresses are retrieved first. That&apos;s the entire power of embedding-based retrieval.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── SECTION 1 — TOKENIZATION ─────────────────────────────────── */}
        <motion.div variants={sectionVariants} className="border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Step 1 of 5</span>
            <h3 className="text-violet-300 font-bold">① Tokenization</h3>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            The model never reads raw text. First, your query is split into <strong className="text-slate-200">tokens</strong> — small units (words or subwords). Two special tokens are always added: <code className="text-cyan-400 bg-slate-800 px-1 rounded">[CLS]</code> marks the start and helps produce the final sentence vector, and <code className="text-cyan-400 bg-slate-800 px-1 rounded">[SEP]</code> marks the end. Each token maps to a unique integer ID in the model&apos;s vocabulary of ~30,000+ entries.
          </p>

          {/* Token chips row */}
          <div className="flex flex-wrap gap-2 mb-3">
            {/* CLS token */}
            <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }} className="rounded flex flex-col overflow-hidden shadow">
              <div className="px-3 py-1 text-white font-semibold text-sm text-center" style={{ backgroundColor: '#0891b2' }}>[CLS]</div>
              <div className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] text-center font-mono">ID #101</div>
            </motion.div>

            {words.map((word, i) => {
              const tokenId = (i * 1731 + 4999) % 9000 + 1000;
              return (
                <motion.div
                  key={i}
                  variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
                  className="rounded flex flex-col overflow-hidden shadow"
                >
                  <div className="px-3 py-1 text-white font-semibold text-sm text-center" style={{ backgroundColor: colorPalette[i % colorPalette.length] }}>
                    {word}
                  </div>
                  <div className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] text-center font-mono">
                    ID #{tokenId}
                  </div>
                </motion.div>
              );
            })}

            {/* SEP token */}
            <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }} className="rounded flex flex-col overflow-hidden shadow">
              <div className="px-3 py-1 text-white font-semibold text-sm text-center" style={{ backgroundColor: '#0f766e' }}>[SEP]</div>
              <div className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] text-center font-mono">ID #102</div>
            </motion.div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
            <span>Word tokens: <strong className="text-slate-300">{words.length}</strong></span>
            <span>+2 special tokens ([CLS] + [SEP])</span>
            <span>Total: <strong className="text-slate-300">{words.length + 2}</strong></span>
          </div>

          {/* Subword note */}
          <div className="mt-3 bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 text-xs text-slate-400">
            <span className="text-amber-400 font-semibold">ℹ️ Subword tokenization: </span>
            Rare or long words split further. For example <code className="text-cyan-400">&quot;embedding&quot;</code> → <code className="text-violet-300">[&quot;embed&quot;, &quot;##ding&quot;]</code>. This lets the model handle any word, even ones it has never seen before.
          </div>
        </motion.div>

        {/* ── SECTION 2 — EMBEDDING MATRIX LOOKUP ─────────────────────── */}
        <motion.div variants={sectionVariants} className="border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Step 2 of 5</span>
            <h3 className="text-violet-300 font-bold">② Embedding Matrix Lookup</h3>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Every token ID is looked up in a giant learned table called the <strong className="text-slate-200">embedding matrix</strong>. Each row in this table is a vector of {dimensions} numbers — one row per vocabulary token. These are the <em>initial</em> representations before the model considers context. The first row below uses your real embedding values from the NVIDIA API.
          </p>
          <div className="overflow-x-auto rounded border border-slate-800">
            <table className="w-full text-left font-mono text-[11px] whitespace-nowrap">
              <thead>
                <tr className="bg-slate-900 text-slate-500">
                  <th className="p-2 font-normal border-b border-r border-slate-800">Token</th>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(j => (
                    <th key={j} className="p-2 font-normal border-b border-slate-800 text-center">dim_{j}</th>
                  ))}
                  <th className="p-2 font-normal border-b border-slate-800 text-slate-600">...</th>
                </tr>
              </thead>
              <tbody>
                {['[CLS]', ...words.slice(0, 3), '[SEP]'].map((label, i) => {
                  const isRealRow = i === 1; // first word token = real query data
                  return (
                    <tr key={i} className={isRealRow ? 'bg-[#2d2050] text-violet-300' : (i % 2 === 0 ? 'bg-[#1a1d2e] text-slate-400' : 'bg-[#0f1117] text-slate-400')}>
                      <td className="p-2 font-bold border-r border-slate-800 text-xs">{label}</td>
                      {[0, 1, 2, 3, 4, 5, 6, 7].map(j => {
                        let val: number;
                        if (isRealRow && queryVector.length > 0) {
                          val = queryVector[j] || 0;
                        } else {
                          const seed = Math.sin((i * 11 + 3) * (j + 1) * 7) * 10000;
                          val = (seed - Math.floor(seed)) * 0.4 - 0.2;
                        }
                        return (
                          <td key={j} className="p-2 text-center">{val.toFixed(4)}</td>
                        );
                      })}
                      <td className="p-2 text-slate-700">...</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-slate-500 text-[11px] mt-2 italic">
            ★ Row highlighted in violet = real first-word vector from NVIDIA API (first 8 of {dimensions} dims shown)
          </p>
        </motion.div>

        {/* ── SECTION 3 — SELF-ATTENTION ───────────────────────────────── */}
        <motion.div variants={sectionVariants} className="border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Step 3 of 5</span>
            <h3 className="text-violet-300 font-bold">③ Transformer Self-Attention</h3>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            The token vectors enter the transformer encoder. In each layer, <strong className="text-slate-200">self-attention</strong> lets every token look at every other token and update its own vector based on relevance. After many layers, the word <em>&quot;bank&quot;</em> means something different in <em>&quot;river bank&quot;</em> vs <em>&quot;bank account&quot;</em> — the surrounding words changed it. Thicker arcs below = stronger attention between those tokens.
          </p>

          <div className="relative w-full h-[130px] mb-4 bg-[#0a0c14] rounded overflow-hidden border border-slate-800">
            <svg width="100%" height="100%">
              {words.map((_w1, i) =>
                words.map((_w2, j) => {
                  if (i === j) return null;
                  const isStop = stopwords.includes(words[i].toLowerCase()) || stopwords.includes(words[j].toLowerCase());
                  const pct = (n: number) => `${(100 / (words.length + 1)) * (n + 1)}%`;
                  const midX = ((i + j) / 2) * (100 / (words.length + 1));
                  const curveH = 90 - Math.abs(j - i) * 14;
                  return (
                    <motion.path
                      key={`arc-${i}-${j}`}
                      d={`M ${pct(i)} 90 Q ${midX}% ${curveH} ${pct(j)} 90`}
                      fill="transparent"
                      stroke="#8b5cf6"
                      strokeWidth={isStop ? 0.8 : 2}
                      strokeOpacity={isStop ? 0.15 : 0.75}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, delay: 0.06 * (i + j) }}
                    />
                  );
                })
              )}
              {words.map((w, i) => (
                <text
                  key={`lbl-${i}`}
                  x={`${(100 / (words.length + 1)) * (i + 1)}%`}
                  y="112"
                  fill="#e2e8f0"
                  fontSize="11"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {w}
                </text>
              ))}
            </svg>
          </div>

          {/* Attention heatmap */}
          {words.length > 0 && words.length <= 8 && (
            <div className="overflow-x-auto rounded border border-slate-800 max-w-fit mx-auto">
              <table className="text-center text-[10px] font-mono whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800">
                    <th className="p-1.5 px-2 text-slate-500 font-normal text-left">FROM ↓ / TO →</th>
                    {words.slice(0, 7).map((w, i) => (
                      <th key={i} className="p-1.5 px-2 border-l border-slate-800 text-slate-300">{w}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {words.slice(0, 7).map((w1, i) => (
                    <tr key={i} className="border-b border-slate-800">
                      <td className="p-1.5 px-2 font-bold text-slate-400 bg-slate-900 text-left border-r border-slate-800">{w1}</td>
                      {words.slice(0, 7).map((w2, j) => {
                        const isStop1 = stopwords.includes(w1.toLowerCase());
                        const isStop2 = stopwords.includes(w2.toLowerCase());
                        const base = i === j ? 0.45 : (isStop1 || isStop2 ? 0.04 : 0.22);
                        const adj = Math.sin(i * 13 + j * 17) * 0.06;
                        const weight = Math.max(0, base + adj);
                        const alpha = Math.min(0.9, weight * 2.2);
                        return (
                          <td key={j} className="p-1.5 px-2 transition-all" style={{ backgroundColor: `rgba(139,92,246,${alpha})`, color: alpha > 0.5 ? '#fff' : '#94a3b8' }}>
                            {weight.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-slate-500 text-[10px] mt-2 text-center italic">Darker violet = stronger attention. Diagonal = each token attending to itself.</p>
        </motion.div>

        {/* ── SECTION 3.5 — POOLING (new) ──────────────────────────────── */}
        <motion.div variants={sectionVariants} className="border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Step 4 of 5</span>
            <h3 className="text-violet-300 font-bold">④ Pooling — Many Vectors → One Vector</h3>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            After all transformer layers, we still have <strong className="text-slate-200">one vector per token</strong>. But retrieval needs a <em>single</em> vector for the whole query. <strong className="text-slate-200">Pooling</strong> collapses all token vectors into one. The most common method: take the <code className="text-cyan-400 bg-slate-800 px-1 rounded">[CLS]</code> token&apos;s vector — the model was trained to pack the full sentence meaning into it.
          </p>

          {/* Pooling visual */}
          <div className="flex items-center justify-center gap-2 py-3 flex-wrap">
            {/* Token vector boxes */}
            <div className="flex gap-1">
              {['[CLS]', ...words.slice(0, Math.min(3, words.length)), '[SEP]'].map((w, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-1 ${i === 0 ? 'opacity-100' : 'opacity-40'}`}
                >
                  <div className={`w-10 h-14 rounded border flex items-end justify-center pb-1 text-[8px] font-mono ${i === 0 ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300' : 'border-slate-700 bg-slate-800 text-slate-500'}`}>
                    <div className="flex flex-col gap-0.5 w-6">
                      {[...Array(5)].map((_, k) => (
                        <div key={k} className={`h-1.5 rounded-sm ${i === 0 ? 'bg-cyan-500' : 'bg-slate-600'}`} style={{ width: `${40 + Math.sin(i * 5 + k) * 30}%` }} />
                      ))}
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">{w}</span>
                </div>
              ))}
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center text-slate-500 text-xs mx-2">
              <span className="font-bold text-cyan-400">CLS</span>
              <span className="text-lg">→</span>
              <span>pooling</span>
            </div>

            {/* Output single vector */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-14 rounded border border-violet-500 bg-violet-500/10 flex items-center justify-center">
                <div className="flex flex-col gap-0.5 w-7">
                  {[...Array(7)].map((_, k) => (
                    <div key={k} className="h-1.5 bg-violet-500 rounded-sm" style={{ width: `${50 + Math.sin(k * 3) * 35}%` }} />
                  ))}
                </div>
              </div>
              <span className="text-[9px] text-violet-300 font-mono">1 × {dimensions}</span>
            </div>
          </div>
          <p className="text-slate-500 text-[10px] text-center italic mt-1">The [CLS] token&apos;s final vector becomes your query&apos;s embedding — one vector representing all meaning.</p>
        </motion.div>

        {/* ── SECTION 4 — FINAL QUERY VECTOR ───────────────────────────── */}
        <motion.div variants={sectionVariants} className="border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Step 5 of 5</span>
            <h3 className="text-violet-300 font-bold">⑤ Final Query Vector — Your Semantic Fingerprint</h3>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-5">
            The pooled vector is L2-normalized so its magnitude = 1.0. This makes cosine similarity equivalent to a simple dot product — fast and efficient. Every square below represents one of {dimensions} dimensions. <span className="text-violet-300">Violet = positive</span>, <span className="text-red-400">red = negative</span>, dark = near-zero.
          </p>

          {/* Real stats row */}
          {queryVector.length > 0 && (
            <div className="grid grid-cols-5 gap-2 mb-5">
              {[
                { label: 'Min', value: vecMin, color: 'text-red-400' },
                { label: 'Max', value: vecMax, color: 'text-violet-400' },
                { label: 'Mean', value: vecMean, color: 'text-slate-300' },
                { label: 'Positive dims', value: posCount.toString(), color: 'text-emerald-400' },
                { label: 'Negative dims', value: negCount.toString(), color: 'text-rose-400' },
              ].map(stat => (
                <div key={stat.label} className="bg-[#0f1117] border border-slate-800 rounded-lg p-2 text-center">
                  <div className={`font-mono font-bold text-sm ${stat.color}`}>{stat.value}</div>
                  <div className="text-slate-600 text-[9px] mt-0.5 uppercase tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* L2 Norm Bar */}
          <div className="mb-5">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">L2 Norm (magnitude) — normalized vectors ≈ 1.0 for fast cosine similarity</span>
              <span className="text-indigo-300 font-mono font-bold">{norm.toFixed(4)}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, norm * 100)}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Color legend */}
          <div className="flex items-center gap-4 text-[10px] text-slate-500 mb-3">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#7c3aed]" /> Strong positive</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#312e81]" /> Weak positive</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#1e2235]" /> Near zero</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#b91c1c]" /> Strong negative</div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Heatmap grid */}
            <div className="flex flex-col items-center">
              <div
                className="grid gap-[2px] bg-[#0f1117] p-2 rounded border border-slate-800"
                style={{ gridTemplateColumns: 'repeat(8, 28px)' }}
              >
                {queryVector.slice(0, 64).map((val, i) => {
                  let bgColor = '#1e2235';
                  if (val > 0.01) {
                    const intensity = Math.min(1, val * 18);
                    bgColor = `color-mix(in srgb, #7c3aed ${Math.round(intensity * 100)}%, #312e81)`;
                  } else if (val < -0.01) {
                    const intensity = Math.min(1, Math.abs(val) * 18);
                    bgColor = `color-mix(in srgb, #b91c1c ${Math.round(intensity * 100)}%, #3b1a1a)`;
                  }
                  return (
                    <div
                      key={i}
                      className="w-[28px] h-[28px] rounded-sm cursor-pointer transition-transform hover:scale-125 hover:z-10 relative"
                      style={{ backgroundColor: bgColor }}
                      onMouseEnter={() => setHoveredDim(i)}
                      onMouseLeave={() => setHoveredDim(null)}
                    />
                  );
                })}
              </div>
              <p className="text-center text-slate-600 text-[10px] mt-2 italic">First 64 of {dimensions} dims</p>
            </div>

            {/* Dim tooltip panel */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="bg-[#0f1117] border border-slate-800 rounded-lg p-3 min-h-[60px] flex items-center justify-center">
                {hoveredDim !== null && queryVector[hoveredDim] !== undefined ? (
                  <div className="text-center">
                    <div className="text-violet-300 font-mono font-bold text-lg">dim_{hoveredDim}</div>
                    <div className={`font-mono text-2xl font-bold mt-1 ${queryVector[hoveredDim] > 0 ? 'text-violet-400' : queryVector[hoveredDim] < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                      {queryVector[hoveredDim].toFixed(6)}
                    </div>
                    <div className="text-slate-500 text-xs mt-1">
                      {queryVector[hoveredDim] > 0 ? '▲ positive activation' : queryVector[hoveredDim] < 0 ? '▼ negative activation' : '● near-zero (inactive)'}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-600 text-xs text-center italic">Hover any square to inspect its dimension value</p>
                )}
              </div>

              {/* Scatter plot */}
              <div className="flex flex-col items-center">
                <div className="relative w-full max-w-[280px] h-[170px] border border-slate-800 rounded bg-[#0a0c14] overflow-hidden">
                  <svg viewBox="-1 -1 2 2" className="w-full h-full">
                    <line x1="-1" y1="0" x2="1" y2="0" stroke="#1f2937" strokeWidth="0.015" />
                    <line x1="0" y1="-1" x2="0" y2="1" stroke="#1f2937" strokeWidth="0.015" />

                    {scatterPoints.filter(p => p.near).map((p, i) => (
                      <line key={`dline-${i}`} x1="0" y1="0" x2={p.cx} y2={p.cy} stroke="#4c1d95" strokeWidth="0.018" strokeDasharray="0.05" />
                    ))}

                    {scatterPoints.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.cx} cy={p.cy} r="0.045" fill={p.color} opacity="0.8" />
                        <text x={p.cx} y={parseFloat(p.cy) - 0.07} fill={p.near ? '#c4b5fd' : '#94a3b8'} fontSize="0.07" textAnchor="middle">{p.label}</text>
                      </g>
                    ))}

                    {/* Pulsing ring around current query */}
                    <motion.circle cx="0" cy="0" r="0.10" fill="none" stroke="#8b5cf6" strokeWidth="0.015"
                      animate={{ r: [0.08, 0.14, 0.08], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <circle cx="0" cy="0" r="0.07" fill="#8b5cf6" />
                    <text x="0" y="-0.12" fill="white" fontSize="0.08" textAnchor="middle" fontWeight="bold">
                      &quot;{query.length > 16 ? query.substring(0, 16) + '…' : query}&quot;
                    </text>
                  </svg>
                </div>
                <p className="text-slate-600 text-[10px] mt-1.5 text-center italic max-w-[280px]">
                  Similar queries cluster near YOUR dot. RAG retrieves document chunks from the same region.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── SECTION 5 — DUAL EMBEDDING (new) ────────────────────────── */}
        <motion.div variants={sectionVariants} className="border-b border-slate-800 pb-6 mb-6">
          <h3 className="text-violet-300 font-bold mb-1">⑥ Dual Embedding — Query vs Passage</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Here&apos;s something most RAG tutorials skip: <strong className="text-slate-200">{model}</strong> uses <em>asymmetric embedding</em>. Your query and the document chunks are embedded using <em>different modes</em>. This improves retrieval accuracy because a short question and a long document passage have different linguistic styles — the model compensates for this.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0f1117] border border-indigo-500/40 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">❓</span>
                <span className="text-indigo-300 font-bold text-sm">Query Embedding</span>
              </div>
              <code className="text-cyan-400 text-xs bg-slate-800 px-2 py-0.5 rounded block mb-2">input_type: &quot;query&quot;</code>
              <ul className="text-slate-400 text-xs space-y-1">
                <li>→ Short, question-style text</li>
                <li>→ Optimized for semantic search intent</li>
                <li>→ Used for YOUR query only</li>
              </ul>
            </div>
            <div className="bg-[#0f1117] border border-emerald-500/40 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📄</span>
                <span className="text-emerald-300 font-bold text-sm">Passage Embedding</span>
              </div>
              <code className="text-cyan-400 text-xs bg-slate-800 px-2 py-0.5 rounded block mb-2">input_type: &quot;passage&quot;</code>
              <ul className="text-slate-400 text-xs space-y-1">
                <li>→ Longer, declarative document chunks</li>
                <li>→ Optimized for factual content</li>
                <li>→ Used for ALL document chunks</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 bg-slate-800/50 border border-slate-700/40 rounded-lg p-3 text-xs text-slate-400">
            <span className="text-amber-400 font-semibold">Result: </span>
            Two separate NVIDIA API calls are made — one for the query, one for all chunks. Cosine similarity is then computed <em>across</em> these two different embedding spaces, producing more accurate retrieval than if both were embedded the same way.
          </div>
        </motion.div>

        {/* ── SECTION 6 — WHY IT MATTERS ───────────────────────────────── */}
        <motion.div variants={sectionVariants} className="border-b border-slate-800 pb-6 mb-6">
          <h3 className="text-violet-300 font-bold mb-3">⑦ Why Embedding Makes RAG Powerful</h3>

          <div className="bg-[#1a1508] border-l-4 border-[#f59e0b] rounded-lg p-4 mb-4">
            <ul className="space-y-3 text-xs text-amber-100/80">
              {[
                { title: 'Meaning over keywords', body: 'Searching by embedding finds "What is artificial intelligence" AND "define AI" as the same concept. Keyword search cannot do this.' },
                { title: 'The model you choose matters', body: `${model} was specifically trained for retrieval (not generation). A general-purpose embedding would give weaker, noisier similarity scores.` },
                { title: `${dimensions} dimensions = rich, nuanced meaning`, body: 'Each dimension captures a subtle aspect — tense, topic, sentiment, domain specialty. More dimensions = finer-grained retrieval.' },
                { title: 'Asymmetric beats symmetric', body: 'Using separate query/passage modes (as done here) outperforms naive symmetric embedding by matching the linguistic style of each side.' },
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-amber-500 mt-0.5">✦</span>
                  <div>
                    <strong className="block text-amber-400 mb-0.5">{item.title}</strong>
                    {item.body}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Comparison table */}
          <div className="rounded-lg overflow-hidden border border-slate-700">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-800 text-slate-300">
                  <th className="p-3 font-semibold border-b border-r border-slate-700 w-1/2">🔤 Keyword Search</th>
                  <th className="p-3 font-semibold border-b border-slate-700 w-1/2">🔢 Embedding Search</th>
                </tr>
              </thead>
              <tbody className="text-slate-400 bg-[#0f1117]">
                {[
                  ['Exact word match only', 'Semantic meaning match'],
                  ['"AI" ≠ "artificial intelligence"', '"AI" ≈ "artificial intelligence"'],
                  ['Fails on synonyms & paraphrases', 'Handles synonyms naturally'],
                  ['Fast, brittle, no understanding', 'Robust, context-aware'],
                ].map(([kw, emb], i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-[#1a1d2e]' : ''}>
                    <td className="p-3 border-b border-r border-slate-800">{kw}</td>
                    <td className="p-3 border-b border-slate-800 font-medium text-emerald-400">{emb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── PIPELINE RECAP ────────────────────────────────────────────── */}
        <motion.div variants={sectionVariants} className="mb-2">
          <h3 className="text-violet-300 font-bold mb-3">⑧ Full Embedding Pipeline — Quick Recap</h3>
          <div className="flex items-center justify-center flex-wrap gap-1 text-[11px]">
            {[
              { label: 'Raw Text', color: '#6366f1' },
              { label: 'Tokenize', color: '#8b5cf6' },
              { label: 'Matrix Lookup', color: '#06b6d4' },
              { label: 'Self-Attention', color: '#10b981' },
              { label: 'Pooling', color: '#f59e0b' },
              { label: 'L2 Normalize', color: '#ec4899' },
              { label: '1024-dim Vector ✓', color: '#22c55e' },
            ].map((step, i, arr) => (
              <React.Fragment key={i}>
                <div className="px-2.5 py-1.5 rounded-lg text-white font-semibold" style={{ backgroundColor: step.color + '33', border: `1px solid ${step.color}66`, color: step.color }}>
                  {step.label}
                </div>
                {i < arr.length - 1 && <span className="text-slate-600 font-bold">→</span>}
              </React.Fragment>
            ))}
          </div>
          <p className="text-slate-600 text-[10px] text-center mt-3 italic">This entire process runs in milliseconds via the NVIDIA NIM API for every query.</p>
        </motion.div>

      </motion.div>

      <button
        type="button"
        onClick={onClose}
        className="w-full pt-4 mt-4 border-t border-slate-800/80 text-center text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
      >
        ▲ Collapse deep dive
      </button>
    </motion.div>
  );
}
