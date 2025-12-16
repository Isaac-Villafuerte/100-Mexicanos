import { useState, useRef, useEffect, useCallback } from 'react';
import { compressImage, fileToBase64 } from '../utils/imageCompression';

/**
 * ImageInput component - Supports multiple input methods:
 * 1. File selection from device
 * 2. Paste from clipboard (Ctrl+V / Cmd+V)
 * 3. Drag and drop
 * 4. Camera capture
 */
function ImageInput({ onImageReady, compressionOptions = {}, disabled = false }) {
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const processImage = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const compressedFile = await compressImage(file, compressionOptions);
      const base64Preview = await fileToBase64(compressedFile);
      
      setPreview(base64Preview);
      onImageReady(compressedFile);
    } catch (err) {
      setError('Error al procesar la imagen: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [onImageReady, compressionOptions]);

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processImage(file);
    }
  };

  // Handle paste event
  useEffect(() => {
    const handlePaste = async (e) => {
      if (disabled) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            processImage(file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [disabled, processImage]);

  const clearImage = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    onImageReady(null);
  };

  return (
    <div className="image-input">
      <p className="image-input__hint">
        📸 Sube una imagen con 1-4 tarjetas de preguntas
      </p>

      {!preview ? (
        <>
          {/* Drop zone */}
          <div
            ref={dropZoneRef}
            className={`image-input__dropzone ${dragActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="image-input__dropzone-content">
              <span className="image-input__icon">📷</span>
              <p>Arrastra una imagen aquí</p>
              <p className="image-input__or">o</p>
              <p className="image-input__paste-hint">Pega con Ctrl+V / Cmd+V</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="image-input__actions">
            {/* File selection */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={disabled || isProcessing}
              hidden
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isProcessing}
            >
              📁 Seleccionar archivo
            </button>

            {/* Camera capture */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              disabled={disabled || isProcessing}
              hidden
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => cameraInputRef.current?.click()}
              disabled={disabled || isProcessing}
            >
              📷 Usar cámara
            </button>
          </div>
        </>
      ) : (
        /* Preview */
        <div className="image-input__preview">
          <img src={preview} alt="Vista previa" />
          <button
            type="button"
            className="btn btn-small btn-danger image-input__clear"
            onClick={clearImage}
            disabled={disabled || isProcessing}
          >
            ✕ Quitar imagen
          </button>
        </div>
      )}

      {isProcessing && (
        <div className="image-input__processing">
          <span className="spinner"></span> Procesando imagen...
        </div>
      )}

      {error && (
        <div className="image-input__error">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

export default ImageInput;
