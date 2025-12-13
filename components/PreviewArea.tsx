import React from 'react';
import { Download, FileImage, Image as ImageIcon } from 'lucide-react';

interface PreviewAreaProps {
  originalUrl: string | null;
  processedUrl: string | null;
  processedDimensions: { width: number; height: number };
  onDownload: () => void;
  fileName: string;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({
  originalUrl,
  processedUrl,
  processedDimensions,
  onDownload,
  fileName
}) => {
  if (!originalUrl) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 text-gray-500 p-8 border-2 border-dashed border-gray-800 rounded-xl m-8">
        <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
        <p>Sube una imagen para comenzar</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-950 flex flex-col items-center">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Original */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-medium text-gray-400 flex items-center">
              <FileImage className="w-4 h-4 mr-2" /> Original
            </span>
          </div>
          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800 aspect-square md:aspect-auto flex items-center justify-center relative group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            <img src={originalUrl} alt="Original" className="max-w-full max-h-[500px] object-contain relative z-10" />
          </div>
        </div>

        {/* Processed */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-medium text-indigo-400 flex items-center">
              <SparklesIcon className="w-4 h-4 mr-2" /> Resultado
            </span>
            {processedUrl && (
                <span className="text-xs text-gray-500">
                    {processedDimensions.width}x{processedDimensions.height} px
                </span>
            )}
          </div>
          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-indigo-900/30 aspect-square md:aspect-auto flex items-center justify-center relative">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            {processedUrl ? (
              <img src={processedUrl} alt="Processed" className="max-w-full max-h-[500px] object-contain relative z-10" />
            ) : (
              <div className="text-gray-600 text-sm">Esperando cambios...</div>
            )}
          </div>
          
          {processedUrl && (
            <button
              onClick={onDownload}
              className="mt-4 w-full py-3 bg-white text-gray-900 hover:bg-gray-100 rounded-lg font-bold shadow-lg transition-all flex justify-center items-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Descargar Imagen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper icon
const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

export default PreviewArea;
