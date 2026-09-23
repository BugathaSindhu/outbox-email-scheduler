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
          className="border-2 border-dashed border-[#c3c6d7] rounded-lg p-6 bg-[#f8f9ff] hover:bg-[#eff4ff] transition-colors duration-150 text-center flex flex-col items-center justify-center cursor-pointer mb-3 group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,text/csv,.txt"
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-[#e5eeff] text-[#004ac6] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-150">
            <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
          </div>
          <h3 className="text-[13px] font-semibold text-[#0b1c30] mb-0.5">Upload recipient list</h3>
          <p className="text-[12px] text-[#434655] mb-1">Drag and drop your CSV or TXT file here, or browse.</p>
          <span className="text-[11px] font-medium text-[#737686]">Accepted formats: CSV, TXT</span>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 px-4 bg-[#eff4ff] border border-[#c3c6d7] rounded-lg mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded bg-white border border-[#c3c6d7] flex items-center justify-center text-[#004ac6]">
              <span className="material-symbols-outlined text-[20px]">description</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] text-[#0b1c30] font-semibold truncate">{fileName}</span>
              <div className="flex items-center gap-2">
                {validCount !== null && (
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {validCount} valid email address{validCount !== 1 ? 'es' : ''} detected
                  </span>
                )}
                {invalidCount > 0 && (
                  <span className="text-[11px] text-amber-700 font-medium">
                    • {invalidCount} invalid row{invalidCount !== 1 ? 's' : ''} ignored
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-[#ba1a1a] rounded transition"
            title="Remove file"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
};
