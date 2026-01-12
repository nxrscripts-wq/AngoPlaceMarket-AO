import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Image, Plus, ShoppingBag, Phone, Loader2, AlertCircle } from 'lucide-react';
import { Seller, Message } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ChatScreenProps {
  seller: Seller;
  onBack: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ seller, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRealtime, setIsRealtime] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if seller ID is a valid UUID (Real Seller) or Mock ID
  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  useEffect(() => {
    if (isUUID(seller.id) && user) {
      setIsRealtime(true);
      fetchMessages();
      subscribeToMessages();
    } else {
      // Mock Data Fallback
      setMessages([
        { id: '1', senderId: 'seller', text: 'Olá! Sou o gestor da ' + seller.name + '. Como posso ajudar? (Modo Demonstração - Chat Simulado)', timestamp: '10:00' }
      ]);
    }
    scrollToBottom();
  }, [seller.id, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${seller.id}),and(sender_id.eq.${seller.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const mappedMessages: Message[] = data.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id === user.id ? 'user' : 'seller',
          text: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(mappedMessages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const subscribeToMessages = () => {
    if (!user) return;
    const channel = supabase
      .channel(`chat:${user.id}:${seller.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}` // Listen for messages sent TO me
        },
        (payload) => {
          if (payload.new.sender_id === seller.id) {
            // New message from this seller
            const newMessage = payload.new;
            setMessages(prev => [...prev, {
              id: newMessage.id,
              senderId: 'seller',
              text: newMessage.content,
              timestamp: new Date(newMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    if (isRealtime && user) {
      const optimisticMessage: Message = {
        id: Date.now().toString(),
        senderId: 'user',
        text: inputText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, optimisticMessage]);
      setInputText('');

      try {
        const { error } = await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            receiver_id: seller.id,
            content: optimisticMessage.text
          });

        if (error) {
          console.error('Error sending message:', error);
          // Optionally show error state on message
          alert("Erro ao enviar mensagem");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Mock Send
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: 'user',
        text: inputText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, newMessage]);
      setInputText('');

      // Mock Auto-reply
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          senderId: 'seller',
          text: "Obrigado pelo contacto! Isto é uma simulação offline.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <header className="h-16 bg-[#1A1A1A] border-b border-white/5 flex items-center px-4 justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full"><ArrowLeft size={20} /></button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
              <img src={seller.avatar} alt={seller.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2">
                {seller.name}
                {!isRealtime && <span className="bg-white/10 text-[8px] px-1 rounded text-white/50">DEMO</span>}
              </h4>
              <p className="text-[10px] text-[#00FF00] font-bold uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
        </div>
        <button className="p-2 text-white/50 hover:text-white"><Phone size={20} /></button>
      </header>

      <main className="flex-grow p-4 space-y-4 overflow-y-auto no-scrollbar">
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-[#FFD700]" size={24} />
          </div>
        )}

        {!isRealtime && (
          <div className="bg-[#FFD700]/10 border border-[#FFD700]/20 p-3 rounded-xl flex items-center gap-3">
            <AlertCircle size={16} className="text-[#FFD700]" />
            <p className="text-[10px] text-[#FFD700] leading-tight">
              Você está a visualizar um vendedor de demonstração. O chat não está conectado ao servidor real.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderId === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.senderId === 'user'
                ? 'bg-[#FFD700] text-black font-medium rounded-tr-none'
                : 'bg-[#1A1A1A] text-white rounded-tl-none border border-white/5'
              }`}>
              {m.text}
              <p className={`text-[8px] mt-1 ${m.senderId === 'user' ? 'text-black/50' : 'text-white/30'}`}>{m.timestamp}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
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
          className="w-12 h-12 bg-[#FFD700] text-black rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-yellow-500/10"
        >
          <Send size={20} />
        </button>
      </footer>
    </div>
  );
};

export default ChatScreen;
