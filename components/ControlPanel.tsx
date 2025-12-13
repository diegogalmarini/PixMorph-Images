import React, { useEffect, useState } from 'react';
import { ImageFormat, ResizeOptions, AIOptions } from '../types';
import { Sparkles, ArrowRightLeft, Maximize2, Download } from 'lucide-react';

interface ControlPanelProps {
  originalDimensions: { width: number; height: number };
  options: ResizeOptions;
  setOptions: (opt: ResizeOptions) => void;
  onProcessLocal: () => void;
  onProcessAI: (prompt: string) => void;
  isProcessing: boolean;
  activeTab: 'basic' | 'ai';
  setActiveTab: (tab: 'basic' | 'ai') => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  originalDimensions,
  options,
  setOptions,
  onProcessLocal,
  onProcessAI,
  isProcessing,
  activeTab,
  setActiveTab
}) => {
  const [aiPrompt, setAiPrompt] = useState('');

  // Update height/width based on aspect ratio when one changes
  const handleDimensionChange = (dimension: 'width' | 'height', value: number) => {
    if (options.maintainAspectRatio) {
      const ratio = originalDimensions.width / originalDimensions.height;
      if (dimension === 'width') {
        setOptions({ ...options, width: value, height: Math.round(value / ratio) });
      } else {
        setOptions({ ...options, height: value, width: Math.round(value * ratio) });
      }
    } else {
      setOptions({ ...options, [dimension]: value });
    }
  };

  return (
    <div className="bg-gray-850 border-r border-gray-750 p-6 flex flex-col h-full overflow-y-auto w-full md:w-80 lg:w-96 shrink-0">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Editor</h2>
        <p className="text-gray-400 text-sm">Configura tu imagen</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-750 p-1 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('basic')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'basic' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4 inline mr-2" />
          Básico
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'ai' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          IA Mágica
        </button>
      </div>

      {activeTab === 'basic' ? (
        <div className="space-y-6 flex-1">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Formato de Salida</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'JPG', value: ImageFormat.JPEG },
                { label: 'PNG', value: ImageFormat.PNG },
                { label: 'WEBP', value: ImageFormat.WEBP },
              ].map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => setOptions({ ...options, format: fmt.value })}
                  className={`py-2 px-3 text-sm rounded border ${
                    options.format === fmt.value
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                      : 'border-gray-600 bg-gray-750 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-300">Dimensiones (px)</label>
              <button
                onClick={() => setOptions({ ...options, maintainAspectRatio: !options.maintainAspectRatio })}
                className={`text-xs p-1 rounded ${
                  options.maintainAspectRatio ? 'text-indigo-400 bg-indigo-400/10' : 'text-gray-500 hover:text-gray-300'
                }`}
                title="Mantener relación de aspecto"
              >
                {options.maintainAspectRatio ? 'Aspecto Bloqueado' : 'Aspecto Libre'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Ancho</label>
                <input
                  type="number"
                  value={options.width}
                  onChange={(e) => handleDimensionChange('width', parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Alto</label>
                <input
                  type="number"
                  value={options.height}
                  onChange={(e) => handleDimensionChange('height', parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Original: {originalDimensions.width} x {originalDimensions.height}
            </p>
          </div>

          {/* Quality Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Calidad</label>
              <span className="text-sm text-indigo-400">{Math.round(options.quality * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={options.quality}
              onChange={(e) => setOptions({ ...options, quality: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <button
            onClick={onProcessLocal}
            disabled={isProcessing}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-lg shadow-indigo-500/20 transition-all flex justify-center items-center mt-auto"
          >
            {isProcessing ? 'Procesando...' : 'Aplicar Cambios'}
          </button>
        </div>
      ) : (
        <div className="space-y-6 flex-1">
          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
            <h3 className="text-indigo-300 font-semibold mb-2 flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              Edición Generativa
            </h3>
            <p className="text-sm text-indigo-200/80">
              Utiliza Gemini 2.5 para transformar tu imagen. Describe cómo quieres modificarla.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Instrucción (Prompt)</label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ej: Conviértelo en un dibujo estilo cyberpunk, o añade un sombrero..."
              className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <button
            onClick={() => onProcessAI(aiPrompt)}
            disabled={isProcessing || !aiPrompt.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-semibold shadow-lg shadow-purple-500/20 transition-all flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando con IA...
              </span>
            ) : (
              'Transformar con IA'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
