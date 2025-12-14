import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Sparkles, Bot, User, Image as ImageIcon } from 'lucide-react';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    attachments?: string[];
}

interface ChatInterfaceProps {
    messages: Message[];
    onSendMessage: (text: string, attachments?: File[]) => void;
    isProcessing: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isProcessing }) => {
    const [input, setInput] = useState('');
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
            const files = Array.from(e.target.files);
            onSendMessage("Añadí esta imagen", files);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900/95 backdrop-blur-md border-r border-white/10">
            {/* Header: Minimalist */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Sparkles size={18} className="text-indigo-400" />
                    </div>
                    <span className="font-medium text-gray-200 tracking-wide text-sm">PixMorph AI</span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4">
                        <div className="w-16 h-16 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-2 animate-pulse">
                            <Sparkles size={32} className="text-indigo-400/80" />
                        </div>
                        <div>
                            <p className="text-lg font-medium text-gray-300">Bienvenido al Estudio</p>
                            <p className="text-sm text-gray-500 mt-1">Arrastra imágenes o describe tu idea.</p>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>

                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-700 border border-gray-600'}`}>
                                    {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-indigo-300" />}
                                </div>

                                {/* Body */}
                                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm break-words max-w-full ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                                            : 'bg-gray-800/80 text-gray-200 rounded-tl-sm border border-white/5'
                                        }`}>
                                        {msg.text}
                                    </div>

                                    {/* Attachments */}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="mt-3 flex gap-2 flex-wrap justify-end">
                                            {msg.attachments.map((att, i) => (
                                                <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10 shadow-lg cursor-zoom-in">
                                                    <img src={att} className="w-24 h-24 object-cover transition-transform group-hover:scale-110" alt="attachment" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Typer Indicator */}
                    {isProcessing && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="flex flex-row items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center shrink-0">
                                    <Bot size={14} className="text-indigo-300" />
                                </div>
                                <div className="flex space-x-1 px-4 py-3 bg-gray-800/50 rounded-2xl rounded-tl-sm">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gray-900 border-t border-white/5">
                <form
                    onSubmit={handleSubmit}
                    className="relative flex items-end gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all shadow-inner"
                >
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-gray-400 hover:text-indigo-300 hover:bg-white/5 rounded-xl transition-colors"
                        title="Adjuntar imagen"
                    >
                        <Paperclip size={18} />
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" multiple onChange={handleFileSelect} />
                    </button>

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe tu imagen..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500/70 resize-none max-h-32 min-h-[44px] py-3 text-sm leading-relaxed"
                        style={{ height: 'auto', minHeight: '44px' }}
                        rows={1}
                    />

                    <button
                        type="submit"
                        disabled={!input.trim() && !isProcessing}
                        className={`p-3 rounded-xl transition-all duration-200 ${input.trim()
                                ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 transform hover:scale-105'
                                : 'bg-transparent text-gray-600 cursor-not-allowed'
                            }`}
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;
