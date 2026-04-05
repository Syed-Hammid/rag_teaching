'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ScoredChunk {
  id: string
  source: string
  text: string
  score: number
  url?: string
  chunkIndex?: number
}

interface PromptAugmentationDeepDiveProps {
  query: string
  augmentedPrompt: string
  retrievedChunks: ScoredChunk[]
  mode: 'web' | 'document'
  onClose: () => void
}

export function PromptAugmentationDeepDive({
  query,
  augmentedPrompt,
  retrievedChunks,
  mode,
  onClose
}: PromptAugmentationDeepDiveProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(augmentedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const systemTokens = Math.round((mode === 'web' 
    ? 248 // approx length
    : 215) / 4);

  const contextTokens = Math.round(retrievedChunks.reduce((acc, chunk) => acc + chunk.text.length, 0) / 4);
  const totalTokens = Math.round(augmentedPrompt.length / 4);
  // Using 128000 as total window for Llama 3.3 70B
  const remainingTokens = 128000 - systemTokens - contextTokens;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -20, height: 0 }}
      className="bg-[#0a0c14] border-t-2 border-[#10b981] rounded-b-xl p-6 -mt-1 overflow-hidden"
    >
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-6"
      >
        {/* Header / Intro */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">âœï¸</span>
            <h3 className="text-emerald-300 font-bold text-lg">What is Prompt Augmentation? â€” The simple idea</h3>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            Imagine you are a student taking an open-book exam. Instead of answering purely from memory, you are handed exactly the right pages from the textbook before writing your answer. Prompt Augmentation is that handoff â€” the retrieved chunks are placed directly inside the LLM&apos;s input so it can read the facts before generating its response. Without this step, the LLM would answer purely from its training data, risking hallucination. With it, the LLM is grounded in real, retrieved knowledge.
          </p>
        </motion.div>

        {/* SECTION 1 */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Step 1 of 5</span>
            <h4 className="text-emerald-300 font-bold">â‘  Anatomy of the Augmented Prompt</h4>
          </div>
          <p className="text-slate-300 text-sm mb-4">
            Every RAG prompt has three distinct parts that are assembled in order before being sent to the LLM. Each part serves a different role. Understanding this structure is the key to understanding why RAG answers are grounded rather than hallucinated.
          </p>

          <div className="flex flex-col gap-3">
            {/* Card 1 */}
            <motion.div 
              variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
              transition={{ delay: 0.15 }}
              className="bg-[#0f1117] border-l-4 border-[#6366f1] p-4 rounded-r-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <span>ðŸ›¡ï¸</span>
                <span className="text-[#6366f1] font-bold text-sm">SYSTEM INSTRUCTION</span>
                <span className="bg-indigo-500/20 text-indigo-300 text-[9px] px-2 py-0.5 rounded-full ml-auto uppercase tracking-wider">Part 1 of 3</span>
              </div>
              <div className="bg-[#07080b] font-mono text-xs text-slate-300 p-3 rounded mb-2 border border-slate-800">
                System: {mode === 'web' 
                  ? "You are a knowledgeable assistant. Answer the user's question clearly and comprehensively using the provided context..." 
                  : "You are a precise document assistant. Answer the user's question using ONLY the provided document context..."}
              </div>
              <p className="text-slate-500 text-xs italic">
                Tells the LLM WHO it is and HOW to behave. This is set once and applies to every query.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
              transition={{ delay: 0.3 }}
              className="bg-[#0f1117] border-l-4 border-[#10b981] p-4 rounded-r-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <span>ðŸ“„</span>
                <span className="text-[#10b981] font-bold text-sm">RETRIEVED CONTEXT</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-2 py-0.5 rounded-full ml-auto uppercase tracking-wider">Part 2 of 3</span>
              </div>
              <div className="bg-[#07080b] font-mono text-xs text-emerald-300/80 p-3 rounded mb-2 border border-slate-800 flex flex-col gap-3">
                {retrievedChunks.map((chunk, i) => (
                  <div key={i}>
                    <div className="text-slate-500 mb-1">[Chunk {i + 1} â€” {mode === 'web' ? chunk.source : `Chunk #${chunk.chunkIndex}`}]</div>
                    <div>{chunk.text}</div>
                  </div>
                ))}
              </div>
              <p className="text-slate-500 text-xs italic">
                This is the knowledge injection â€” real information retrieved from the vector database. The LLM is instructed to ground its answer in this content.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
              transition={{ delay: 0.45 }}
              className="bg-[#0f1117] border-l-4 border-[#3b82f6] p-4 rounded-r-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <span>â“</span>
                <span className="text-[#3b82f6] font-bold text-sm">USER QUESTION</span>
                <span className="bg-blue-500/20 text-blue-300 text-[9px] px-2 py-0.5 rounded-full ml-auto uppercase tracking-wider">Part 3 of 3</span>
              </div>
              <div className="bg-[#07080b] font-mono text-xs text-blue-300 p-3 rounded mb-2 border border-slate-800">
                Question: {query}
              </div>
              <p className="text-slate-500 text-xs italic">
                The original query â€” placed AFTER the context so the LLM reads the facts before the question.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* SECTION 2 */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Step 2 of 5</span>
            <h4 className="text-emerald-300 font-bold">â‘¡ The Complete Prompt â€” Exactly as Sent to the LLM</h4>
          </div>
          <p className="text-slate-300 text-sm mb-4">
            This is the verbatim prompt that was assembled and sent to meta/llama-3.3-70b-instruct. Every character here is what the LLM read before generating the answer. Notice how the retrieved context sits between the system instruction and the question.
          </p>

          <div className="relative">
            <button 
              onClick={handleCopy}
              className="absolute top-2 right-2 text-xs text-slate-500 hover:text-slate-300 bg-slate-800 px-2 py-1 rounded border border-slate-700 transition-colors z-10"
            >
              {copied ? 'âœ“ Copied!' : 'ðŸ“‹ Copy prompt'}
            </button>
            <div className="bg-[#0a0c14] border border-emerald-500/20 rounded-xl p-4 max-h-[320px] overflow-y-auto font-mono text-xs pt-10">
              {augmentedPrompt.split('\n').map((line, i) => {
                if (!line) return <br key={i} />;
                if (line.startsWith('System:')) return <div key={i} className="text-slate-400">{line}</div>;
                if (line.startsWith('Context:')) return <div key={i} className="text-emerald-400 font-bold mt-4 mb-2">{line}</div>;
                if (line.startsWith('Question:')) return <div key={i} className="text-blue-400 font-bold mt-4">{line}</div>;
                return <div key={i} className="text-emerald-300/70 mb-2">{line}</div>;
              })}
            </div>
            <div className="text-right mt-2 text-slate-500 text-xs">
              Estimated prompt tokens: ~{totalTokens.toLocaleString()}
            </div>
          </div>
        </motion.div>

        {/* SECTION 3 */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Step 3 of 5</span>
            <h4 className="text-emerald-300 font-bold">â‘¢ With vs Without Augmentation â€” The Difference</h4>
          </div>
          <p className="text-slate-300 text-sm mb-4">
            The most important thing augmentation does is prevent hallucination. See below what the LLM would likely produce with and without the retrieved context for this exact query.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 flex flex-col h-full">
              <h5 className="text-rose-400 font-semibold text-xs mb-3">âŒ No Context Injected</h5>
              <div className="text-slate-400 text-xs leading-relaxed italic flex-grow">
                &quot;Based on my training data, {query.length > 20 ? query.substring(0, 20) + '...' : query} is a complex topic. However, I may not have the most current or specific information on this. The details can vary significantly and I recommend verifying with up-to-date sources...&quot;
              </div>
              <div className="mt-3">
                <span className="text-rose-400 text-[10px] bg-rose-500/10 rounded px-2 py-0.5 inline-block">âš ï¸ Vague â€¢ May hallucinate â€¢ No source grounding</span>
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex flex-col h-full">
              <h5 className="text-emerald-400 font-semibold text-xs mb-3">âœ… Context Injected from {retrievedChunks.length} Chunks</h5>
              <div className="text-slate-300 text-xs leading-relaxed flex-grow">
                Based on: [{mode === 'web' ? retrievedChunks[0]?.source : `Chunk #${retrievedChunks[0]?.chunkIndex}`}] {retrievedChunks.length > 1 ? `and [${mode === 'web' ? retrievedChunks[1]?.source : `Chunk #${retrievedChunks[1]?.chunkIndex}`}]` : ''} â€” the LLM now has specific, sourced information to synthesize a grounded answer from.
                <div className="mt-2 text-slate-400 italic line-clamp-3">
                  &quot;{retrievedChunks[0]?.text.substring(0, 200)}...&quot;
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {retrievedChunks.map((chunk, i) => (
                  <span key={i} className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                    ðŸ“„ {mode === 'web' ? chunk.source : `Chunk #${chunk.chunkIndex}`}
                  </span>
                ))}
              </div>

              <div className="mt-3">
                <span className="text-emerald-400 text-[10px] bg-emerald-500/10 rounded px-2 py-0.5 inline-block">âœ“ Grounded â€¢ Source-cited â€¢ Factual</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SECTION 4 */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Step 4 of 5</span>
            <h4 className="text-emerald-300 font-bold">â‘£ Prompt Engineering â€” Why These Exact Words?</h4>
          </div>
          <p className="text-slate-300 text-sm mb-4">
            The system instruction is not random. Every phrase in it is an intentional prompt engineering decision that shapes how the LLM behaves. Small word changes produce very different outputs.
          </p>

          <div className="border border-slate-700 rounded-xl overflow-hidden bg-[#0f1117] text-xs">
            {mode === 'web' ? (
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-slate-700/50 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-emerald-300 font-mono w-1/3">&quot;knowledgeable assistant&quot;</td>
                    <td className="p-3 text-slate-400">Sets confident, expert tone â€” not hesitant or robotic</td>
                  </tr>
                  <tr className="border-b border-slate-700/50 bg-white/[0.02] hover:bg-white/5 transition-colors">
                    <td className="p-3 text-emerald-300 font-mono">&quot;clearly and comprehensively&quot;</td>
                    <td className="p-3 text-slate-400">Prevents overly academic or terse responses</td>
                  </tr>
                  <tr className="border-b border-slate-700/50 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-emerald-300 font-mono">&quot;using the provided context&quot;</td>
                    <td className="p-3 text-slate-400">The core RAG constraint â€” forces grounding in retrieved chunks, reduces hallucination</td>
                  </tr>
                  <tr className="border-b border-slate-700/50 bg-white/[0.02] hover:bg-white/5 transition-colors">
                    <td className="p-3 text-emerald-300 font-mono">&quot;Synthesize naturally&quot;</td>
                    <td className="p-3 text-slate-400">Prevents the LLM from just copy-pasting chunks verbatim</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="p-3 text-emerald-300 font-mono">&quot;note any gaps&quot;</td>
                    <td className="p-3 text-slate-400">Keeps the LLM honest when context is insufficient</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-slate-700/50 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-emerald-300 font-mono w-1/3">&quot;precise document assistant&quot;</td>
                    <td className="p-3 text-slate-400">Narrows scope â€” don&apos;t go beyond the uploaded file</td>
                  </tr>
                  <tr className="border-b border-slate-700/50 bg-white/[0.02] hover:bg-white/5 transition-colors">
                    <td className="p-3 text-emerald-300 font-mono">&quot;ONLY the provided document context&quot;</td>
                    <td className="p-3 text-slate-400">Capital ONLY = strong constraint against outside knowledge</td>
                  </tr>
                  <tr className="border-b border-slate-700/50 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-emerald-300 font-mono">&quot;reference relevant details&quot;</td>
                    <td className="p-3 text-slate-400">Encourages specific citations from the document</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors bg-white/[0.02]">
                    <td className="p-3 text-emerald-300 font-mono">&quot;state clearly what is and isn&apos;t covered&quot;</td>
                    <td className="p-3 text-slate-400">Honest scope limitation rather than making up missing info</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* SECTION 5 */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Step 5 of 5</span>
            <h4 className="text-emerald-300 font-bold">â‘¤ Token Budget â€” Why Prompt Size Matters</h4>
          </div>
          <p className="text-slate-300 text-sm mb-4">
            Every LLM has a context window â€” the maximum number of tokens it can process at once. The augmented prompt consumes part of that budget. The rest is available for the LLM&apos;s generated answer. Understanding this tradeoff is critical when scaling RAG to production.
          </p>

          <div className="bg-[#0f1117] p-4 rounded-xl border border-slate-700/50 mb-4">
            <div className="text-xs text-slate-400 mb-2">Total context window: 128,000 tokens (LLaMA 3.3 70B)</div>
            <div className="h-6 w-full bg-slate-800 rounded-full flex overflow-hidden mb-3">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(systemTokens / 128000) * 100}%`, minWidth: '4px' }}
                transition={{ duration: 1 }}
                className="h-full bg-[#6366f1]"
              />
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(contextTokens / 128000) * 100}%`, minWidth: '8px' }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-[#10b981]"
              />
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(remainingTokens / 128000) * 100}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="h-full bg-[#1e2235]"
              />
            </div>
            
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-indigo-300">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#6366f1]" />
                System ~{systemTokens} tokens
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
                Context ~{contextTokens} tokens
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#1e2235]" />
                ~{remainingTokens.toLocaleString()} tokens remaining for answer
              </div>
            </div>
          </div>

          <div className="border border-slate-700 rounded-xl overflow-hidden bg-[#0f1117] text-xs">
            <table className="w-full text-left border-collapse">
              <tbody>
                <tr className="border-b border-slate-700/50 hover:bg-white/5 transition-colors">
                  <td className="p-3 text-emerald-300 font-mono w-1/3">More chunks (â†‘K)</td>
                  <td className="p-3 text-slate-400">More context â†’ better answers BUT more tokens â†’ higher cost + slower</td>
                </tr>
                <tr className="border-b border-slate-700/50 bg-white/[0.02] hover:bg-white/5 transition-colors">
                  <td className="p-3 text-emerald-300 font-mono">Fewer chunks (â†“K)</td>
                  <td className="p-3 text-slate-400">Less context â†’ faster + cheaper BUT risks missing key information</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-3 text-emerald-300 font-mono">This pipeline</td>
                  <td className="p-3 text-slate-400">K=2, ~{totalTokens} prompt tokens â€” balanced for teaching demo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* RECAP */}
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mt-4 pt-6 border-t border-[#1e2235] flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 flex-wrap text-[10px] sm:text-xs">
            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full font-mono border border-emerald-500/20">System Role</span>
            <span className="text-emerald-500/50">â†’</span>
            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full font-mono border border-emerald-500/20">Inject Context</span>
            <span className="text-emerald-500/50">â†’</span>
            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full font-mono border border-emerald-500/20">Append Question</span>
            <span className="text-emerald-500/50">â†’</span>
            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full font-mono border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)]">Send to LLM âœ“</span>
          </div>
          <p className="text-slate-500 text-[11px] text-center mt-4 max-w-lg">
            The augmented prompt is assembled entirely on the server in <code className="text-emerald-400/70 font-mono bg-[#0f1117] px-1 py-0.5 rounded">app/api/generate/route.ts</code> before the NVIDIA API call is made.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

