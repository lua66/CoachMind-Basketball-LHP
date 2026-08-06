import React, { useState, useRef } from 'react';
import { Camera, Upload, Grid, Info, X, Check, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface CoachPhotoSelectorProps {
  currentPhotoUrl: string;
  onSelectPhoto: (url: string) => void;
  avatarPresets?: string[];
}

export const defaultAvatarPresets = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
];

export const CoachPhotoSelector: React.FC<CoachPhotoSelectorProps> = ({
  currentPhotoUrl,
  onSelectPhoto,
  avatarPresets = defaultAvatarPresets,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'presets'>('presets');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Handle File Upload from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onSelectPhoto(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 800 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      setCameraError('No se pudo acceder a la cámara. Revisa los permisos de tu navegador o dispositivo.');
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  // Capture Photo from Video Stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    const canvas = document.createElement('canvas');
    // Target official 3:4 aspect ratio (e.g. 300x400)
    canvas.width = 300;
    canvas.height = 400;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      const video = videoRef.current;
      const vWidth = video.videoWidth || 640;
      const vHeight = video.videoHeight || 480;

      // Crop video to 3:4 ratio centered
      let sourceWidth = vWidth;
      let sourceHeight = (vWidth * 4) / 3;
      if (sourceHeight > vHeight) {
        sourceHeight = vHeight;
        sourceWidth = (vHeight * 3) / 4;
      }

      const sourceX = (vWidth - sourceWidth) / 2;
      const sourceY = (vHeight - sourceHeight) / 2;

      ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, 300, 400);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      onSelectPhoto(dataUrl);
    }

    setIsCapturing(false);
    stopCamera();
  };

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
      {/* Information Banner about Official ID Photo Format */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-900/90 via-slate-900 to-indigo-900 text-white space-y-2 border border-blue-500/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <Info className="w-4 h-4 text-amber-400" />
          </div>
          <h4 className="font-extrabold text-xs text-amber-300 uppercase tracking-wider">
            Requisitos de la Imagen para la Ficha Oficial
          </h4>
        </div>

        <div className="text-[11px] text-slate-200 leading-relaxed space-y-1 pl-1">
          <p className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span><strong>Formato:</strong> Fotografía tipo Carnet de Identidad / DNI / Licencia federativa oficial.</span>
          </p>
          <p className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span><strong>Dimensiones recomendadas:</strong> Proporción 3:4 (ejemplo: 35 x 45 mm o 300 x 400 px).</span>
          </p>
          <p className="flex items-center gap-1.5 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span>Rostro nítido, centrado de frente sobre un fondo claro o neutro.</span>
          </p>
        </div>
      </div>

      {/* Preview & Selection Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Current Photo Preview */}
        <div className="relative shrink-0">
          <img
            src={currentPhotoUrl || avatarPresets[0]}
            alt="Foto Entrenador"
            className="w-24 h-32 rounded-xl object-cover border-2 border-amber-500 shadow-md bg-slate-200"
            onError={(e) => {
              (e.target as HTMLElement).setAttribute('src', avatarPresets[0]);
            }}
          />
          <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-1 rounded-lg text-[9px] font-black uppercase shadow">
            3:4 Carnet
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex-1 space-y-3 w-full">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                startCamera();
              }}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'camera' || isCameraOpen
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-300/60'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Tirar Foto</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveTab('upload');
                fileInputRef.current?.click();
              }}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-300/60'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir Foto</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveTab('presets');
              }}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-300/60'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Pasarela</span>
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Tab Content 1: Upload Status */}
          {activeTab === 'upload' && (
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-2">
              <p className="text-xs font-medium text-slate-600">
                Selecciona una foto guardada en tu dispositivo (Formatos JPG, PNG, WEBP).
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Explorar Archivos...</span>
              </button>
            </div>
          )}

          {/* Tab Content 2: Pasarela / Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 block">
                Selecciona una foto de la pasarela de avatares oficiales:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {avatarPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectPhoto(preset)}
                    className={`w-11 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      currentPhotoUrl === preset
                        ? 'border-amber-500 ring-2 ring-amber-500/40 scale-105 shadow-md'
                        : 'border-slate-300 opacity-70 hover:opacity-100 hover:border-amber-400'
                    }`}
                  >
                    <img src={preset} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Camera Live Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
                <Camera className="w-4 h-4" />
                <span>Tirar Foto de Carnet</span>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs space-y-2 text-center">
                <AlertCircle className="w-6 h-6 text-red-400 mx-auto" />
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 bg-red-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Subir Foto desde Archivo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative mx-auto w-[240px] h-[320px] rounded-xl overflow-hidden bg-black border-2 border-amber-500 shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* ID Photo Overlay Guide */}
                  <div className="absolute inset-0 border-2 border-dashed border-amber-400/40 rounded-xl pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-32 h-40 border border-amber-400/60 rounded-full" />
                    <span className="text-[10px] text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded mt-2 font-bold">
                      Centra tu rostro aquí (3:4)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={isCapturing}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-black shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capturar y Usar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
