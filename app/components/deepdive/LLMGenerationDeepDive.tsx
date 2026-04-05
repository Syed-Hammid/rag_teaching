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

interface LLMGenerationDeepDiveProps {
  query: string
  augmentedPrompt: string
  retrievedChunks: ScoredChunk[]
  generatedAnswer: string
  mode: 'web' | 'document'
  onClose: () => void
}

export function LLMGenerationDeepDive({
  query,
  augmentedPrompt,
  retrievedChunks,
  generatedAnswer,
  mode,
  onClose
}: LLMGenerationDeepDiveProps) {
  const [copied, setCopied] = useState(false);
  const [temperature, setTemperature] = useState(0.5);

  const handleCopy = () => {
    // We mock the API request string here to show in the copy block
    const sysPromptSnippet = augmentedPrompt.substring(0, 80).replace(/\n/g, ' ');
    const chunkSnippet = retrievedChunks[0]?.text.substring(0, 60).replace(/\n/g, ' ');
    const apiCode = `POST https://integrate.api.nvidia.com/v1/chat/completions

{
  "model": "meta/llama-3.3-70b-instruct",
  "temperature": 0.5,
  "max_tokens": 512,
  "messages": [
    {
      "role": "system",
      "content": "${sysPromptSnippet}..."
    },
    {
      "role": "user",
      "content": "Context:\\n${chunkSnippet}...\\n\\nQuestion: ${query}"
    }
  ]
}`;
    navigator.clipboard.writeText(apiCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = generatedAnswer.split(/\s+/).filter(Boolean).length;
  const sentCount = generatedAnswer.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const tokCount = Math.round(generatedAnswer.length / 4);
  const sources = retrievedChunks.length;

  const tempOptions = [0.0, 0.2, 0.5, 0.8, 1.0];
  const tempConsequences: Record<number, { icon: string, desc: string }> = {
    0.0: { icon: 'ðŸŽ¯', desc: 'Deterministic â€” always picks the highest probability token. Responses are consistent but can feel repetitive. Best for: factual Q&A, code.' },
    0.2: { icon: 'ðŸ“', desc: 'Near-deterministic â€” very focused output with slight variation. Good for: precise answers, structured data extraction.' },
    0.5: { icon: 'âš–ï¸', desc: 'Balanced â€” mixes probability well. Answers feel natural and coherent without being unpredictable. This is what was used for your query.' },
    0.8: { icon: 'ðŸŽ¨', desc: 'Creative â€” more variation and surprise. Good for: brainstorming, storytelling, open-ended questions. Risk: may drift from context.' },
    1.0: { icon: 'ðŸŽ²', desc: 'Maximum randomness â€” highly varied output. Can produce unexpected but interesting results. Not recommended for RAG â€” risks ignoring context.' }
  };

  const fakeTokens = ["The", "Based", "According", "In", "Spider"];
  // Fake prob calculations for visuals based on temperature
  const baseProbs = [80, 10, 5, 3, 2];
  const adjustedProbs = baseProbs.map(p => {
    if (temperature === 0) return p;
    // Flatten as temp goes up. Rough visual approximation.
    const spread = (20 - p) * temperature;
    return Math.max(2, p + spread); 
  });
  const sum = adjustedProbs.reduce((a, b) => a + b, 0);
  const normalizedProbs = adjustedProbs.map(p => (p / sum) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -20, height: 0 }}
      className="bg-[#0a0c14] border-t-2 border-[#06b6d4] rounded-b-xl p-6 -mt-1 overflow-hidden"
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
        {/* Intro */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">ðŸ§ </span>
            <h3 className="text-cyan-300 font-bold text-lg">What does an LLM actually do? â€” The simple idea</h3>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            A Large Language Model is a next-word prediction machine at massive scale. Given the augmented prompt as input, it predicts the most likely next token, appends it, then predicts the next one â€” repeating this thousands of times until the answer is complete. The model does not &apos;understand&apos; your question the way a human does. It has learned statistical patterns across trillions of words of training text, and uses those patterns to produce output that is coherent, contextually aware, and â€” when RAG provides good context â€” factually grounded.
          </p>
        </motion.div>

        {/* SECTION 1 */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Step 1 of 6</span>
            <h4 className="text-cyan-300 font-bold">â‘  Two Types of Transformers â€” Encoder vs Decoder</h4>
          </div>
          <p className="text-slate-300 text-sm mb-4">
            The embedding step used an ENCODER transformer (nvidia/nv-embedqa-e5-v5). The generation step uses a DECODER transformer (LLaMA 3.3 70B). These are fundamentally different architectures with different jobs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            {/* Encoder Card */}
            <div className="bg-violet-500/5 border border-violet-500/40 p-4 rounded-xl flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span>ðŸ”¢</span>
                <span className="font-bold text-violet-300">Encoder</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-2 flex-grow">
                <li>â†’ Reads the entire input at once (bidirectional)</li>
                <li>â†’ Attends to ALL tokens simultaneously</li>
                <li>â†’ Produces one fixed vector per token</li>
                <li>â†’ Used for: understanding, embedding, classification</li>
                <li>â†’ Example: nvidia/nv-embedqa-e5-v5 (used earlier)</li>
              </ul>
              <div className="mt-4 inline-block bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2 py-1 rounded-full w-fit">
                Used in Step 3 â€” Query Embedding
              </div>
            </div>

            {/* Decoder Card */}
            <div className="bg-cyan-500/5 border border-cyan-500/40 p-4 rounded-xl flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span>ðŸ¤–</span>
                <span className="font-bold text-cyan-300">Decoder</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-2 flex-grow">
                <li>â†’ Reads input left-to-right (causal/autoregressive)</li>
                <li>â†’ Can only attend to PAST tokens, not future ones</li>
                <li>â†’ Generates one NEW token at a time</li>
                <li>â†’ Used for: text generation, chat, completion</li>
                <li>â†’ Example: meta/llama-3.3-70b-instruct (used here)</li>
              </ul>
              <div className="mt-4 inline-block bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-1 rounded-full w-fit">
                Used in Step 7 â€” LLM Generation
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/40 rounded p-3 text-xs text-slate-300">
            <span className="mr-1">ðŸ’¡</span> RAG pipelines always use BOTH: an encoder to embed and retrieve, then a decoder to generate the final answer. They are two separate models serving two separate roles.
          </div>
        </motion.div>

        {/* SECTION 2 */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Step 2 of 6</span>
            <h4 className="text-cyan-300 font-bold">â‘¡ How the Answer Was Built â€” Token by Token</h4>
          </div>
          <p className="text-slate-300 text-sm mb-4">
            The model generates one token at a time in a loop. Each new token is appended to the output, and the model re-reads everything â€” input + generated tokens so far â€” before predicting the next one. The answer you saw was produced by hundreds of these individual prediction steps, each taking milliseconds.
          </p>

          <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-4 mb-2 min-h-[100px]">
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.04 } }
              }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              className="flex flex-wrap gap-1.5"
            >
              {generatedAnswer.split(/\s+/).filter(Boolean).map((word, i) => (
                <motion.span 
                  key={i}
                  variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
                  className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs px-2 py-0.5 rounded font-mono inline-block"
                >
                  {word}
                </motion.span>
              ))}
              <motion.span 
                animate={{ opacity: [1, 0, 1] }} 
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block w-2 bg-cyan-400 h-5 ml-1 mt-0.5 align-middle"
              />
            </motion.div>
          </div>
          <div className="flex flex-col gap-1 text-slate-500 text-xs text-right mb-3">
            <span>Estimated tokens generated: ~{tokCount}</span>
            <span>Approximate generation steps: ~{tokCount} prediction iterations</span>
          </div>

          <div className="bg-[#0f1117] border border-cyan-500/20 rounded p-3 text-xs text-slate-400">
            Each prediction step: model reads full context â†’ computes probabilities over 128,000 vocabulary tokens â†’ samples one token â†’ appends it â†’ repeats
          </div>
        </motion.div>

        {/* SECTION 3 */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Step 3 of 6</span>
            <h4 className="text-cyan-300 font-bold">â‘¢ Temperature & Sampling â€” Controlling Randomness</h4>
          </div>
          <p className="text-slate-300 text-sm mb-4">
            The model does not pick the single most likely next token every time â€” that would produce repetitive, robotic output. Instead it samples from a probability distribution shaped by the temperature setting. This pipeline uses temperature=0.5.
          </p>

          <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-5 mb-4">
            {/* Interactive Scale */}
            <div className="relative h-1 bg-slate-700 w-full mb-8 rounded-full mt-4">
              {tempOptions.map((val) => (
                <button
                  key={val}
                  onClick={() => setTemperature(val)}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center group cursor-pointer outline-none"
                  style={{ left: `${val * 100}%` }}
                >
                  <div className={`w-4 h-4 rounded-full border-2 transition-all ${temperature === val ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'bg-[#0f1117] border-slate-500 group-hover:border-slate-400'}`} />
                  <span className={`mt-2 text-xs font-mono transition-colors ${temperature === val ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
                    {val.toFixed(1)}
                  </span>
                </button>
              ))}
            </div>

            {/* Consequence Card */}
            <div className="bg-[#141722] border border-slate-700/50 p-4 rounded-lg min-h-[90px] flex gap-3 text-sm text-slate-300">
              <span className="text-xl">{tempConsequences[temperature].icon}</span>
              <p>{tempConsequences[temperature].desc}</p>
            </div>
            
            {/* Prob Dist Mini Chart */}
            <div className="mt-6 border-t border-slate-800 pt-5">
              <div className="text-xs text-slate-400 mb-3 text-center">
                Temperature reshapes the probability distribution â€” lower = more peaked, higher = flatter
              </div>
              <div className="flex items-end justify-center gap-6 h-28 px-4">
                {fakeTokens.map((token, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 w-12">
                    <div className="text-[10px] text-cyan-400 font-mono">{normalizedProbs[i].toFixed(1)}%</div>
                    <div className="w-full bg-slate-800 rounded-t-sm relative h-20 flex items-end">
                      <motion.div 
                        className="w-full bg-cyan-500 rounded-t-sm"
                        animate={{ height: `${normalizedProbs[i]}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate w-full text-center">&quot;{token}&quot;</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* SECTION 4 */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Step 4 of 6</span>
            <h4 className="text-cyan-300 font-bold">â‘£ The Real API Call â€” What Was Sent to NVIDIA NIM</h4>
          </div>
          <p className="text-slate-300 text-sm mb-4">
            This is the exact request structure sent to the NVIDIA NIM endpoint via <code className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded text-xs font-mono">app/api/generate/route.ts</code>. The API is fully OpenAI-compatible â€” the same format works with GPT-4, Claude, Gemini, and others by just changing the base URL and model name.
          </p>

          <div className="relative mb-4">
            <button 
              onClick={handleCopy}
              className="absolute top-2 right-2 text-xs text-slate-500 hover:text-slate-300 bg-slate-800 px-2 py-1 rounded border border-slate-700 transition-colors z-10"
            >
              {copied ? 'âœ“ Copied!' : 'ðŸ“‹ Copy request'}
            </button>
            <div className="bg-[#0a0c14] border border-cyan-500/20 rounded-xl p-4 font-mono text-xs overflow-x-auto pt-10">
              <div className="text-slate-400 mb-4 font-bold">POST https://integrate.api.nvidia.com/v1/chat/completions</div>
              <pre className="text-slate-300">
<span className="text-slate-500">{"{"}</span>
  <span className="text-cyan-300">&quot;model&quot;</span>: <span className="text-emerald-300">&quot;meta/llama-3.3-70b-instruct&quot;</span>,
  <span className="text-cyan-300">&quot;temperature&quot;</span>: <span className="text-amber-300">0.5</span>,
  <span className="text-cyan-300">&quot;max_tokens&quot;</span>: <span className="text-amber-300">512</span>,
  <span className="text-cyan-300">&quot;messages&quot;</span>: <span className="text-slate-500">{"["}</span>
    <span className="text-slate-500">{"{"}</span>
      <span className="text-cyan-300">&quot;role&quot;</span>: <span className="text-emerald-300">&quot;system&quot;</span>,
      <span className="text-cyan-300">&quot;content&quot;</span>: <span className="text-emerald-300">&quot;{augmentedPrompt.substring(0, 80).replace(/\n/g, ' ')}...&quot;</span>
    <span className="text-slate-500">{"}"}</span>,
    <span className="text-slate-500">{"{"}</span>
      <span className="text-cyan-300">&quot;role&quot;</span>: <span className="text-emerald-300">&quot;user&quot;</span>,
      <span className="text-cyan-300">&quot;content&quot;</span>: <span className="text-emerald-300">&quot;Context:\n{retrievedChunks[0]?.text.substring(0, 60).replace(/\n/g, ' ')}...\n\nQuestion: {query}&quot;</span>
    <span className="text-slate-500">{"}"}</span>
  <span className="text-slate-500">{"]"}</span>
<span className="text-slate-500">{"}"}</span>
              </pre>
            </div>
          </div>

          <div className="grid grid-cols-3 bg-[#0f1117] border border-slate-800 rounded-lg text-xs overflow-hidden">
             <div className="p-3 border-r border-slate-800">
               <div className="text-slate-500 font-bold mb-1">Provider</div>
               <div className="text-slate-300">NVIDIA NIM<br/><span className="text-[10px] text-slate-500">OpenAI-compat</span></div>
             </div>
             <div className="p-3 border-r border-slate-800">
               <div className="text-slate-500 font-bold mb-1">Model</div>
               <div className="text-slate-300">LLaMA 3.3 70B<br/><span className="text-[10px] text-slate-500">70B params</span></div>
             </div>
             <div className="p-3">
               <div className="text-slate-500 font-bold mb-1">Parameters</div>
               <div className="text-slate-300">temp=0.5<br/><span className="text-[10px] text-slate-500">max_tok=512</span></div>
             </div>
          </div>
        </motion.div>

        {/* SECTION 5 */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Step 5 of 6</span>
            <h4 className="text-cyan-300 font-bold">â‘¤ Context vs Training â€” What the Model Actually Reads</h4>
          </div>
          <p className="text-slate-300 text-sm mb-4">
            LLMs have two sources of knowledge: their parametric memory (patterns baked in during training on trillions of tokens) and the in-context knowledge injected via the prompt. RAG deliberately uses both â€” the retrieved chunks provide specific, current facts; the model&apos;s training provides language understanding, reasoning, and synthesis ability.
          </p>

          <div className="flex flex-col items-center mb-6 mt-6">
             <div className="relative w-full max-w-[400px] h-[160px]">
                {/* Visual diagram with CSS/Framer replacing SVG for better rendering/styling ease inside React */}
                <div className="absolute top-[30px] left-0 right-0 flex justify-between items-center z-10 w-[380px] mx-auto">
                   <motion.div 
                     initial={{ x: -20, opacity: 0 }}
                     whileInView={{ x: 0, opacity: 1 }}
                     viewport={{ once: true }}
                     className="bg-violet-900/30 border border-violet-500/50 rounded-lg p-2 flex flex-col items-center w-32 border-r-4 border-r-violet-500"
                   >
                      <span className="text-xs font-bold text-violet-300 mb-1 text-center leading-tight">ðŸ“š Parametric Memory</span>
                      <span className="text-[9px] text-violet-400/70 text-center leading-tight">70B parameters trained on web text, books, code...</span>
                   </motion.div>

                   <motion.div 
                     initial={{ scale: 0.8, opacity: 0 }}
                     whileInView={{ scale: 1, opacity: 1 }}
                     viewport={{ once: true }}
                     transition={{ delay: 0.2 }}
                     className="bg-[#0a0c14] border border-cyan-500 relative shadow-[0_0_15px_rgba(6,182,212,0.3)] rounded p-2 flex flex-col items-center w-28 mx-2 z-20"
                   >
                      <span className="text-2xl mb-1 mt-1">ðŸ¤–</span>
                      <span className="text-[10px] font-bold text-cyan-300 text-center leading-tight">LLaMA 3.3 70B</span>
                      <span className="text-[8px] text-cyan-500 mt-1 text-center">Synthesizes both sources</span>
                   </motion.div>

                   <motion.div 
                     initial={{ x: 20, opacity: 0 }}
                     whileInView={{ x: 0, opacity: 1 }}
                     viewport={{ once: true }}
                     transition={{ delay: 0.4 }}
                     className="bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-2 flex flex-col items-center w-32 border-l-4 border-l-emerald-500"
                   >
                      <span className="text-xs font-bold text-emerald-300 mb-1 text-center leading-tight">ðŸ“„ In-Context Knowledge</span>
                      <span className="text-[9px] text-emerald-400/70 text-center leading-tight">Retrieved chunks injected via the augmented prompt</span>
                   </motion.div>
                </div>
                
                {/* Arrow out */}
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  whileInView={{ height: 30, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="absolute top-[110px] left-1/2 w-0.5 bg-cyan-400"
                />
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                  className="absolute top-[140px] left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-cyan-900/30 border border-cyan-500/40 text-cyan-300 text-[10px] uppercase font-bold py-1 px-3 rounded-full"
                >
                  âœ… Grounded Answer
                </motion.div>
             </div>
          </div>

          <div className="flex flex-col gap-3">
             <div className="bg-[#0f1117] p-3 rounded-xl border-l-4 border-cyan-500 text-sm text-slate-300">
               <span className="font-bold text-cyan-400 block mb-1">What the model KNOWS from training:</span>
               Language patterns, reasoning, world knowledge, how to write coherent paragraphs â€” but possibly outdated or hallucinated specific facts.
             </div>
             <div className="bg-[#0f1117] p-3 rounded-xl border-l-4 border-emerald-500 text-sm text-slate-300">
               <span className="font-bold text-emerald-400 block mb-1">What RAG INJECTS via context:</span>
               Specific, sourced, current facts from <strong className="text-emerald-300 font-mono text-xs font-semibold px-1 bg-emerald-500/10 rounded">{mode === 'web' ? retrievedChunks[0]?.source : `Chunk #${retrievedChunks[0]?.chunkIndex}`}</strong> {retrievedChunks.length > 1 && <>and <strong className="text-emerald-300 font-mono text-xs font-semibold px-1 bg-emerald-500/10 rounded">{mode === 'web' ? retrievedChunks[1]?.source : `Chunk #${retrievedChunks[1]?.chunkIndex}`}</strong></>} â€” verified by retrieval, not recalled from training.
             </div>
          </div>
        </motion.div>

        {/* SECTION 6 */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Step 6 of 6</span>
            <h4 className="text-cyan-300 font-bold">â‘¥ The Generated Answer â€” Fully Revealed</h4>
          </div>
          <p className="text-slate-300 text-sm mb-4">
            Below is the complete answer generated by LLaMA 3.3 70B for your query. Every factual claim in this answer traces back to the retrieved context chunks. Compare the answer to the source chunks â€” you will see the model synthesized and expanded them rather than copying them verbatim.
          </p>

          <div className="bg-[#0f1117] border border-cyan-500/20 rounded-xl p-4 text-sm leading-relaxed text-slate-200 shadow-inner max-h-[300px] overflow-y-auto custom-scrollbar mb-4">
            {generatedAnswer}
          </div>

          <div className="grid grid-cols-4 bg-[#0f1117] border border-slate-800 rounded-lg text-center overflow-hidden mb-6">
             <div className="p-3 border-r border-slate-800">
               <div className="text-xs text-slate-500 mb-1 font-bold">Words</div>
               <div className="text-cyan-400 font-mono font-bold text-sm">{wordCount}</div>
             </div>
             <div className="p-3 border-r border-slate-800">
               <div className="text-xs text-slate-500 mb-1 font-bold">Sentences</div>
               <div className="text-slate-300 font-mono font-bold text-sm">{sentCount}</div>
             </div>
             <div className="p-3 border-r border-slate-800 flex flex-col items-center">
               <div className="text-[10px] text-slate-500 mb-1 font-bold leading-tight">Est. tokens</div>
               <div className="text-amber-400 font-mono font-bold text-sm">~{tokCount}</div>
             </div>
             <div className="p-3 flex flex-col items-center">
               <div className="text-[10px] text-slate-500 mb-1 font-bold leading-tight">Sources</div>
               <div className="text-emerald-400 font-mono font-bold text-sm">{sources}</div>
             </div>
          </div>

          <div className="flex flex-col gap-3">
             <div className="text-xs text-slate-400 font-bold ml-1 uppercase tracking-wider">Source Traceability</div>
             {retrievedChunks.map((chunk, i) => (
                <div key={i} className="border-l-4 border-cyan-500 bg-[#0a0c14] rounded-lg p-3 text-xs border border-r-slate-800 border-y-slate-800">
                   <div className="flex justify-between items-center mb-1">
                     <span className="font-bold text-slate-300">ðŸ“„ Source used: <span className="text-emerald-400">{mode === 'web' ? chunk.source : `Chunk #${chunk.chunkIndex}`}</span></span>
                     <span className="text-slate-500 font-mono">Similarity: {chunk.score.toFixed(3)}</span>
                   </div>
                   <div className="text-slate-400 italic mb-2 line-clamp-2 pr-4 text-[11px]">
                     &quot;{chunk.text}&quot;
                   </div>
                   <div className="text-cyan-500 text-[10px] font-bold">
                     â†‘ The LLM used facts from this chunk above
                   </div>
                </div>
             ))}
          </div>
        </motion.div>

        {/* RECAP */}
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mt-4 pt-6 border-t border-[#1e2235] flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 flex-wrap text-[10px] sm:text-xs">
            <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-full font-mono border border-cyan-500/20">Augmented Prompt</span>
            <span className="text-cyan-500/50">â†’</span>
            <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-full font-mono border border-cyan-500/20">Tokenize Input</span>
            <span className="text-cyan-500/50">â†’</span>
            <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-full font-mono border border-cyan-500/20">Decoder Layers</span>
            <span className="text-cyan-500/50">â†’</span>
            <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-full font-mono border border-cyan-500/20">Sample Token</span>
            <span className="text-cyan-500/50">â†’</span>
            <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-full font-mono border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.2)] text-center max-w-[120px]">Repeat Ã— N</span>
            <span className="text-cyan-500/50">â†’</span>
            <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-full font-mono border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.3)]">Final Answer âœ“</span>
          </div>
          <p className="text-slate-500 text-[11px] text-center mt-4 max-w-lg">
            meta/llama-3.3-70b-instruct ran ~{tokCount} generation steps to produce this answer.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

