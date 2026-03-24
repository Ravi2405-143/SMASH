import React, { useState, useRef } from 'react';
import { UploadCloud, FileVideo, X } from 'lucide-react';
import './UploadZone.css';

export function UploadZone({ onVideoSelected }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        handleFileSelection(file);
      } else {
        alert('Please upload a video file format (MP4, MOV, etc.)');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelection(file);
    }
  };

  const handleFileSelection = (file) => {
    setSelectedFile(file);
  };

  const handleAnalyze = () => {
    if (selectedFile && onVideoSelected) {
      onVideoSelected(selectedFile);
    }
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="upload-section">
      <div className="upload-header text-center">
        <h2>Analyze Your Smash</h2>
        <p className="subtitle">Upload a video from your side angle to calculate peak velocity and trajectory.</p>
      </div>

      <div 
        className={`upload-zone glass-panel ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden-input" 
          accept="video/mp4,video/x-m4v,video/*" 
          onChange={handleFileChange}
        />

        {!selectedFile ? (
          <div className="upload-content">
            <div className="icon-pulse-wrapper">
              <UploadCloud className="upload-icon text-gradient" size={48} />
            </div>
            <h3>Drag & Drop your video here</h3>
            <p className="upload-hint">or click to browse files (MP4, MOV)</p>
            <button className="btn-secondary mt-1">Select File</button>
          </div>
        ) : (
          <div className="file-ready-content">
            <div className="file-info-card">
              <FileVideo className="file-icon" size={32} color="var(--accent-primary)" />
              <div className="file-details">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <button className="icon-btn clear-btn" onClick={clearSelection} title="Remove file">
                <X size={20} />
              </button>
            </div>
            
            <button className="btn-primary analyze-btn mt-2" onClick={handleAnalyze}>
              Start Analysis Context
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
