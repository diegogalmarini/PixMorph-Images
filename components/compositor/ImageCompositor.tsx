import React from 'react';
import { useCompositor } from '../../hooks/useCompositor';
import CanvasStage from './CanvasStage';
import { Layers, ImagePlus, Download, Trash2, Wand2 } from 'lucide-react';
import imglyRemoveBackground from '@imgly/background-removal';

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
            const blob = await imglyRemoveBackground(layer.src);
            const url = URL.createObjectURL(blob);
            updateLayer(selectedId, { src: url });
        } catch (error) {
            console.error("Failed to remove background", error);
            alert("Error removing background");
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
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
            {/* Sidebar / Toolbar */}
            <div className="w-16 md:w-20 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 space-y-4 z-10">
                <label className="p-3 bg-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-700 transition shadow-lg" title="Add Image">
                    <ImagePlus size={24} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                </label>

                <button
                    className={`p-3 rounded-lg transition ${selectedId ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                    disabled={!selectedId}
                    title="Remove Background"
                    onClick={handleRemoveBackground}
                >
                    <Wand2 size={24} />
                </button>

                <button
                    className={`p-3 rounded-lg transition ${selectedId ? 'bg-red-900/50 hover:bg-red-900 text-red-200' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                    disabled={!selectedId}
                    title="Delete Layer"
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
            <div className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col z-10">
                <div className="p-4 border-b border-gray-700 font-bold flex items-center">
                    <Layers className="mr-2" size={18} /> Capas
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {[...layers].reverse().map((layer) => (
                        <div
                            key={layer.id}
                            onClick={() => setSelectedId(layer.id)}
                            className={`p-2 rounded cursor-pointer flex items-center space-x-2 ${selectedId === layer.id ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}
                        >
                            <img src={layer.src} className="w-8 h-8 object-cover rounded bg-white" alt="layer thumb" />
                            <span className="text-sm truncate flex-1">{layer.name}</span>
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
