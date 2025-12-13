import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Layer } from '../types';

export const useCompositor = () => {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const stageRef = useRef<any>(null);

    const addLayer = useCallback((file: File) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.src = url;
        img.onload = () => {
            const newLayer: Layer = {
                id: uuidv4(),
                type: 'image',
                src: url,
                x: 50, // Default offset
                y: 50,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                width: img.width,
                height: img.height,
                zIndex: layers.length,
                visible: true,
                name: file.name
            };
            setLayers((prev) => [...prev, newLayer]);
            setSelectedId(newLayer.id);
        };
    }, [layers.length]);

    const updateLayer = useCallback((id: string, newAttrs: Partial<Layer>) => {
        setLayers((prev) =>
            prev.map((layer) => (layer.id === id ? { ...layer, ...newAttrs } : layer))
        );
    }, []);

    const removeLayer = useCallback((id: string) => {
        setLayers((prev) => prev.filter((l) => l.id !== id));
        if (selectedId === id) setSelectedId(null);
    }, [selectedId]);

    return {
        layers,
        setLayers,
        selectedId,
        setSelectedId,
        addLayer,
        updateLayer,
        removeLayer,
        stageRef
    };
};
