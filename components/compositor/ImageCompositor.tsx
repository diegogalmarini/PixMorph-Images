import React, { useState, useCallback } from 'react';
import { useCompositor } from '../../hooks/useCompositor';
import CanvasStage from './CanvasStage';
import { Layers, Download, Trash2, Wand2 } from 'lucide-react';
import { editImageWithAI } from '../../services/geminiService';
import ChatInterface, { Message } from './ChatInterface';
import { v4 as uuidv4 } from 'uuid';

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

  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', text: '¡Hola! Soy tu asistente de diseño. Arrastra imágenes o descríbeme qué quieres crear.' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Logic Helpers ---

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        addLayer(file);
        addMessage('user', `He añadido la imagen: ${file.name}`);
        addMessage('assistant', 'Imagen añadida al lienzo.');
      }
    });
  };

  const addMessage = (role: 'user' | 'assistant', text: string, attachments?: string[]) => {
    setMessages(prev => [...prev, { id: uuidv4(), role, text, attachments }]);
  };

  const handleRemoveBackground = async (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return false;

    try {
      // @ts-ignore
      const imgly = await import('@imgly/background-removal');
      const removeBackground = imgly.default || imgly.removeBackground || imgly;

      if (typeof removeBackground !== 'function') throw new Error("Bg removal lib error");

      const blob = await removeBackground(layer.src);
      const url = URL.createObjectURL(blob);
      updateLayer(layerId, { src: url });
      return true;
    } catch (error) {
      console.error("Bg remove fail", error);
      return false;
    }
  };

  const handleGenerativeIntegration = async (prompt: string) => {
    if (!stageRef.current) return false;

    try {
      // 1. Capture clean state
      const currentSelection = selectedId;
      setSelectedId(null);
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for deselect render

      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 1.5 });

      // 2. AI Gen
      const resultUrl = await editImageWithAI(dataUrl, prompt);

      // 3. Add Layer
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const file = new File([blob], "AI_Gen.png", { type: "image/png" });
      addLayer(file);

      return true;
    } catch (error) {
      console.error("Gen fail", error);
      return false;
    }
  };

  // --- Main Chat Handler ---
  const handleSendMessage = async (text: string, files?: File[]) => {
    // 1. User Message
    const attachmentUrls = files ? files.map(f => URL.createObjectURL(f)) : [];
    addMessage('user', text, attachmentUrls);
    setIsProcessing(true);

    try {
      // 2. Handle Attachments
      if (files && files.length > 0) {
        files.forEach(f => addLayer(f));
        addMessage('assistant', `Añadí ${files.length} imagen(es) al lienzo.`);
        setIsProcessing(false);
        return;
      }

      // 3. Handle Text Commands (Simple Heuristic / Router)
      const lowerText = text.toLowerCase();

      // Case A: Background Removal intent
      if (lowerText.includes('quita') && lowerText.includes('fondo')) {
        if (selectedId) {
          const success = await handleRemoveBackground(selectedId);
          if (success) addMessage('assistant', 'Fondo eliminado de la capa seleccionada.');
          else addMessage('assistant', 'Hubo un error al quitar el fondo.');
        } else {
          addMessage('assistant', 'Por favor, selecciona primero una imagen en el lienzo (haz clic en ella) para quitarle el fondo.');
        }
      }
      // Case B: Delete intent
      else if (lowerText.includes('borra') || lowerText.includes('elimina')) {
        if (selectedId) {
          removeLayer(selectedId);
          addMessage('assistant', 'Capa eliminada.');
        } else {
          addMessage('assistant', 'Selecciona una capa primero para borrarla.');
        }
      }
      // Case C: Generative intent (Default fallback for descriptions)
      else {
        // Assume it's a creative prompt
        const success = await handleGenerativeIntegration(text);
        if (success) addMessage('assistant', 'Aquí tienes el resultado integrado. Se ha añadido como una nueva capa.');
        else addMessage('assistant', 'Lo siento, no pude generar esa integración. Verifica tu API Key o inténtalo de nuevo.');
      }

    } catch (err) {
      addMessage('assistant', 'Ocurrió un error inesperado.');
    } finally {
      setIsProcessing(false);
    }
  };


  const handleExport = () => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = 'pixmorph_composition.png';
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addMessage('assistant', 'Imagen exportada satisfactoriamente. 🎨');
    }
  };

  return (
    <div className="flex h-full bg-gray-950 text-white overflow-hidden font-sans">

      {/* LEFT: Chat Interface (30% width, min 300px) */}
      <div className="w-[30%] min-w-[320px] max-w-[450px] flex flex-col h-full bg-gray-900 border-r border-gray-800 z-10 shadow-xl">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
        />
      </div>

      {/* RIGHT: Canvas & Tools */}
      <div className="flex-1 relative bg-gray-950 flex flex-col">

        {/* Top Toolbar (Floating) */}
        <div className="absolute top-4 right-4 flex space-x-2 z-20">
          <button
            onClick={handleExport}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg border border-gray-700 flex items-center text-sm font-medium transition-all"
          >
            <Download size={16} className="mr-2" /> Exportar
          </button>
        </div>

        {/* Canvas Area */}
        <div
          className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Center the canvas visually */}
          <div className="shadow-2xl border border-gray-800 bg-white">
            <CanvasStage
              layers={layers}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={updateLayer}
            />
          </div>
        </div>

        {/* Floating Context Bar (Bottom Centered or near selection? - Lets stick to bottom for simplicity) */}
        {selectedId && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full shadow-2xl border border-gray-700 flex items-center space-x-4 z-20 animate-fade-in-up">
            <span className="text-xs font-semibold uppercase text-gray-400">Selección</span>
            <div className="h-4 w-px bg-gray-600"></div>
            <button
              onClick={() => handleRemoveBackground(selectedId).then(ok => ok && addMessage('assistant', 'Fondo eliminado.'))}
              className="hover:text-indigo-400 transition-colors flex items-center text-sm"
              title="Quitar Fondo"
            >
              <Wand2 size={16} className="mr-1" /> Mágia
            </button>
            <button
              onClick={() => { removeLayer(selectedId); addMessage('assistant', 'Elemento borrado.'); }}
              className="hover:text-red-400 transition-colors flex items-center text-sm"
              title="Borrar"
            >
              <Trash2 size={16} className="mr-1" /> Borrar
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default ImageCompositor;
