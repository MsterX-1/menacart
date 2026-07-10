import React, { useState, useRef } from 'react';
import { uploadImageToCloudinary } from '../../api/cloudinaryApi';
import { Button } from '../Button';
import './ImageUpload.css';

export interface ImageItem {
  url: string;
  isMain: boolean;
}

interface MultiImageUploadProps {
  label?: string;
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  className?: string;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({ label, images, onChange, className = '' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate size (e.g. max 5MB per file)
    const invalidFiles = files.filter(f => f.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError('One or more files are too large. Max size is 5MB.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const uploadPromises = files.map(file => uploadImageToCloudinary(file));
      const results = await Promise.all(uploadPromises);
      
      const newImages = results.map(res => ({
        url: res.optimizedUrl,
        isMain: false // by default, newly uploaded images are not main
      }));

      const combinedImages = [...images, ...newImages];
      
      // If there's no main image yet, set the first one as main
      if (combinedImages.length > 0 && !combinedImages.some(img => img.isMain)) {
        combinedImages[0].isMain = true;
      }

      onChange(combinedImages);
    } catch (err: any) {
      setError(err.message || 'Failed to upload images.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const newImages = [...images];
    const removedWasMain = newImages[index].isMain;
    newImages.splice(index, 1);
    
    // If we removed the main image, make the new first one main
    if (removedWasMain && newImages.length > 0) {
      newImages[0].isMain = true;
    }
    
    onChange(newImages);
  };

  const handleSetMain = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isMain: i === index
    }));
    onChange(newImages);
  };

  return (
    <div className={`multi-image-upload-wrapper ${className}`}>
      {label && <label className="input-label">{label}</label>}
      
      <div className="multi-image-grid">
        {images.map((img, idx) => (
          <div key={idx} className={`multi-image-item ${img.isMain ? 'is-main' : ''}`}>
            {img.isMain && <div className="main-badge">Main</div>}
            <img src={img.url} alt={`Upload ${idx + 1}`} />
            <div className="multi-image-item-overlay">
              {!img.isMain && (
                <Button type="button" variant="primary" size="sm" onClick={() => handleSetMain(idx)}>
                  Set Main
                </Button>
              )}
              <Button type="button" variant="secondary" size="sm" onClick={() => handleRemove(idx)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
        
        <div 
          className={`multi-upload-trigger ${isUploading ? 'is-uploading' : ''}`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="loading-spinner"></div>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Images</span>
            </>
          )}
        </div>
      </div>
      
      <input 
        type="file" 
        multiple
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};
