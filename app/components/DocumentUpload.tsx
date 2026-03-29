'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, X, AlertCircle } from 'lucide-react';


export interface UploadedFile {
  name: string;
  text: string;
  size: number;
}

interface DocumentUploadProps {
  onDocumentLoaded: (file: UploadedFile | null) => void;
  disabled?: boolean;
}

export function DocumentUpload({ onDocumentLoaded, disabled }: DocumentUploadProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedFile, setLoadedFile] = useState<{ name: string, size: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const handleClear = () => {
    setLoadedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onDocumentLoaded(null);
  };

  async function extractPdfText(file: File): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjsLib: any = await new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).pdfjsLib) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lib = (window as any).pdfjsLib;
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(lib);
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fullText += content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ') + '\n';
    }
    return fullText;
  }

  const handleFile = async (file: File) => {
    if (!file) return;

    setError(null);
    setIsProcessing(true);

    if (file.size > 2 * 1024 * 1024) {
      setError("File exceeds 2MB maximum size.");
      setIsProcessing(false);
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    
    try {
      let text = '';
      if (ext === 'txt' || ext === 'md') {
        text = await file.text();
      } else if (ext === 'pdf') {
        text = await extractPdfText(file);
      } else {
        throw new Error("Unsupported file format. Please use .txt, .md, or .pdf");
      }

      if (!text.trim()) {
        throw new Error("Document appears to be empty or unreadable.");
      }

      setLoadedFile({ name: file.name, size: file.size });
      onDocumentLoaded({ name: file.name, text, size: file.size });

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error processing file');
      handleClear();
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !loadedFile) setIsHovered(true);
  };

  const onDragLeave = () => {
    setIsHovered(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(false);
    if (disabled || loadedFile) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFile(file);
  };

  return (
    <div className="w-full mb-6">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".txt,.md,.pdf"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
        }}
      />
      
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 flex items-center justify-between mb-3 group transition-colors hover:bg-red-500/20">
          <div className="text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loadedFile ? (
        <motion.div 
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative border border-emerald-500/50 bg-[#1a1d2e] rounded-xl p-4 flex items-center justify-between shadow-lg"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-md" />
          <div className="flex flex-col ml-2">
            <div className="text-emerald-400 font-bold text-sm tracking-wide flex items-center gap-2">
              ✓ {loadedFile.name} loaded
            </div>
            <div className="text-slate-400 text-xs mt-1">
              {formatSize(loadedFile.size)} — ready to query
            </div>
          </div>
          <button 
            onClick={handleClear} disabled={disabled}
            className="text-slate-400 hover:text-slate-200 transition-colors bg-slate-800 p-1.5 rounded-full border border-slate-700 disabled:opacity-50"
            title="Remove File"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      ) : (
        <motion.div
          animate={{ scale: isHovered && !disabled ? 1.02 : 1 }}
          className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
            ${isHovered ? 'border-indigo-500 bg-indigo-500/10' : 'border-[#2a2d3e] bg-[#1a1d2e] hover:border-indigo-500/50'}
            ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
          `}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold animate-pulse">
              Processing Document...
            </div>
          ) : (
            <>
              <FileText className={`w-8 h-8 mb-3 ${isHovered ? 'text-indigo-400' : 'text-slate-500'}`} />
              <p className="text-slate-300 text-sm font-semibold mb-1">
                Drop your document here or click to upload
              </p>
              <p className="text-slate-500 text-xs font-medium">
                Supports .txt .pdf .md — max 2MB
              </p>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
