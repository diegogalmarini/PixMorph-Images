import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { UploadCloud, Github, Layers } from 'lucide-react';
import { ImageFormat, ImageState, ResizeOptions } from './types';
import { readFileAsDataURL, getImageDimensions, processImageLocally, downloadImage, getDataUrlSize, formatFileSize } from './utils/imageUtils';
import { editImageWithAI } from './services/geminiService';
import ControlPanel from './components/ControlPanel';
import PreviewArea from './components/PreviewArea';
import ImageCompositor from './components/compositor/ImageCompositor';

// Global Translations
const translations = {
  es: {
    uploadTitle: "Sube tu imagen",
    uploadDesc: "Arrastra y suelta o selecciona un archivo para redimensionar, convertir o transformar con IA.",
    selectFile: "Seleccionar Archivo",
    uploadBtn: "Subir Imagen",
    changeImg: "Cambiar imagen",
    appTitle: "PixMorph",
    appSubtitle: "AI Studio",
    formats: ["JPG", "PNG", "WEBP", "GIF"]
  },
  en: {
    uploadTitle: "Upload your image",
    uploadDesc: "Drag and drop or select a file to resize, convert, or transform with AI.",
    selectFile: "Select File",
    uploadBtn: "Upload Image",
    changeImg: "Change image",
    appTitle: "PixMorph",
    appSubtitle: "AI Studio",
    formats: ["JPG", "PNG", "WEBP", "GIF"]
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [view, setView] = useState<'editor' | 'compositor'>('editor');
  const t = translations[lang];

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
    quality: 0.8, // Default 80% quality
    format: ImageFormat.JPEG,
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'ai'>('basic');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate sizes for display
  const originalSizeStr = useMemo(() => {
    if (imageState.file) {
      return formatFileSize(imageState.file.size);
    }
    return null;
  }, [imageState.file]);

  const processedSizeStr = useMemo(() => {
    if (imageState.processedUrl) {
      const size = getDataUrlSize(imageState.processedUrl);
      return formatFileSize(size);
    }
    return null;
  }, [imageState.processedUrl]);

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
      setError(lang === 'es' ? "Error al cargar la imagen." : "Error loading image.");
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
      setError(lang === 'es' ? "Error procesando la imagen." : "Error processing image.");
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
      setError(lang === 'es'
        ? "Error: La IA no pudo procesar tu solicitud. Verifica tu API Key."
        : "Error: AI could not process request. Check API Key.");
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
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('editor')}>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
            <UploadCloud className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            {t.appTitle} <span className="text-indigo-500">{t.appSubtitle}</span>
          </h1>
        </div>

        <div className="flex items-center space-x-4">


          {/* Global Action Buttons */}
          <div className="flex space-x-2 mr-2">
            <button
              onClick={() => setLang('en')}
              className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold border transition-colors ${lang === 'en' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => setLang('es')}
              className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold border transition-colors ${lang === 'es' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
              title="Español"
            >
              ES
            </button>
            <a
              href="https://github.com/diegogalmarini/PixMorph-Images"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded flex items-center justify-center bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 transition-colors"
              title="GitHub"
            >
              <Github size={16} />
            </a>
          </div>


        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {view === 'compositor' ? (
          <ImageCompositor />
        ) : (
          <div className="flex flex-col-reverse md:flex-row h-full">
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
                  <h2 className="text-2xl font-bold mb-2">{t.uploadTitle}</h2>
                  <p className="text-gray-400 mb-8">{t.uploadDesc}</p>

                  <label className="cursor-pointer block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/25 transform hover:-translate-y-1">
                    {t.selectFile}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>

                  <div className="mt-6 flex justify-center space-x-4 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                    {t.formats.map((fmt, i) => (
                      <span key={fmt}>{fmt}{i < t.formats.length - 1 ? ' • ' : ''}</span>
                    ))}
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
                  lang={lang}
                />
                <PreviewArea
                  originalUrl={imageState.originalUrl}
                  processedUrl={imageState.processedUrl}
                  processedDimensions={imageState.processedDimensions}
                  originalSizeStr={originalSizeStr}
                  processedSizeStr={processedSizeStr}
                  originalFormat={imageState.file ? imageState.file.type.split('/')[1].toUpperCase() : null}
                  onDownload={handleDownload}
                  fileName={imageState.name}
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;