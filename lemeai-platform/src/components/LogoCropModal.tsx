import { useState, useEffect, useCallback, type FC } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { FaTimes } from 'react-icons/fa';
import { getCroppedImageFile } from '../utils/cropImage';
import './UserFormModal.css';
import './LogoCropModal.css';

interface LogoCropModalProps {
  file: File;
  minAspect: number;
  maxAspect: number;
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
}

const LogoCropModal: FC<LogoCropModalProps> = ({ file, minAspect, maxAspect, onConfirm, onCancel }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState((minAspect + maxAspect) / 2);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageSrc(url);

    const img = new Image();
    img.onload = () => {
      const naturalAspect = img.naturalWidth / img.naturalHeight;
      setAspect(Math.min(Math.max(naturalAspect, minAspect), maxAspect));
    };
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file, minAspect, maxAspect]);

  const handleCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const mimeType = file.type || 'image/png';
      const croppedFile = await getCroppedImageFile(imageSrc, croppedAreaPixels, file.name, mimeType);
      onConfirm(croppedFile);
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content logo-crop-modal">
        <header className="modal-header">
          <h2>Ajustar Logo</h2>
          <button onClick={onCancel} className="close-modal-button" disabled={isProcessing} aria-label="Fechar">
            <FaTimes />
          </button>
        </header>

        <div className="logo-crop-body">
          <div className="logo-crop-area">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                cropShape="rect"
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            )}
          </div>

          <div className="logo-crop-controls">
            <div className="logo-crop-control">
              <label>Proporção ({aspect.toFixed(1)}:1)</label>
              <input
                type="range"
                min={minAspect}
                max={maxAspect}
                step={0.1}
                value={aspect}
                onChange={(e) => setAspect(Number(e.target.value))}
                disabled={isProcessing}
              />
            </div>
            <div className="logo-crop-control">
              <label>Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                disabled={isProcessing}
              />
            </div>
            <p className="logo-crop-hint">
              Ajuste a proporção e o zoom até a logo caber por completo dentro da moldura — a área fora da moldura não será usada.
            </p>
          </div>
        </div>

        <footer className="modal-footer">
          <button type="button" className="button secondary" onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </button>
          <button
            type="button"
            className="button primary"
            onClick={handleConfirm}
            disabled={isProcessing || !croppedAreaPixels}
          >
            {isProcessing ? 'Processando...' : 'Confirmar'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default LogoCropModal;
