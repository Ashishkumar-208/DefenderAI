import React, { useState, useRef } from 'react';
import { Upload, FileCode, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const LogUpload = ({ onUploadSuccess }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const uploadFile = async (file) => {
    // Validate file extensions
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['txt', 'log', 'csv', 'json'];
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Invalid format! DefenderAI only supports TXT, LOG, CSV, or JSON logs.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    setIsUploading(true);
    const toastId = toast.loading(`Uploading and analyzing ${file.name}...`);

    try {
      const response = await api.post('/logs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;
      
      toast.success(
        <div>
          <p className="font-semibold text-xs text-green-400">Analysis Completed!</p>
          <p className="text-[10px] text-gray-300">
            Detected <span className="font-bold text-red-400">{data.threats_detected}</span> threats.
            Overall Severity: <span className="font-bold uppercase text-yellow-400">{data.overall_severity}</span>
          </p>
        </div>, 
        { id: toastId, duration: 6000 }
      );
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to upload or analyze the security log file.', { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`
        relative rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[220px] bg-brand-cards
        ${isDragActive 
          ? 'border-brand-primary bg-brand-primary/5 shadow-[0_0_15px_rgba(0,229,255,0.05)]' 
          : 'border-gray-800 hover:border-gray-700/80 hover:bg-gray-800/10'
        }
        ${isUploading ? 'pointer-events-none opacity-60' : ''}
      `}
      onClick={onButtonClick}
    >
      <input 
        ref={fileInputRef}
        type="file" 
        className="hidden" 
        onChange={handleChange}
        accept=".txt,.log,.csv,.json"
      />

      {isUploading ? (
        <div className="space-y-4">
          <Loader2 className="w-12 h-12 text-brand-primary animate-spin mx-auto" />
          <div>
            <h4 className="font-semibold text-gray-200">Processing SOC Logs Engine</h4>
            <p className="text-xs text-gray-500 mt-1">Executing regex threat matching and signature checks...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-gray-900/60 border border-gray-850 rounded-lg inline-block mx-auto text-gray-400">
            <Upload className="w-8 h-8 text-brand-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-200">Upload Firewall, Syslog, or Auth Files</h4>
            <p className="text-xs text-gray-500 mt-1.5">
              Drag & drop files or click to browse. <br/>
              Supports <code className="text-brand-primary bg-gray-900/80 px-1 py-0.5 rounded text-[10px]">.TXT</code>, <code className="text-brand-primary bg-gray-900/80 px-1 py-0.5 rounded text-[10px]">.LOG</code>, <code className="text-brand-primary bg-gray-900/80 px-1 py-0.5 rounded text-[10px]">.CSV</code>, or <code className="text-brand-primary bg-gray-900/80 px-1 py-0.5 rounded text-[10px]">.JSON</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogUpload;
