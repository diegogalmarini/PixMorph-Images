import React, { useState, useCallback, useEffect } from 'react';
import { UploadCloud } from 'lucide-react';
import { ImageFormat, ImageState, ResizeOptions } from './types';
import { readFileAsDataURL, getImageDimensions, processImageLocally, downloadImage } from './utils/imageUtils';
import { editImageWithAI } from './services/geminiService';
import ControlPanel from './components/ControlPanel';
import PreviewArea from './components/PreviewArea';

const App: React.FC = () => {
  const [imageState, setImageState] = useState<ImageState>({
    file: null,
    originalUrl: null,
    processedUrl: null,
    originalDimensions: { width: 0, height: 0 },
    processedDimensions: { width: 0, height: 0 },
    name: '',
  });

  const [options, setOptions] = useState<ResizeOptions>({
    width: 0,
    height: 0,
    maintainAspectRatio: true,
    quality: 0.9,
    format: ImageFormat.JPEG,
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'ai'>('basic');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      const url = await readFileAsDataURL(file);
      const { width, height } = await getImageDimensions(url);

      setImageState({
        file,
        originalUrl: url,
        processedUrl: url, // Initially, processed is same as original
        originalDimensions: { width, height },
        processedDimensions: { width, height },
        name: file.name,
      });

      setOptions((prev) => ({
        ...prev,
        width,
        height,
      }));
    } catch (err) {
      setError("Error al cargar la imagen. Inténtalo de nuevo.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessLocal = async () => {
    if (!imageState.originalUrl) return;

    try {
      setIsProcessing(true);
      setError(null);
      const processedUrl = await processImageLocally(imageState.originalUrl, options);
      
      setImageState((prev) => ({
        ...prev,
        processedUrl,
        processedDimensions: { width: options.width, height: options.height },
      }));
    } catch (err) {
      setError("Error procesando la imagen localmente.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessAI = async (prompt: string) => {
    if (!imageState.originalUrl) return;

    try {
      setIsProcessing(true);
      setError(null);
      
      // Call Gemini Service
      // If we have a processed URL (e.g. resized), use that as base, otherwise use original
      const baseImage = imageState.processedUrl || imageState.originalUrl;
      const aiResultUrl = await editImageWithAI(baseImage, prompt);

      // We need to get dimensions of the new AI image
      const { width, height } = await getImageDimensions(aiResultUrl);

      setImageState((prev) => ({
        ...prev,
        processedUrl: aiResultUrl,
        processedDimensions: { width, height },
      }));

      // Update options to match new AI dimensions
      setOptions(prev => ({ ...prev, width, height }));

    } catch (err) {
      setError("Error: La IA no pudo procesar tu solicitud. Verifica tu API Key o intenta otro prompt.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!imageState.processedUrl) return;
    
    // Create filename based on format
    const ext = options.format.split('/')[1];
    const nameWithoutExt = imageState.name.substring(0, imageState.name.lastIndexOf('.')) || imageState.name;
    const suffix = activeTab === 'ai' ? '-ai-remix' : '-processed';
    const filename = `${nameWithoutExt}${suffix}.${ext}`;
    
    downloadImage(imageState.processedUrl, filename);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900 shrink-0 z-20">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
            <UploadCloud className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            PixMorph <span className="text-indigo-500">AI Studio</span>
          </h1>
        </div>
        
        {!imageState.file && (
            <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-lg shadow-indigo-500/20">
            Subir Imagen
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
        )}
        
        {imageState.file && (
           <label className="cursor-pointer text-gray-400 hover:text-white text-sm flex items-center transition-colors">
              <span className="mr-2">Cambiar imagen</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
           </label>
        )}
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden relative">
         {/* Error Toast */}
         {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-xl backdrop-blur-sm border border-red-400/50 animate-fade-in-down">
              {error}
              <button onClick={() => setError(null)} className="ml-4 font-bold opacity-75 hover:opacity-100">✕</button>
            </div>
          )}

        {!imageState.file ? (
          <div className="w-full flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-950 to-gray-950">
            <div className="max-w-md w-full bg-gray-900/50 p-12 rounded-2xl border border-gray-800 backdrop-blur-sm shadow-2xl">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 group cursor-pointer hover:bg-indigo-600 transition-all duration-300">
                <UploadCloud className="w-10 h-10 text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Sube tu imagen</h2>
              <p className="text-gray-400 mb-8">Arrastra y suelta o selecciona un archivo para redimensionar, convertir o transformar con IA.</p>
              
              <label className="cursor-pointer block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/25 transform hover:-translate-y-1">
                Seleccionar Archivo
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
              
              <div className="mt-6 flex justify-center space-x-4 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                <span>JPG</span>
                <span>•</span>
                <span>PNG</span>
                <span>•</span>
                <span>WEBP</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <ControlPanel
              originalDimensions={imageState.originalDimensions}
              options={options}
              setOptions={setOptions}
              onProcessLocal={handleProcessLocal}
              onProcessAI={handleProcessAI}
              isProcessing={isProcessing}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            <PreviewArea
              originalUrl={imageState.originalUrl}
              processedUrl={imageState.processedUrl}
              processedDimensions={imageState.processedDimensions}
              onDownload={handleDownload}
              fileName={imageState.name}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default App;
