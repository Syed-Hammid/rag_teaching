'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Globe, Binary, Database, Layers, FileText, Bot, CheckCircle, ExternalLink, FileUp } from 'lucide-react';
import { PipelineNode, StepStatus } from './components/PipelineNode';
import { ConnectorArrow } from './components/ConnectorArrow';
import { StepCounter } from './components/StepCounter';
import type { UploadedFile } from './components/DocumentUpload';
import dynamic from 'next/dynamic';
import { QueryEmbeddingDeepDive } from './components/deepdive/QueryEmbeddingDeepDive';

const DocumentUpload = dynamic(() => import('./components/DocumentUpload').then(mod => mod.DocumentUpload), { ssr: false });
import { cosineSimilarity } from '../lib/similarity';

interface ChunkObject {
  id: string;
  source: string;
  text: string;
  url?: string;
  chunkIndex?: number;
  totalChunks?: number;
}

interface ScoredChunk extends ChunkObject {
  score: number;
}

interface RAGState {
  mode: 'web' | 'document';
  uploadedFile: UploadedFile | null;
  currentStep: number;
  stepStatuses: StepStatus[];
  query: string;
  chunks: ChunkObject[];
  queryVector: number[];
  searchResults: ScoredChunk[];
  retrievedChunks: ScoredChunk[];
  augmentedPrompt: string;
  generatedAnswer: string;
  isLoading: boolean;
  error: string | null;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function Home() {
  const initialState: RAGState = {
    mode: 'web',
    uploadedFile: null,
    currentStep: -1,
    stepStatuses: Array(8).fill('idle'),
    query: '',
    chunks: [],
    queryVector: [],
    searchResults: [],
    retrievedChunks: [],
    augmentedPrompt: '',
    generatedAnswer: '',
    isLoading: false,
    error: null,
  };

  const [state, setState] = useState<RAGState>(initialState);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Typewriter effect state
  const [displayedAnswer, setDisplayedAnswer] = useState('');
  const [isEmbeddingOpen, setIsEmbeddingOpen] = useState(false);

  useEffect(() => {
    if (state.currentStep >= 0 && scrollRef.current) {
      const activeElement = scrollRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [state.currentStep]);

  const updateNodeState = (stepIndex: number, status: StepStatus) => {
    setState(prev => ({
      ...prev,
      currentStep: stepIndex,
      stepStatuses: prev.stepStatuses.map((s, i) => {
        if (i === stepIndex) return status;
        if (i < stepIndex) return 'complete';
        return 'idle';
      })
    }));
  };

  const STAGES = [
    'User Query Received',
    state.mode === 'web' ? 'Document Fetching' : 'Document Processing',
    'Query Embedding',
    'Cosine Similarity Scoring',
    'Top-K Retrieval',
    'Prompt Augmentation',
    'LLM Generation',
    'Final Answer'
  ];

  const runRAGPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.query.trim()) return;

    if (state.mode === 'document' && !state.uploadedFile) {
      setState(prev => ({ ...prev, error: "Please upload a document first to use Document Mode." }));
      return;
    }

    setState(prev => ({ ...prev, error: null, currentStep: -1, stepStatuses: Array(8).fill('idle'), chunks: [], queryVector: [], searchResults: [], retrievedChunks: [], augmentedPrompt: '', generatedAnswer: '', isLoading: true }));
    setDisplayedAnswer('');

    try {
      // STEP 1 — User Query
      updateNodeState(0, 'active');
      await sleep(600);
      updateNodeState(0, 'complete');

      // STEP 2 — Document Fetching / Processing Branching
      updateNodeState(1, 'active');
      let currentChunks: ChunkObject[] = [];

      if (state.mode === 'web') {
        const fetchDocsRes = await fetch('/api/fetch-docs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: state.query })
        });
        
        if (!fetchDocsRes.ok) throw new Error("Failed to fetch documents from Wikipedia API.");
        const { chunks } = await fetchDocsRes.json();
        if (!chunks || chunks.length === 0) throw new Error("No documents found for this query on Wikipedia.");
        
        currentChunks = chunks;
      } else {
        const fetchDocsRes = await fetch('/api/chunk-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
             text: state.uploadedFile!.text, 
             filename: state.uploadedFile!.name 
          })
        });

        if (!fetchDocsRes.ok) {
           const errMsg = await fetchDocsRes.json().catch(() => ({}));
           throw new Error(errMsg.error || "Failed to chunk custom document.");
        }
        const { chunks } = await fetchDocsRes.json();
        if (!chunks || chunks.length === 0) throw new Error("Failed to extract meaningful text chunks from document.");
        
        currentChunks = chunks;
      }

      setState(prev => ({ ...prev, chunks: currentChunks }));
      updateNodeState(1, 'complete');

      // STEP 3 — Query Embedding via NVIDIA
      updateNodeState(2, 'active');
      const embedRes = await fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: state.query, chunks: currentChunks.map(c => c.text) })
      });
      
      const embedData = await embedRes.json();
      if (!embedRes.ok) throw new Error(embedData.error || "Failed to fetch NVIDIA embeddings");
      setState(prev => ({ ...prev, queryVector: embedData.queryVector }));
      updateNodeState(2, 'complete');

      // STEP 4 — Cosine Similarity Scoring
      updateNodeState(3, 'active');
      const { chunkVectors } = embedData;
      const scored: ScoredChunk[] = currentChunks.map((chunk: ChunkObject, i: number) => ({
        ...chunk,
        score: cosineSimilarity(embedData.queryVector, chunkVectors[i])
      })).sort((a: ScoredChunk, b: ScoredChunk) => b.score - a.score);
      
      setState(prev => ({ ...prev, searchResults: scored }));
      await sleep(1500);
      updateNodeState(3, 'complete');

      // STEP 5 — Top-K Retrieval
      updateNodeState(4, 'active');
      const topChunks = scored.slice(0, 2);
      setState(prev => ({ ...prev, retrievedChunks: topChunks }));
      await sleep(1200);
      updateNodeState(4, 'complete');

      // STEP 6 — Prompt Augmentation
      updateNodeState(5, 'active');
      
      const sysPromptString = state.mode === 'web' 
        ? "System: You are a knowledgeable assistant. Answer the user's question clearly and comprehensively using the provided context. The context comes from Wikipedia articles. Synthesize the information naturally — do not just repeat the context, explain it well. If the context partially answers the question, use what is available and note any gaps."
        : "System: You are a precise document assistant. Answer the user's question using ONLY the provided document context. Be specific, accurate, and reference relevant details from the document. If the document does not contain enough information to answer fully, state clearly what is and isn't covered.";

      const augmentedPrompt = `${sysPromptString}\n\nContext:\n${topChunks[0].text}\n\n${topChunks[1]?.text || ''}\n\nQuestion: ${state.query}`;
      setState(prev => ({ ...prev, augmentedPrompt }));
      await sleep(1500);
      updateNodeState(5, 'complete');

      // STEP 7 — LLM Generation (Real NVIDIA API Call)
      updateNodeState(6, 'active');
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: state.query, chunks: topChunks.map((c: ScoredChunk) => c.text) })
      });

      if (!genRes.ok) {
        const errData = await genRes.json().catch(() => ({}));
        throw new Error(errData.error || `NVIDIA Generation failed: ${genRes.status}`);
      }
      const { answer } = await genRes.json();
      setState(prev => ({ ...prev, generatedAnswer: answer }));
      updateNodeState(6, 'complete');

      // STEP 8 — Final Answer Reveal
      updateNodeState(7, 'active');
      await revealAnswerTypewriter(answer);
      updateNodeState(7, 'complete');
      setState(prev => ({ ...prev, isLoading: false }));

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(err);
      setState(prev => ({ ...prev, error: errorMsg, isLoading: false }));
      const activeIdx = state.stepStatuses.findIndex(s => s === 'active');
      if (activeIdx !== -1) {
        updateNodeState(activeIdx, 'error');
      } else {
        updateNodeState(1, 'error'); 
      }
    }
  };

  const revealAnswerTypewriter = async (text: string) => {
    setDisplayedAnswer('');
    for (let i = 0; i <= text.length; i++) {
      setDisplayedAnswer(text.slice(0, i));
      await sleep(10);
    }
  };

  const resetPipeline = () => {
    setIsEmbeddingOpen(false);
    setState(prev => ({ 
      ...initialState, 
      query: prev.query, 
      mode: prev.mode, 
      uploadedFile: prev.uploadedFile 
    }));
    setDisplayedAnswer('');
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-[#0a0c14] text-slate-200 overflow-hidden font-sans">
      
      {/* LEFT PANEL */}
      <aside className="w-full md:w-[400px] lg:w-[450px] border-r border-[#1e2235] bg-[#0f1117] flex flex-col h-[50vh] md:h-screen shrink-0 relative z-20 shadow-2xl overflow-y-auto">
        <div className="p-6 flex flex-col flex-grow">
          <header className="mb-6">
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-tight">RAG Live Demo</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Powered by NVIDIA LLaMA 3.3 70B</p>
          </header>

          {/* Mode Switcher */}
          <div className="flex bg-[#1a1d2e] rounded-xl p-1 mb-6 border border-slate-700/50 relative isolate">
            {['web', 'document'].map((m) => {
               const isActive = state.mode === m;
               return (
                 <button
                   key={m}
                   type="button"
                   onClick={() => !state.isLoading && setState(prev => ({ ...initialState, mode: m as 'web'|'document', query: prev.query, uploadedFile: prev.uploadedFile }))}
                   className={`flex-1 relative font-bold text-xs py-2.5 z-10 uppercase tracking-widest transition-colors ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'} ${state.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                   {isActive && (
                     <motion.div
                       layoutId="mode-indicator"
                       className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg -z-10 shadow-lg shadow-indigo-500/25"
                     />
                   )}
                   {m === 'web' ? '🌐 Web Search' : '📄 Document'}
                 </button>
               )
            })}
          </div>

          {/* Conditional Document Upload */}
          <AnimatePresence mode="popLayout">
            {state.mode === 'document' && (
              <motion.div
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
              >
                <DocumentUpload 
                  disabled={state.isLoading}
                  onDocumentLoaded={(file) => setState(prev => ({ ...prev, uploadedFile: file }))} 
                />
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={runRAGPipeline} className="mb-6">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
               {state.mode === 'web' ? 'Ask a general question (Wikipedia Data)' : 'Ask a question about your document'}
            </label>
            <textarea
              className="w-full min-h-[100px] bg-[#1a1d2e] border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none placeholder-slate-600 mb-3"
              placeholder={state.mode === 'web' ? "e.g. What is photosynthesis?" : "e.g. What is the leave policy?"}
              value={state.query}
              onChange={(e) => setState(prev => ({ ...prev, query: e.target.value }))}
              disabled={state.isLoading}
            />
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: state.isLoading ? 1 : 1.02 }}
                whileTap={{ scale: state.isLoading ? 1 : 0.98 }}
                disabled={state.isLoading || !state.query.trim()}
                type="submit"
                className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
              >
                {state.isLoading ? 'Running Pipeline...' : 'Run RAG ▶'}
              </motion.button>
              <button
                type="button"
                onClick={resetPipeline}
                disabled={state.isLoading && state.currentStep < 7} 
                className="bg-transparent hover:bg-slate-800 text-slate-400 font-semibold py-2.5 px-4 rounded-xl border border-slate-700 transition-colors"
              >
                Reset ↺
              </button>
            </div>
          </form>

          {/* output section */}
          <div className="flex-grow flex flex-col pt-4 border-t border-slate-800">
            <h2 className="text-sm font-bold text-slate-300 mb-1">Generated Answer</h2>
            {state.error ? (
               <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
                 <p className="font-semibold mb-1">Pipeline Error</p>
                 <p>{state.error}</p>
               </div>
            ) : (
              <div className="flex-grow bg-[#1a1d2e] border border-[#2a2d3e] rounded-xl p-4 text-sm text-slate-300 leading-relaxed overflow-y-auto">
                {displayedAnswer.length > 0 ? (
                  <>
                    <span>{displayedAnswer}</span>
                    {state.stepStatuses[7] !== 'complete' && <span className="typewriter-cursor" />}
                  </>
                ) : (
                   <span className="text-slate-600 italic">The response will appear here once the LLM finishes generating...</span>
                )}
              </div>
            )}

            {/* Sources Cards Rendering */}
            {state.stepStatuses[7] === 'complete' && state.retrievedChunks.length > 0 && !state.error && (
              <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="mt-3 flex flex-col gap-2"
              >
                 <div className="text-xs text-emerald-400 flex items-center gap-1 w-full mb-1">
                   <CheckCircle className="w-3.5 h-3.5" /> Grounded in {state.retrievedChunks.length} native sources
                 </div>
                 {state.retrievedChunks.map((chunk, i) => (
                    <div key={i} className="bg-[#1a1d2e] border border-slate-700 rounded-lg p-3 relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-xs font-semibold text-slate-200">
                          {state.mode === 'web' 
                             ? `📄 Source: ${chunk.source}` 
                             : `📄 Source: ${chunk.source} — Chunk #${chunk.chunkIndex}`}
                        </span>
                        <span className="text-[10px] font-mono text-pink-400">Sim: {chunk.score.toFixed(3)}</span>
                      </div>
                      <p className="text-xs text-slate-400 italic line-clamp-2">&quot;{chunk.text}&quot;</p>
                      
                      {state.mode === 'web' && chunk.url && (
                        <a href={chunk.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-2 font-medium">
                          🔗 View on Wikipedia <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                 ))}
              </motion.div>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT PANEL: Pipeline Canvas */}
      <section className="flex-1 bg-dot-grid overflow-y-auto relative h-[50vh] md:h-screen p-6 md:p-12 scroll-smooth" ref={scrollRef}>
        <div className="max-w-2xl mx-auto pb-32">
          
          <StepCounter 
            currentStep={Math.max(0, state.currentStep)} 
            totalSteps={8} 
            stageName={state.currentStep >= 0 ? STAGES[state.currentStep] : 'Ready'} 
          />

          <div className="flex flex-col relative w-full mt-6">
            
            {/* 1. User Query */}
            <div data-active={state.currentStep === 0}>
              <PipelineNode
                id="query"
                stepNumber={1}
                icon={<MessageSquare className="w-6 h-6" />}
                title="User Query Received"
                subtitle="Capturing exactly what the user wants to know"
                accentColor="#3b82f6" // blue
                status={state.stepStatuses[0]}
                content={
                  <div className="bg-[#0f1117] p-3 rounded-md text-sm text-slate-300 font-mono italic">
                    &quot;{state.query}&quot;
                  </div>
                }
              />
            </div>
            
            <ConnectorArrow isActive={state.stepStatuses[0] === 'complete' && state.stepStatuses[1] === 'active'} accentColor="#3b82f6" />
            
            {/* 2. Document Processing / Fetching natively branching via mode */}
            <div data-active={state.currentStep === 1}>
              <PipelineNode
                id="search"
                stepNumber={2}
                icon={state.mode === 'web' ? <Globe className="w-6 h-6" /> : <FileUp className="w-6 h-6" />}
                title={state.mode === 'web' ? 'Document Fetching' : '📄 Document Processing'}
                subtitle={state.mode === 'web' ? 'Searching Wikipedia for relevant articles in real time' : 'Chunking uploaded document into retrievable segments'}
                accentColor={state.mode === 'web' ? "#ec4899" : "#f97316"}
                status={state.stepStatuses[1]}
                content={
                  <div className="bg-[#0f1117] p-3 rounded-md text-xs text-slate-300">
                    {state.mode === 'web' ? (
                      <>
                        <p className="text-pink-400 font-semibold mb-2">Articles found & chunked: {state.chunks.length} chunks generated.</p>
                        <div className="flex flex-wrap gap-2 text-slate-400">
                          {Array.from(new Set(state.chunks.map(c => c.source))).map((title: string, i) => (
                            <span key={i} className="bg-slate-800 px-2 py-1 rounded">📚 {title}</span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                           <FileText className="w-4 h-4 text-orange-400"/>
                           <span className="font-semibold text-orange-400">{state.uploadedFile?.name}</span>
                        </div>
                        <p className="mb-1">Total characters: {state.uploadedFile?.text.length}</p>
                        <p className="mb-2">Chunks generated: {state.chunks.length}</p>
                        <div className="flex flex-col gap-2 mt-3">
                           {state.chunks.slice(0, 3).map((c, i) => (
                             <motion.div 
                               key={i} 
                               initial={{ opacity: 0 }}
                               animate={{ opacity: 1 }}
                               transition={{ delay: i * 0.15 }}
                               className="bg-slate-800 p-2 rounded border border-slate-700/50"
                             >
                                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 drop-shadow-sm">Chunk {c.chunkIndex} of {state.chunks.length}</div>
                                <div className="text-slate-400 line-clamp-1 italic text-[11px]">&quot;{c.text}&quot;</div>
                             </motion.div>
                           ))}
                           {state.chunks.length > 3 && (
                             <div className="text-slate-500 italic text-[10px] text-center pt-1">+ {state.chunks.length - 3} more chunks</div>
                           )}
                        </div>
                      </>
                    )}
                  </div>
                }
              />
            </div>

            <ConnectorArrow isActive={state.stepStatuses[1] === 'complete' && state.stepStatuses[2] === 'active'} accentColor={state.mode === 'web' ? "#ec4899" : "#f97316"} />

            {/* 3. Query Embedding */}
            <div data-active={state.currentStep === 2}>
              <PipelineNode
                id="embedding"
                stepNumber={3}
                icon={<Binary className="w-6 h-6" />}
                title="Query Embedding"
                subtitle={`Embedding query and ${state.chunks.length} document chunks`}
                accentColor="#8b5cf6" // violet
                status={state.stepStatuses[2]}
                content={
                  <div className="bg-[#0f1117] p-3 rounded-md text-xs font-mono text-slate-400 break-words">
                     <p className="text-indigo-400 mb-1.5 font-sans font-semibold text-xs flex justify-between">
                       <span>Model: nvidia/nv-embedqa-e5-v5 (Real)</span>
                       <span>Dimensions: 1024</span>
                     </p>
                     [{state.queryVector.slice(0, 8).map(v => v.toFixed(4)).join(', ')}{state.queryVector.length > 0 ? ', ...' : ''}]
                     
                     {state.stepStatuses[2] === 'complete' && (
                       <motion.button
                         type="button"
                         onClick={() => setIsEmbeddingOpen(prev => !prev)}
                         animate={{ opacity: [0.5, 1, 0.5] }}
                         transition={{ duration: 2, repeat: Infinity }}
                         className="mt-3 text-xs text-indigo-400 font-semibold flex items-center gap-1 hover:text-indigo-300 transition-colors cursor-pointer w-full justify-center pt-2 border-t border-slate-700/50"
                       >
                         {isEmbeddingOpen 
                           ? '▲ Collapse deep dive' 
                           : '🔍 Click to explore how this embedding was built →'}
                       </motion.button>
                     )}
                  </div>
                }
              />
              <AnimatePresence>
                {state.stepStatuses[2] === 'complete' && isEmbeddingOpen && (
                  <QueryEmbeddingDeepDive
                    query={state.query}
                    queryVector={state.queryVector}
                    model="nvidia/nv-embedqa-e5-v5"
                    dimensions={1024}
                    onClose={() => setIsEmbeddingOpen(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            <ConnectorArrow isActive={state.stepStatuses[2] === 'complete' && state.stepStatuses[3] === 'active'} accentColor="#8b5cf6" />
            
            {/* 4. Cosine Similarity */}
            <div data-active={state.currentStep === 3}>
              <PipelineNode
                id="scoring"
                stepNumber={4}
                icon={<Database className="w-6 h-6" />}
                title="Cosine Similarity Scoring"
                subtitle="Computing real cosine similarity across all chunks"
                accentColor="#ec4899" // pink
                status={state.stepStatuses[3]}
                content={
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {state.searchResults.map((result, idx) => (
                      <div key={result.id} className="bg-[#0f1117] p-2 rounded flex items-center relative overflow-hidden group">
                        <motion.div
                           className="absolute left-0 top-0 bottom-0 bg-pink-500/10 border-r border-pink-500/30 z-0"
                           initial={{ width: 0 }}
                           animate={{ width: `${Math.max(0, result.score) * 100}%` }}
                           transition={{ duration: 1, delay: 0.05 * idx }}
                        />
                        <div className="z-10 flex justify-between w-full items-center text-xs text-slate-300 px-1">
                          <span className="truncate w-10/12"><span className="text-slate-500 font-bold">{state.mode === 'web' ? result.source : `Chunk #${result.chunkIndex}`}</span> — {result.text.substring(0, 45)}...</span>
                          <span className="text-pink-400 font-mono ml-4">{(result.score * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              />
            </div>

            <ConnectorArrow isActive={state.stepStatuses[3] === 'complete' && state.stepStatuses[4] === 'active'} accentColor="#ec4899" />
            
            {/* 5. Retrieval */}
            <div data-active={state.currentStep === 4}>
              <PipelineNode
                id="retrieval"
                stepNumber={5}
                icon={<Layers className="w-6 h-6" />}
                title="Top-K Retrieval"
                subtitle="Top 2 chunks selected by highest similarity"
                accentColor="#f59e0b" // amber
                status={state.stepStatuses[4]}
                content={
                  <div className="flex flex-col gap-2">
                    {state.retrievedChunks.map((chunk, idx) => (
                      <motion.div
                        key={idx}
                        className="bg-[#0f1117] p-3 rounded-md border border-amber-500/20 text-xs text-slate-300 relative"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 * idx }}
                      >
                         <span className="absolute -top-2 -right-2 bg-amber-500 text-black font-bold text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Rank #{idx + 1}</span>
                         <span className="text-amber-500 font-bold block mb-1">
                           {state.mode === 'web' ? chunk.source : `Chunk #${chunk.chunkIndex}`} (Sim: {chunk.score.toFixed(3)})
                         </span>
                         {chunk.text}
                      </motion.div>
                    ))}
                  </div>
                }
              />
            </div>

            <ConnectorArrow isActive={state.stepStatuses[4] === 'complete' && state.stepStatuses[5] === 'active'} accentColor="#f59e0b" />
            
            {/* 6. Prompt Augmentation */}
            <div data-active={state.currentStep === 5}>
              <PipelineNode
                id="augmentation"
                stepNumber={6}
                icon={<FileText className="w-6 h-6" />}
                title="Prompt Augmentation"
                subtitle="Injecting retrieved context into LLM prompt"
                accentColor="#10b981" // emerald
                status={state.stepStatuses[5]}
                content={
                  <div className="bg-[#0f1117] p-4 rounded-md text-xs font-mono text-emerald-400/90 flex flex-col gap-1.5">
                    {state.augmentedPrompt.split('\n').filter(Boolean).map((line, i) => (
                      <motion.p
                         key={i}
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         transition={{ duration: 0.05, delay: i * 0.05 }}
                         className={line.startsWith('System') ? 'text-slate-400' : 'text-emerald-400 font-semibold'}
                      >
                        {line}
                      </motion.p>
                    ))}
                  </div>
                }
              />
            </div>

            <ConnectorArrow isActive={state.stepStatuses[5] === 'complete' && state.stepStatuses[6] === 'active'} accentColor="#10b981" />
            
            {/* 7. generation */}
            <div data-active={state.currentStep === 6}>
              <PipelineNode
                id="llm"
                stepNumber={7}
                icon={<Bot className="w-6 h-6" />}
                title="LLM Generation"
                subtitle="Calling meta/llama-3.3-70b-instruct via NVIDIA NIM"
                accentColor="#06b6d4" // cyan
                status={state.stepStatuses[6]}
                content={
                  <div className="flex items-center gap-3 text-sm text-cyan-400 p-2 font-medium">
                    Streaming completion inference...
                    <div className="flex gap-1.5 ml-2">
                       {[0, 1, 2].map(dot => (
                         <motion.div
                           key={dot}
                           className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                           animate={{ y: [0, -5, 0] }}
                           transition={{ duration: 0.6, repeat: Infinity, delay: dot * 0.15 }}
                         />
                       ))}
                    </div>
                  </div>
                }
              />
            </div>

            <ConnectorArrow isActive={state.stepStatuses[6] === 'complete' && state.stepStatuses[7] === 'active'} accentColor="#06b6d4" />
            
            {/* 8. Final Response */}
            <div data-active={state.currentStep === 7}>
              <PipelineNode
                id="final"
                stepNumber={8}
                icon={<CheckCircle className="w-6 h-6" />}
                title="Final Answer"
                subtitle="Grounded answer from real retrieved context"
                accentColor="#8b5cf6" // violet
                status={state.stepStatuses[7]}
                content={
                  <div className="bg-[#0f1117] p-4 rounded-md text-sm text-slate-200">
                     {displayedAnswer.length > 0 ? (
                        <>
                          <span>{displayedAnswer}</span>
                          {state.stepStatuses[7] !== 'complete' && <span className="typewriter-cursor" />}
                        </>
                      ) : (
                         <span className="text-slate-600 italic">Waiting for response...</span>
                      )}
                  </div>
                }
              />
            </div>
            
          </div>
          
          <div className="mt-16 text-center border-t border-slate-800 pt-6 flex justify-center pb-20">
            <p className="text-sm font-semibold text-slate-400 bg-slate-800/50 inline-block px-4 py-2 rounded-full border border-slate-700/50 shadow shadow-indigo-500/10">
               <span className="text-white">RAG Live</span> — {state.mode === 'web' ? 'Wikipedia Web Search Enabled' : 'Custom Document Sandbox'}
            </p>
          </div>
          
        </div>
      </section>

    </main>
  );
}
