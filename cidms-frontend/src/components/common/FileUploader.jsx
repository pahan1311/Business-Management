import { useState, useRef } from 'react';

const FileUploader = ({ 
  onFileSelect = () => {}, 
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  multiple = false,
  className = ""
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (file.size > maxSize) {
      return `File size must be less than ${maxSize / (1024 * 1024)}MB`;
    }
    return null;
  };

  const handleFiles = (files) => {
    setError('');
    const fileList = Array.from(files);
    
    for (const file of fileList) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (multiple) {
      onFileSelect(fileList);
    } else {
      onFileSelect(fileList[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`file-uploader ${className}`}>
      <div
        className={`border border-dashed rounded p-4 text-center ${
          dragActive ? 'border-primary bg-light' : 'border-secondary'
        } ${uploading ? 'opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
        onClick={!uploading ? openFileDialog : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="d-none"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={uploading}
        />
        
        <div className="mb-3">
          <i className="bi bi-cloud-upload" style={{ fontSize: '2rem', color: '#6c757d' }}></i>
        </div>
        
        {uploading ? (
          <div>
            <div className="spinner-border spinner-border-sm mb-2" role="status">
              <span className="visually-hidden">Uploading...</span>
            </div>
            <p className="mb-0">Uploading...</p>
          </div>
        ) : (
          <div>
            <p className="mb-2">
              <strong>Choose files</strong> or drag and drop
            </p>
            <p className="text-muted small mb-0">
              {accept.includes('image') && 'Images only, '}
              Max {maxSize / (1024 * 1024)}MB per file
            </p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="alert alert-danger mt-2 mb-0 py-2">
          <small>{error}</small>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
