'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QueryEmbeddingDeepDiveProps {
  query: string;
  queryVector: number[];
  model: string;
  dimensions: number;
  onClose: () => void;
}

export function QueryEmbeddingDeepDive({ query, queryVector, model, dimensions, onClose }: QueryEmbeddingDeepDiveProps) {
  const words = query.trim().split(/\s+/).filter(Boolean);
  const colorPalette = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

  const stopwords = ['what', 'is', 'a', 'an', 'the', 'are', 'was', 'were', 'how', 'why', 'who'];

  const norm = Math.sqrt(queryVector.reduce((s, v) => s + v * v, 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="bg-[#0a0c14] border-t-2 border-[#8b5cf6] rounded-b-xl p-6 -mt-1 w-full flex flex-col gap-6"
    >
      <motion.div
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        initial="hidden"
        animate="show"
      >
        {/* Section 1 */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="border-b border-slate-800 pb-6 mb-6">
          <h3 className="text-violet-300 font-bold mb-1">① Tokenization</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Before any math happens, your text is split into tokens — small units like words or subwords. The model never sees raw text. It sees token IDs that map to its internal vocabulary. Common words like 'is' get a single token; rare words may split into multiple subword tokens.
          </p>
          <div className="flex flex-wrap gap-2">
            {words.map((word, i) => {
              const tokenId = (i * 1731 + 4999) % 9000 + 1000;
              return (
                <motion.div
                  key={i}
                  variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
                  className="rounded flex flex-col overflow-hidden shadow"
                >
                  <div className="px-3 py-1 text-white font-semibold text-sm text-center shadow-inner" style={{ backgroundColor: colorPalette[i % colorPalette.length] }}>
                    {word}
                  </div>
                  <div className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] text-center font-mono">
                    ID #{tokenId}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <p className="text-slate-500 text-xs mt-3">Token count: {words.length} tokens</p>
        </motion.div>

        {/* Section 2 */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="border-b border-slate-800 pb-6 mb-6">
          <h3 className="text-violet-300 font-bold mb-1">② Embedding Matrix Lookup</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            The model holds an embedding matrix — a table with one learned vector per vocabulary token. Looking up your token IDs in this matrix gives the raw input vectors before any context is considered. These are the starting representations that the transformer will refine.
          </p>
          <div className="overflow-x-auto rounded border border-slate-800">
            <table className="w-full text-left font-mono text-[11px] whitespace-nowrap">
              <thead>
                <tr className="bg-slate-900 text-slate-500">
                  <th className="p-2 font-normal border-b border-slate-800">Token</th>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(j => <th key={j} className="p-2 font-normal border-b border-slate-800">dim_{j}</th>)}
                </tr>
              </thead>
              <tbody>
                {[...words.slice(0, 3), '[CLS]'].map((label, i) => {
                  const isQueryToken = i === 0;
                  return (
                    <tr key={i} className={isQueryToken ? 'bg-[#2d2050] text-violet-300' : (i % 2 === 0 ? 'bg-[#1a1d2e] text-slate-400' : 'bg-[#0f1117] text-slate-400')}>
                      <td className="p-2 font-bold">{label}</td>
                      {[0, 1, 2, 3, 4, 5, 6, 7].map(j => {
                        let val;
                        if (isQueryToken) {
                          val = queryVector[j] || 0;
                        } else {
                          // Deterministic pseudo-random calculation based on i and j
                          const seed = Math.sin((i * 7 + 3) * (j + 1)) * 10000;
                          val = (seed - Math.floor(seed)) * 0.2 - 0.1;
                        }
                        return <td key={j} className="p-2">{val.toFixed(4)}</td>;
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-slate-500 text-[11px] mt-2 italic">★ Row 0 = your actual query vector (first 8 of {dimensions} dims)</p>
        </motion.div>

        {/* Section 3 */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="border-b border-slate-800 pb-6 mb-6">
          <h3 className="text-violet-300 font-bold mb-1">③ Transformer Self-Attention</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            The token vectors pass through multiple transformer layers. In each layer, self-attention lets every token look at every other token and update its own vector based on what's relevant. After all layers, the result is a context-aware representation where 'AI' in 'What is AI' means something different from 'AI' in 'AI in cooking' — because the full sentence shaped it.
          </p>
          
          <div className="relative w-full h-[120px] mb-4 bg-[#0a0c14] rounded overflow-hidden border border-slate-800">
            <svg width="100%" height="100%" className="absolute inset-0">
              <defs>
                <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="currentColor" />
                </marker>
              </defs>
              {words.map((w1, i) => {
                return words.map((w2, j) => {
                  if (i === j) return null;
                  const isStopword = stopwords.includes(w1.toLowerCase()) || stopwords.includes(w2.toLowerCase());
                  const opacity = isStopword ? 0.2 : 0.8;
                  const strokeWidth = isStopword ? 1 : 2;
                  const strokeColor = isStopword ? '#8b5cf6' : '#8b5cf6';
                  
                  // Calculate dynamic positions based on percentage widths
                  const x1 = `${(100 / (words.length + 1)) * (i + 1)}%`;
                  const x2 = `${(100 / (words.length + 1)) * (j + 1)}%`;
                  const y = "80";
                  
                  // Arc logic
                  const distance = Math.abs(j - i);
                  const curveHeight = 80 - (distance * 15);
                  
                  return (
                    <motion.path
                      key={`arc-${i}-${j}`}
                      d={`M ${x1} ${y} Q ${(i+j)/2 * (100/(words.length+1))} ${curveHeight} ${x2} ${y}`}
                      fill="transparent"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={opacity}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 * i + 0.1 * j }}
                    />
                  );
                });
              })}
              {words.map((w, i) => (
                <text
                  key={`text-${i}`}
                  x={`${(100 / (words.length + 1)) * (i + 1)}%`}
                  y="100"
                  fill="white"
                  fontSize="12px"
                  textAnchor="middle"
                  fontFamily="monospace"
                  style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.8)' }}
                >
                  {w}
                </text>
              ))}
            </svg>
          </div>
          
          <div className="overflow-x-auto rounded border border-slate-800 max-w-sm mx-auto">
            <table className="w-full text-center text-[10px] font-mono whitespace-nowrap">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800">
                  <th className="p-1 px-2 text-slate-500 font-normal">FROM →<br/>TO ↓</th>
                  {words.slice(0, 6).map((w, i) => <th key={i} className="p-1 px-2 border-l border-slate-800 text-slate-300">{w}</th>)}
                </tr>
              </thead>
              <tbody>
                {words.slice(0, 6).map((w1, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    <td className="p-1 px-2 font-bold text-slate-400 bg-slate-900 text-left border-r border-slate-800">{w1}</td>
                    {words.slice(0, 6).map((w2, j) => {
                       const isStop1 = stopwords.includes(w1.toLowerCase());
                       const isStop2 = stopwords.includes(w2.toLowerCase());
                       const baseWeight = i === j ? 0.4 : (isStop1 || isStop2 ? 0.05 : 0.25);
                       
                       // Create a semi-deterministic adjustment so rows sum differently but pseudo-randomly
                       const adjust = (Math.sin(i * 13 + j * 17) * 0.05); 
                       const finalWeight = Math.max(0, baseWeight + adjust);
                       const alpha = Math.min(1, finalWeight * 2);
                       
                       return (
                         <td key={j} className="p-1 px-2" style={{ backgroundColor: `rgba(139, 92, 246, ${alpha})` }}>
                           {finalWeight.toFixed(2)}
                         </td>
                       );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Section 4 */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="border-b border-slate-800 pb-6 mb-6">
          <h3 className="text-violet-300 font-bold mb-1">④ Final Query Vector</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            After all transformer layers, the token representations are pooled into one fixed-size vector. This single vector encodes the full meaning of your query as a point in {dimensions}-dimensional space. Queries with similar meanings land near each other in this space — which is exactly how retrieval finds relevant documents.
          </p>
          
          {/* L2 Norm Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Vector magnitude (L2 norm)</span>
              <span className="text-indigo-300 font-mono">{norm.toFixed(4)}</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (norm / 2) * 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Real Vector Heatmap Grid */}
            <div className="flex-1 w-full flex flex-col items-center">
              <div 
                className="grid gap-[2px] bg-[#0f1117] p-2 rounded border border-slate-800 max-w-fit mx-auto" 
                style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}
              >
                {queryVector.slice(0, 64).map((val, i) => {
                  let bgColor = '#1e2235';
                  if (val > 0.01) {
                    const intensity = Math.min(1, val * 15);
                    bgColor = `color-mix(in srgb, #7c3aed ${intensity * 100}%, #312e81)`;
                  } else if (val < -0.01) {
                    const intensity = Math.min(1, Math.abs(val) * 15);
                    bgColor = `color-mix(in srgb, #b91c1c ${intensity * 100}%, #3b1a1a)`;
                  }

                  return (
                    <div 
                      key={i} 
                      className="w-[28px] h-[28px] rounded-sm transition-transform hover:scale-125 hover:z-10 group relative"
                      style={{ backgroundColor: bgColor }}
                    >
                       <div className="absolute opacity-0 group-hover:opacity-100 bg-[#0a0c14] border border-slate-700 text-slate-300 text-[10px] p-1 rounded -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 pointer-events-none">
                         dim_{i}: {val.toFixed(4)}
                       </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-slate-500 text-[10px] mt-2 italic max-w-[200px]">
                First 64 of {dimensions} dimensions — each square = one learned feature dimension
              </p>
            </div>

            {/* Scatter SVG */}
            <div className="flex-1 flex flex-col items-center">
               <div className="relative w-[300px] h-[180px] border border-slate-800 rounded bg-[#0a0c14] overflow-hidden">
                 <svg viewBox="-1 -1 2 2" className="w-full h-full">
                    {/* Grid lines */}
                    <line x1="-1" y1="0" x2="1" y2="0" stroke="#1f2937" strokeWidth="0.01" />
                    <line x1="0" y1="-1" x2="0" y2="1" stroke="#1f2937" strokeWidth="0.01" />

                    {/* Dashed clustering lines */}
                    <line x1="0" y1="0" x2="0.3" y2="0.2" stroke="#4c1d95" strokeWidth="0.02" strokeDasharray="0.05" />
                    <line x1="0" y1="0" x2="-0.2" y2="0.35" stroke="#4c1d95" strokeWidth="0.02" strokeDasharray="0.05" />

                    {/* Nodes */}
                    <circle cx="0.6" cy="-0.5" r="0.04" fill="#64748b" />
                    <text x="0.6" y="-0.56" fill="#94a3b8" fontSize="0.08" textAnchor="middle">"How to cook pasta"</text>

                    <circle cx="-0.5" cy="-0.2" r="0.04" fill="#64748b" />
                    <text x="-0.5" y="-0.26" fill="#94a3b8" fontSize="0.08" textAnchor="middle">"What is quantum physics"</text>

                    <circle cx="0.3" cy="0.2" r="0.04" fill="#8b5cf6" opacity="0.7" />
                    <text x="0.3" y="0.14" fill="#c4b5fd" fontSize="0.08" textAnchor="middle">"Explain machine learning"</text>

                    <circle cx="-0.2" cy="0.35" r="0.04" fill="#8b5cf6" opacity="0.7" />
                    <text x="-0.2" y="0.29" fill="#c4b5fd" fontSize="0.08" textAnchor="middle">"What is deep learning"</text>

                    {/* Main Query Node */}
                    <motion.circle 
                      cx="0" cy="0" r="0.08" fill="none" stroke="#8b5cf6" strokeWidth="0.02"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <circle cx="0" cy="0" r="0.06" fill="#8b5cf6" />
                    <text x="0" y="-0.1" fill="white" fontSize="0.09" textAnchor="middle" fontWeight="bold">&quot;{query.length > 20 ? query.substring(0, 20) + '...' : query}&quot;</text>
                 </svg>
               </div>
               <p className="text-center text-slate-500 text-[10px] mt-2 italic max-w-[300px]">
                 Queries about similar topics cluster together. RAG retrieves documents near YOUR query dot.
               </p>
            </div>
          </div>
        </motion.div>

        {/* Section 5 */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <h3 className="text-violet-300 font-bold mb-3">⑤ Why Embedding Makes RAG Powerful</h3>
          
          <div className="bg-[#1a1508] border-l-4 border-[#f59e0b] rounded-lg p-5 mb-6">
            <ul className="space-y-4 text-xs text-amber-100/80">
              <li className="flex gap-3">
                <span className="text-amber-500">✦</span>
                <div>
                  <strong className="block text-amber-400 mb-0.5">Meaning over keywords</strong>
                  Searching by embedding finds &quot;What is artificial intelligence&quot; AND &quot;define AI&quot; as the same concept — keyword search cannot do this.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-500">✦</span>
                <div>
                  <strong className="block text-amber-400 mb-0.5">The model you choose matters</strong>
                  {model} was specifically trained for retrieval tasks. A general-purpose embedding model would give weaker similarity scores.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-500">✦</span>
                <div>
                  <strong className="block text-amber-400 mb-0.5">{dimensions} dimensions = rich meaning</strong>
                  Each dimension captures a subtle aspect of meaning — tense, topic, sentiment, domain. More dimensions = more nuanced retrieval.
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-lg overflow-hidden border border-slate-700">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-800 text-slate-300">
                  <th className="p-3 font-semibold border-b border-r border-slate-700 w-1/2">🔤 Keyword Search</th>
                  <th className="p-3 font-semibold border-b border-slate-700 w-1/2">🔢 Embedding Search</th>
                </tr>
              </thead>
              <tbody className="text-slate-400 bg-[#0f1117]">
                <tr>
                  <td className="p-3 border-b border-r border-slate-800">Exact word match</td>
                  <td className="p-3 border-b border-slate-800 font-medium text-emerald-400">Semantic meaning match</td>
                </tr>
                <tr className="bg-[#1a1d2e]">
                  <td className="p-3 border-b border-r border-slate-800">&quot;AI&quot; ≠ &quot;artificial intelligence&quot;</td>
                  <td className="p-3 border-b border-slate-800 font-medium text-emerald-400">&quot;AI&quot; ≈ &quot;artificial intelligence&quot;</td>
                </tr>
                <tr>
                  <td className="p-3 border-b border-r border-slate-800">Fast, brittle</td>
                  <td className="p-3 border-b border-slate-800 text-emerald-400">Robust, context-aware</td>
                </tr>
                <tr className="bg-[#1a1d2e]">
                  <td className="p-3 border-r border-slate-800">No understanding</td>
                  <td className="p-3 text-emerald-400">Understands synonyms</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>

      <button 
        type="button"
        onClick={onClose}
        className="w-full pt-4 mt-2 border-t border-slate-800/80 text-center text-xs text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-0 cursor-pointer"
      >
        ▲ Collapse deep dive
      </button>
    </motion.div>
  );
}
