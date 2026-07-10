import React, { useState, useRef } from 'react';
import { useMyKYCDocuments, useUploadKYCDocument } from './hooks/useSellerOnboarding';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import './KYCDocumentsPage.css';

export const KYCDocumentsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  
  const { data: documents, isLoading, error, refetch } = useMyKYCDocuments();
  const uploadMutation = useUploadKYCDocument();

  // Form State
  const [documentType, setDocumentType] = useState('National ID');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

  const validateAndSetFile = (file: File) => {
    setUploadError('');
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only PDF, PNG, and JPG files are supported.');
      setSelectedFile(null);
      return;
    }
    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds the 5MB limit.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      await uploadMutation.mutateAsync({
        documentType,
        file: selectedFile,
      });
      toastSuccess(`${documentType} document uploaded successfully!`);
      setSelectedFile(null);
      refetch();
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to upload document.');
    }
  };

  if (isLoading) {
    return (
      <div className="kyc-documents-container loading">
        <LoadingSkeleton variant="text" width="200px" height={32} />
        <div style={{ marginTop: '20px' }}>
          <LoadingSkeleton variant="rect" height="150px" />
        </div>
        <div style={{ marginTop: '20px' }}>
          <LoadingSkeleton variant="rect" height="200px" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kyc-documents-container error ">
        <p className="error-text">Failed to load documents: {(error as any).message}</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="kyc-documents-container">
      <h2 className="tab-title">KYC Document Verification</h2>
      <p className="tab-subtitle">Upload your regulatory documents to verify your store and release payouts. Accepted formats: PDF, PNG, JPG (Max 5MB).</p>

      <div className="kyc-layout-grid">
        {/* Upload Zone Panel */}
        <div className="kyc-upload-panel ">
          <h3 className="panel-title">Upload New Document</h3>
          
          <form onSubmit={handleUploadSubmit} className="kyc-upload-form">
            {uploadError && (
              <div className="password-error-alert" role="alert">
                {uploadError}
              </div>
            )}

            <div className="input-container">
              <label className="input-label" htmlFor="doc-type-select">Document Type</label>
              <div className="input-wrapper">
                <select
                  id="doc-type-select"
                  className="input-field select-field"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                >
                  <option value="National ID">National ID / Passport</option>
                  <option value="Tax Card">Tax Card (بطاقة ضريبية)</option>
                  <option value="Commercial Register">Commercial Register (سجل تجاري)</option>
                  <option value="VAT Certificate">VAT Certificate</option>
                  <option value="Other">Other Regulatory Document</option>
                </select>
              </div>
            </div>

            {/* Drag & Drop zone */}
            <div
              className={`kyc-dropzone ${isDragActive ? 'drag-active' : ''} ${selectedFile ? 'file-selected' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept=".pdf,.png,.jpg,.jpeg"
              />

              <div className="dropzone-content">
                <span className="upload-cloud-icon">
                  {selectedFile ? '📄' : '📁'}
                </span>
                {selectedFile ? (
                  <div className="selected-file-details">
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size">({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <div>
                    <p className="dropzone-text">Drag & drop your file here, or <strong>browse</strong></p>
                    <span className="dropzone-sub">Supports PDF, PNG, JPG (Up to 5MB)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="upload-submit-row">
              <Button
                type="submit"
                disabled={!selectedFile || uploadMutation.isPending}
                isLoading={uploadMutation.isPending}
              >
                Upload Document
              </Button>
              {selectedFile && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedFile(null)}
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Uploaded Documents List */}
        <div className="kyc-list-panel ">
          <h3 className="panel-title">Uploaded Verification Files</h3>

          {documents && documents.length === 0 ? (
            <div className="kyc-empty-state">
              <p>No documents uploaded yet. Please upload files to verify your seller status.</p>
            </div>
          ) : (
            <div className="kyc-documents-feed">
              {documents?.map((doc) => {
                const formattedDate = new Date(doc.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });
                const isPdf = doc.documentUrl.toLowerCase().endsWith('.pdf');

                return (
                  <div key={doc.sellerDocumentId} className={`kyc-doc-card doc-status-${doc.status.toLowerCase()}`}>
                    <div className="doc-card-row">
                      <div className="doc-icon-column">
                        <span className="doc-type-icon">{isPdf ? '📕' : '🖼️'}</span>
                      </div>
                      <div className="doc-meta-column">
                        <span className="doc-type-badge">{doc.documentType}</span>
                        <span className="doc-upload-date">Uploaded: {formattedDate}</span>
                        <a 
                          href={doc.documentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="doc-view-link"
                        >
                          View Document &rarr;
                        </a>
                      </div>
                      <div className="doc-status-column">
                        <span className={`status-badge doc-${doc.status.toLowerCase()}`}>
                          {doc.status}
                        </span>
                      </div>
                    </div>

                    {doc.status === 'Rejected' && doc.rejectionReason && (
                      <div className="doc-rejection-box">
                        <strong>Rejection Reason:</strong> {doc.rejectionReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCDocumentsPage;
