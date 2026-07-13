import React, { useState, useRef } from 'react';
import { uploadImageToCloudinary } from '../../api/cloudinaryApi';
import { Button } from '../Button';
import './ImageUpload.css';

interface ImageUploadProps {
  label?: string;
  value?: string | null;
  onChange: (url: string) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ label, value, onChange, className = '' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g. max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Max size is 5MB.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const { optimizedUrl } = await uploadImageToCloudinary(file);
      // We store the optimized URL so any place that renders this directly uses the compressed, cached version.
      onChange(optimizedUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`image-upload-wrapper ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="image-upload-container">
        {value ? (
          <div className="image-preview">
            <img src={value} alt="Uploaded preview" />
            <div className="image-preview-overlay">
              <Button type="button" variant="secondary" size="sm" onClick={handleClear}>
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className={`image-upload-dropzone ${isUploading ? 'is-uploading' : ''}`} 
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            ) : (
              <>
                <svg className="upload-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                <p>Click to upload image</p>
                <span className="upload-hint">PNG, JPG up to 5MB</span>
              </>
            )}
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};
