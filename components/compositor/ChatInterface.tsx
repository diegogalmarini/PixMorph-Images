import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Sparkles, Bot, User } from 'lucide-react';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    attachments?: string[]; // URLs of attached images
}

interface ChatInterfaceProps {
    messages: Message[];
    onSendMessage: (text: string, attachments?: File[]) => void;
    isProcessing: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isProcessing }) => {
    const [input, setInput] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isProcessing) return;
        onSendMessage(input);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // For now, treat file selection as sending an image immediately with a default prompt?
            // Or just pass it up.
            // Let's assume the user wants to add it to the canvas.
            const files = Array.from(e.target.files);
            onSendMessage("Añadí esta imagen", files);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="font-semibold text-gray-200">PixMorph Assistant</span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 opacity-60">
                        <Sparkles size={48} className="mb-4 text-indigo-500" />
                        <p className="text-lg font-medium">¿Qué quieres crear hoy?</p>
                        <p className="text-xs max-w-xs mt-2">Prueba: "Añade un bosque", "Quita el fondo de la persona" o "Haz que parezca de noche".</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>

                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>

                            {/* Bubble */}
                            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`px-4 py-2 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-gray-800 text-gray-200 rounded-tl-sm'}`}>
                                    {msg.text}
                                </div>
                                {/* Attachments */}
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-2 flex gap-2 flex-wrap">
                                        {msg.attachments.map((att, i) => (
                                            <img key={i} src={att} className="w-16 h-16 object-cover rounded-lg border border-gray-700 data-[loaded=true]:fade-in" alt="attachment" />
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                ))}
                {isProcessing && (
                    <div className="flex justify-start">
                        <div className="flex flex-row items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0"><Bot size={16} /></div>
                            <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm text-gray-400 text-sm flex items-center gap-2">
                                <Sparkles size={14} className="animate-spin text-emerald-400" />
                                Pensando...
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gray-900 border-t border-gray-800">
                <form
                    onSubmit={handleSubmit}
                    className="relative flex items-end gap-2 bg-gray-800/50 p-2 rounded-xl border border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all"
                >
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
                        title="Adjuntar imagen"
                    >
                        <Paperclip size={20} />
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" multiple onChange={handleFileSelect} />
                    </button>

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe tu imagen o pide cambios..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 resize-none max-h-32 min-h-[40px] py-2 text-sm"
                        rows={1}
                        style={{ height: 'auto', minHeight: '40px' }}
                    />

                    <button
                        type="submit"
                        disabled={!input.trim() && !isProcessing}
                        className={`p-2 rounded-lg transition-all ${input.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                    >
                        <Send size={18} />
                    </button>
                </form>
                <div className="text-center mt-2 text-[10px] text-gray-600">
                    PixMorph AI puede cometer errores. Revisa el resultado.
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
