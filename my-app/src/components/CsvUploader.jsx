import React, { useState } from 'react';
import Papa from 'papaparse';
import '../styles/CsvUploader.css';

export default function CsvUploader({ onUploadComplete, expectedHeaders, title = "Bulk CSV Upload" }) {
  const [error, setError] = useState(null);
  const [successCount, setSuccessCount] = useState(0);
  const [inputKey, setInputKey] = useState(Date.now()); // For resetting the file input

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setSuccessCount(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          setError(`Error parsing CSV: ${results.errors[0].message}`);
          setInputKey(Date.now()); // reset
          return;
        }

        const data = results.data;
        if (data.length === 0) {
          setError("CSV file is empty.");
          setInputKey(Date.now()); // reset
          return;
        }

        if (expectedHeaders && expectedHeaders.length > 0) {
          const keys = Object.keys(data[0]);
          const missing = expectedHeaders.filter(h => !keys.includes(h));
          if (missing.length > 0) {
            setError(`Missing required headers: ${missing.join(', ')}`);
            setInputKey(Date.now()); // reset
            return;
          }
        }

        onUploadComplete(data);
        setSuccessCount(data.length);
        setInputKey(Date.now()); // reset
      },
      error: (err) => {
        setError(`File read error: ${err.message}`);
        setInputKey(Date.now()); // reset
      }
    });
  };

  return (
    <div className="csv-uploader-card">
      <div className="csv-content-wrap">
        <h4 className="csv-title">{title}</h4>
        <p className="csv-desc">
          Upload a standard <code>.csv</code> file to bulk import records.
          {expectedHeaders && ` Expected headers: ${expectedHeaders.join(', ')}`}
        </p>
        
        <input 
          key={inputKey}
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload} 
          className="csv-file-input"
        />

        {error && <div className="csv-error-msg">⚠️ {error}</div>}
        {successCount > 0 && <div className="csv-success-msg">✅ Successfully parsed {successCount} rows.</div>}
      </div>
    </div>
  );
}
