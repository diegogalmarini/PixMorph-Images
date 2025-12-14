import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { useCompositor } from '../../hooks/useCompositor';
import CanvasStage from './CanvasStage';
import { Layers, ImagePlus, Download, Trash2, Wand2, Sparkles, XCircle } from 'lucide-react'; // Added Sparkles, XCircle
import { editImageWithAI } from '../../services/geminiService'; // Import AI service

const ImageCompositor: React.FC = () => {
  const {
    layers,
    selectedId,
    setSelectedId,
    addLayer,
    updateLayer,
    removeLayer,
    stageRef
  } = useCompositor();

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Prevent backspace from navigating back if not in an input
        const tag = (e.target as HTMLElement).tagName.toUpperCase();
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          removeLayer(selectedId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, removeLayer]);


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        addLayer(file);
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      addLayer(e.target.files[0]);
    }
  };

  const handleRemoveBackground = async () => {
    if (!selectedId) return;
    const layer = layers.find(l => l.id === selectedId);
    if (!layer) return;

    try {
      // Dynamic import to avoid build issues with WASM/top-level await if any
      // @ts-ignore
      const imgly = await import('@imgly/background-removal');
      const removeBackground = imgly.default || imgly.removeBackground || imgly;

      if (typeof removeBackground !== 'function') {
        console.error("imgly export:", imgly);
        throw new Error("Could not find removeBackground function");
      }

      const blob = await removeBackground(layer.src);
      const url = URL.createObjectURL(blob);
      updateLayer(selectedId, { src: url });
    } catch (error) {
      console.error("Failed to remove background", error);
      alert("Error removing background");
    }
  };

  const handleGenerativeIntegration = async () => {
    if (!stageRef.current || !prompt.trim()) return;

    try {
      setIsGenerating(true);
      // 1. Capture current canvas state
      // Deselect first to capture clean state without transformers
      const currentSelection = selectedId;
      setSelectedId(null);

      // Wait a tick for render update (React state update is async)
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 1.5 }); // Good quality for AI input

      // 2. Send to AI
      // We use the existing geminiService function
      const resultUrl = await editImageWithAI(dataUrl, prompt);

      // 3. Add result as new layer
      const img = new Image();
      img.src = resultUrl;
      img.onload = () => {
        // We can fetch blob from url to create a file-like object or just pass url logic if we adapt addLayer
        // For now, let's just cheat and reuse addLayer logic by fetching the blob?
        // Or better, let's manually add the layer since we have the URL logic inside useCompositor exposed via addLayer(File).
        // Actually, let's fetch it to a blob to treat it consistently.
        fetch(resultUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "AI_Composition.png", { type: "image/png" });
            addLayer(file);
          });
      };

    } catch (error) {
      console.error("Generation failed", error);
      alert("Error generating image. Check your API Key.");
    } finally {
      setIsGenerating(false);
    }
  };


  const handleExport = () => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL({ pixelRatio: 2 }); // High quality export
      const link = document.createElement('a');
      link.download = 'composition.png';
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const selectedLayer = layers.find(l => l.id === selectedId);

  return (
    <div className="flex h-full bg-gray-900 text-white overflow-hidden">
      {/* Sidebar / Toolbar */}
      <div className="w-16 md:w-20 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 space-y-4 z-10 shrink-0">
        <label className="p-3 bg-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-700 transition shadow-lg" title="Add Image">
          <ImagePlus size={24} />
          <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
        </label>

        <button
          className={`p - 3 rounded - lg transition ${selectedId ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'} `}
          disabled={!selectedId}
          title="Remove Background"
          onClick={handleRemoveBackground}
        >
          <Wand2 size={24} />
        </button>

        <button
          className={`p - 3 rounded - lg transition ${selectedId ? 'bg-red-900/50 hover:bg-red-900 text-red-200' : 'bg-gray-800 text-gray-500 cursor-not-allowed'} `}
          disabled={!selectedId}
          title="Delete Layer (Del)"
          onClick={() => selectedId && removeLayer(selectedId)}
        >
          <Trash2 size={24} />
        </button>

        <div className="flex-1"></div>

        <button
          className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition shadow-lg"
          title="Export Composition"
          onClick={handleExport}
        >
          <Download size={24} />
        </button>
      </div>

      {/* AI Prompt Input Area */}
      <div className="w-64 bg-gray-850 border-r border-gray-700 flex flex-col p-4 z-10 space-y-4">
        <h3 className="text-sm font-bold text-gray-300 flex items-center">
          <Sparkles size={16} className="mr-2 text-indigo-400" />
          Caja Mágica
        </h3>
        <p className="text-xs text-gray-400">
          1. Organiza tus capas.
          <br />
          2. Describe la escena final.
          <br />
          3. ¡Fusiona con IA!
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ej: Hombre sentado en el sofá mirando un móvil, iluminación cinemática..."
          className="w-full h-32 bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white resize-none focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        />
        <button
          onClick={handleGenerativeIntegration}
          disabled={isGenerating || !prompt.trim()}
          className={`w - full py - 2 rounded font - semibold text - sm transition - all shadow - lg flex justify - center items - center
                    ${isGenerating || !prompt.trim()
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
            } `}
        >
          {isGenerating ? (
            <>Processing...</>
          ) : (
            <>
              <Sparkles size={16} className="mr-2" />
              Generar / Integrar
            </>
          )}
        </button>
      </div>

      {/* Main Workspace */}
      <div
        className="flex-1 relative bg-gray-950 flex flex-col"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="absolute inset-0 overflow-auto flex items-center justify-center p-8">
          <CanvasStage
            layers={layers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChange={updateLayer}
          />
        </div>
      </div>

      {/* Layers Panel */}
      <div className="w-56 bg-gray-800 border-l border-gray-700 flex flex-col z-10 shrink-0">
        <div className="p-4 border-b border-gray-700 font-bold flex items-center">
          <Layers className="mr-2" size={18} /> Capas
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {[...layers].reverse().map((layer) => (
            <div
              key={layer.id}
              onClick={() => setSelectedId(layer.id)}
              className={`p - 2 rounded cursor - pointer flex items - center space - x - 2 group relative ${selectedId === layer.id ? 'bg-indigo-600' : 'hover:bg-gray-700'} `}
            >
              <img src={layer.src} className="w-8 h-8 object-cover rounded bg-white" alt="layer thumb" />
              <span className="text-sm truncate flex-1">{layer.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity"
                title="Delete"
              >
                <XCircle size={14} />
              </button>
            </div>
          ))}
          {layers.length === 0 && (
            <div className="text-gray-500 text-sm text-center mt-4">
              Arrastra imágenes aquí
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageCompositor;
