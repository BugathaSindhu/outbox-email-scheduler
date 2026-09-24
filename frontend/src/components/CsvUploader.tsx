import React, { useState, useRef } from 'react';
import Papa from 'papaparse';

interface CsvUploaderProps {
  onEmailsParsed: (emails: string[]) => void;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({ onEmailsParsed }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [validCount, setValidCount] = useState<number | null>(null);
  const [invalidCount, setInvalidCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
  };

  const processFile = (file: File) => {
    setFileName(file.name);

    Papa.parse(file, {
      complete: (results) => {
        const extractedEmails: string[] = [];
        let invalid = 0;

        results.data.forEach((row: any) => {
          let emailCandidate = '';
          if (Array.isArray(row)) {
            emailCandidate = row.find((cell) => typeof cell === 'string' && cell.includes('@')) || row[0] || '';
          } else if (typeof row === 'object' && row !== null) {
            emailCandidate =
              row.email ||
              row.Email ||
              row['Email Address'] ||
              Object.values(row).find((v) => typeof v === 'string' && v.includes('@')) ||
              '';
          } else if (typeof row === 'string') {
            emailCandidate = row;
          }

          const cleaned = String(emailCandidate).trim().toLowerCase();
          if (validateEmail(cleaned)) {
            extractedEmails.push(cleaned);
          } else if (cleaned.length > 0) {
            invalid++;
          }
        });

        const uniqueEmails = Array.from(new Set(extractedEmails));
        setValidCount(uniqueEmails.length);
        setInvalidCount(invalid);
        onEmailsParsed(uniqueEmails);
      },
      error: (error) => {
        alert(`Failed to parse CSV file: ${error.message}`);
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setFileName(null);
    setValidCount(null);
    setInvalidCount(0);
    onEmailsParsed([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {!fileName ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50/60 hover:bg-slate-100/70 hover:border-[#1e3a8a]/50 transition-all duration-150 text-center flex flex-col items-center justify-center cursor-pointer mb-4 group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,text/csv,.txt"
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-[#0f172a] text-[#0f172a] group-hover:text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition-all duration-150 shadow-xs">
            <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
          </div>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-0.5">Upload recipient list</h3>
          <p className="text-xs text-slate-500 mb-1">Drag and drop your CSV or TXT file here, or browse.</p>
          <span className="text-[11px] text-slate-400">Accepted formats: CSV, TXT</span>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3.5 bg-slate-50/80 border border-slate-200 rounded-lg mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#0f172a] shadow-xs">
              <span className="material-symbols-outlined text-[20px]">description</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#0f172a] truncate">{fileName}</span>
              <div className="flex items-center gap-2 mt-0.5">
                {validCount !== null && (
                  <span className="text-[11px] text-[#0f172a] font-medium">
                    {validCount} recipient{validCount !== 1 ? 's' : ''} detected
                  </span>
                )}
                {invalidCount > 0 && (
                  <span className="text-[11px] text-amber-700 font-medium">
                    • {invalidCount} invalid row{invalidCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-[#0f172a] hover:bg-slate-200/70 rounded text-xs font-medium transition-colors duration-150"
            title="Remove file"
          >
            <span className="material-symbols-outlined text-[15px]">close</span>
            <span>Remove</span>
          </button>
        </div>
      )}
    </div>
  );
};
