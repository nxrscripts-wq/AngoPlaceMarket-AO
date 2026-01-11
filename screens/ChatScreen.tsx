
import React, { useState } from 'react';
import { ArrowLeft, Send, Image, Plus, ShoppingBag, Phone } from 'lucide-react';
import { Seller, Message } from '../types';

interface ChatScreenProps {
  seller: Seller;
  onBack: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ seller, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', senderId: 'seller', text: 'Olá! Sou o gestor da ' + seller.name + '. Como posso ajudar?', timestamp: '10:00' }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMessage]);
    setInputText('');
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <header className="h-16 bg-[#1A1A1A] border-b border-white/5 flex items-center px-4 justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full"><ArrowLeft size={20} /></button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img src={seller.avatar} alt={seller.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="text-sm font-bold">{seller.name}</h4>
              <p className="text-[10px] text-[#00FF00] font-bold uppercase tracking-widest">Online</p>
            </div>
          </div>
        </div>
        <button className="p-2 text-white/50 hover:text-white"><Phone size={20} /></button>
      </header>

      <main className="flex-grow p-4 space-y-4 overflow-y-auto no-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderId === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              m.senderId === 'user' 
              ? 'bg-[#FFD700] text-black font-medium rounded-tr-none' 
              : 'bg-[#1A1A1A] text-white rounded-tl-none border border-white/5'
            }`}>
              {m.text}
              <p className={`text-[8px] mt-1 ${m.senderId === 'user' ? 'text-black/50' : 'text-white/30'}`}>{m.timestamp}</p>
            </div>
          </div>
        ))}
      </main>

      <footer className="p-4 bg-[#0B0B0B] border-t border-white/10 flex items-center gap-2">
        <button className="p-2 text-white/30 hover:text-white"><Plus size={24} /></button>
        <div className="flex-grow bg-[#1A1A1A] h-12 rounded-2xl flex items-center px-4 gap-2 border border-white/5">
          <input 
            type="text" 
            placeholder="Mensagem..." 
            className="bg-transparent border-none outline-none flex-grow text-sm text-white"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="text-white/30"><Image size={20} /></button>
        </div>
        <button 
          onClick={handleSend}
          className="w-12 h-12 bg-[#FFD700] text-black rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        >
          <Send size={20} />
        </button>
      </footer>
    </div>
  );
};

export default ChatScreen;
