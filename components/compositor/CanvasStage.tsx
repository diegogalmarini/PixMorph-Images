import React, { useEffect, useRef } from 'react';
import { Stage, Layer as KonvaLayer, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import { Layer } from '../../types';

interface CanvasStageProps {
    layers: Layer[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onChange: (id: string, newAttrs: Partial<Layer>) => void;
}

const StartImage: React.FC<{ layer: Layer; isSelected: boolean; onSelect: () => void; onChange: (newAttrs: any) => void }> = ({
    layer,
    isSelected,
    onSelect,
    onChange,
}) => {
    const [image] = useImage(layer.src);
    const shapeRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    useEffect(() => {
        if (isSelected) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    if (!layer.visible) return null;

    return (
        <>
            <KonvaImage
                onClick={onSelect}
                onTap={onSelect}
                ref={shapeRef}
                image={image}
                x={layer.x}
                y={layer.y}
                rotation={layer.rotation}
                scaleX={layer.scaleX}
                scaleY={layer.scaleY}
                draggable
                onDragEnd={(e) => {
                    onChange({
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={(e) => {
                    const node = shapeRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();

                    // Reset scale to 1 to avoid side effects with future resizing? 
                    // Default Konva behavior is to keep scale
                    onChange({
                        x: node.x(),
                        y: node.y(),
                        rotation: node.rotation(),
                        scaleX,
                        scaleY,
                    });
                }}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        // Limit minimum size
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </>
    );
};

const CanvasStage: React.FC<CanvasStageProps> = ({ layers, selectedId, onSelect, onChange }) => {
    // Handle click on empty stage to deselect
    const checkDeselect = (e: any) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            onSelect(null);
        }
    };

    return (
        <div className="w-full h-full bg-gray-900 overflow-hidden relative checkerboard-background">
            <Stage
                width={800} // Dynamic sizing TODO
                height={600}
                onMouseDown={checkDeselect}
                onTouchStart={checkDeselect}
                className="mx-auto mt-10 shadow-2xl border border-gray-700 bg-white"
            >
                <KonvaLayer>
                    {/* Background Color rect? */}
                    {layers.map((layer, i) => (
                        <StartImage
                            key={layer.id}
                            layer={layer}
                            isSelected={layer.id === selectedId}
                            onSelect={() => onSelect(layer.id)}
                            onChange={(newAttrs) => onChange(layer.id, newAttrs)}
                        />
                    ))}
                </KonvaLayer>
            </Stage>
        </div>
    );
};

export default CanvasStage;
