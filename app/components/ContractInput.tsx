"use client";

import { useCallback, useRef, useState } from "react";
import { FileIcon, SparklesIcon, UploadIcon } from "./icons";

const PLACEHOLDER = `Paste your contract, NDA, SaaS agreement, or policy text here…

Example: Include sections on liability, termination, indemnification, data processing, and governing law for the most useful analysis preview.`;

interface ContractInputProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  fileName: string | null;
  onFileNameChange: (name: string | null) => void;
  hasContent?: boolean;
}

export function ContractInput({
  value,
  onChange,
  onAnalyze,
  isAnalyzing,
  fileName,
  onFileNameChange,
  hasContent = false,
}: ContractInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const readFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        onChange(text);
        onFileNameChange(file.name);
        setUploadError(null);
      };
      reader.readAsText(file);
    },
    [onChange, onFileNameChange],
  );

  const extractPdf = useCallback(
    async (file: File) => {
      setUploadError(null);
      setIsExtracting(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        
        const res = await fetch("/api/extract-pdf", {
          method: "POST",
          body: formData,
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to extract PDF text");
        }
        
        const data = await res.json();
        if (data.text) {
          onChange(data.text);
          onFileNameChange(file.name);
        } else {
          throw new Error("No text could be extracted from this PDF.");
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Error reading PDF");
      } finally {
        setIsExtracting(false);
      }
    },
    [onChange, onFileNameChange]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      
      if (ext === ".pdf") {
        extractPdf(file);
      } else if ([".txt", ".md", ".text"].includes(ext)) {
        readFile(file);
      } else {
        setUploadError("Please upload a .txt, .md, or .pdf file for analysis.");
      }
    },
    [readFile, extractPdf],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <section
      className="card card-elevated rounded-xl p-6 sm:p-8"
      aria-labelledby="contract-input-heading"
    >
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id="contract-input-heading"
            className="text-lg font-semibold text-slate-900"
          >
            Contract input
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Upload a document or paste text for AI-powered review
          </p>
        </div>
        {wordCount > 0 && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            {wordCount.toLocaleString()} words
          </span>
        )}
      </header>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`mb-5 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-slate-200 bg-slate-50/80 hover:border-blue-300 hover:bg-blue-50/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.text,.pdf"
          className="sr-only"
          aria-describedby="upload-hint"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600"
          aria-hidden
        >
          <UploadIcon />
        </div>
        <p className="text-sm font-medium text-slate-800">
          {isExtracting ? "Extracting text from PDF..." : "Drag and drop your contract"}
        </p>
        <p id="upload-hint" className="mt-1 text-xs text-slate-500">
          Supports .txt, .md, and .pdf
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isExtracting}
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:opacity-50"
        >
          <FileIcon className="h-4 w-4" aria-hidden />
          Browse files
        </button>
        {fileName && (
          <p className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-emerald-700">
            <FileIcon className="h-3.5 w-3.5" aria-hidden />
            {fileName}
          </p>
        )}
        {uploadError && (
          <p className="mt-3 text-xs text-red-600" role="alert">
            {uploadError}
          </p>
        )}
      </div>

      <label htmlFor="contract-text" className="mb-2 block text-sm font-medium text-slate-700">
        Or paste contract text
      </label>
      <textarea
        id="contract-text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (!e.target.value) onFileNameChange(null);
        }}
        placeholder={PLACEHOLDER}
        rows={12}
        className="focus-ring min-h-[260px] w-full resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 font-mono text-sm leading-relaxed text-slate-800 placeholder:text-slate-400"
      />

      <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="btn-primary min-w-[180px]"
            aria-busy={isAnalyzing}
          >
            <SparklesIcon className="h-4 w-4 shrink-0" aria-hidden />
            {isAnalyzing ? "Analyzing…" : "Analyze contract"}
          </button>
          <button
            type="button"
            onClick={() => {
              onChange("");
              onFileNameChange(null);
              setUploadError(null);
            }}
            className="btn-secondary"
          >
            Clear
          </button>
        </div>
        <p className="text-xs text-slate-500 sm:ml-auto">
          {hasContent
            ? "Secured analysis via Gemini AI"
            : "Paste contract text to enable analysis"}
        </p>
      </div>
    </section>
  );
}