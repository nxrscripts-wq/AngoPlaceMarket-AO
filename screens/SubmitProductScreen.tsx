
import React, { useState, useRef } from 'react';
import { ArrowLeft, Camera, Package, Info, CheckCircle2, ChevronRight, AlertTriangle, X, ShieldCheck, Hash, Upload, Loader2 } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface SubmitProductScreenProps {
  onBack: () => void;
  user: User;
}

interface Toast {
  message: string;
  type: 'error' | 'success';
  id: number;
}

interface FormErrors {
  name?: boolean;
  price?: boolean;
  category?: boolean;
  description?: boolean;
  stock?: boolean;
  image?: boolean;
}

const SubmitProductScreen: React.FC<SubmitProductScreenProps> = ({ onBack, user }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Eletrónicos');
  const [stock, setStock] = useState('0');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'error' | 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      if (errors.image) setErrors({ ...errors, image: false });
      showToast("Imagem selecionada!", "success");
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!imageFile) {
      newErrors.image = true;
      showToast("Por favor, selecione uma imagem para o produto.", "error");
      isValid = false;
    }

    if (name.trim().length < 5) {
      newErrors.name = true;
      showToast("O nome do produto deve ter pelo menos 5 caracteres.", "error");
      isValid = false;
    }

    const numPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      newErrors.price = true;
      showToast("Insira um preço válido (apenas números maiores que zero).", "error");
      isValid = false;
    }

    const numStock = parseInt(stock);
    if (stock === '' || isNaN(numStock) || numStock < 0) {
      newErrors.stock = true;
      showToast("A quantidade em estoque deve ser um número válido (mínimo 0).", "error");
      isValid = false;
    }

    if (description.trim().length < 20) {
      newErrors.description = true;
      showToast("A descrição deve ser detalhada (mínimo 20 caracteres).", "error");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !imageFile) return;

    setIsSubmitting(true);

    try {
      // 1. Upload image to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error("Failed to get public URL for image");

      // 3. Save product data to Database
      const numPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
      const numStock = parseInt(stock);

      const { error: dbError } = await supabase
        .from('products')
        .insert({
          name,
          price: numPrice,
          description,
          category,
          image: publicUrl,
          stock: numStock,
          seller_id: user.id,
          status: 'PENDENTE'
        });

      if (dbError) throw dbError;

      setIsDone(true);
      showToast("Produto enviado para análise com sucesso!", "success");
    } catch (err: any) {
      console.error("Detailed submission error:", err);
      const errorMessage = err.message || JSON.stringify(err) || "Erro desconhecido ao submeter produto.";
      showToast(errorMessage.substring(0, 100), "error"); // Limit toast length
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-[#FFD700] rounded-full flex items-center justify-center shadow-2xl shadow-[#FFD700]/20">
          <CheckCircle2 size={48} className="text-black" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black italic uppercase text-white">Sucesso Absoluto!</h2>
          <p className="text-white/40 text-sm max-w-xs mx-auto">
            O seu produto <span className="text-white font-bold">"{name}"</span> foi submetido. O tempo médio de aprovação em Angola é de 4 horas.
          </p>
        </div>
        <button
          onClick={onBack}
          className="bg-[#FFD700] text-black px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white transition-all active:scale-95 shadow-lg"
        >
          Voltar ao Meu Perfil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col relative">
      <header className="p-4 border-b border-white/5 flex items-center gap-4 sticky top-0 bg-[#0B0B0B]/90 backdrop-blur-md z-40">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-xl text-white hover:text-[#FFD700] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col">
          <h1 className="text-lg font-black italic uppercase tracking-tighter">Vender Produto</h1>
          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Marketplace Luanda</p>
        </div>
      </header>

      <div className="fixed top-24 left-0 right-0 px-4 space-y-2 z-[100] pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-4 p-5 rounded-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-10 duration-500 bg-[#121212] ${toast.type === 'success'
              ? 'border-[#FFD700]/50 text-[#FFD700]'
              : 'border-[#C00000]/50 text-[#C00000]'
              }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-[#FFD700]/10' : 'bg-[#C00000]/10'}`}>
                {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              </div>
              <p className="text-xs font-black uppercase tracking-tight leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-2 hover:bg-white/5 rounded-full transition-colors opacity-40 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8 pb-32">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#FFD700]">
              <Camera size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest">Imagem do Produto</h3>
            </div>
            {imagePreview && (
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="text-[9px] font-black uppercase text-[#C00000]/60 hover:text-[#C00000]"
              >
                Remover
              </button>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 overflow-hidden transition-all border-2 ${imagePreview
                ? 'border-[#FFD700] bg-black'
                : errors.image
                  ? 'border-[#C00000] bg-[#C00000]/5'
                  : 'border-dashed border-white/10 bg-[#1A1A1A] hover:border-[#FFD700]/50 hover:bg-[#222]'
                }`}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover animate-in fade-in duration-300" />
              ) : (
                <>
                  <Camera size={24} className={`transition-colors ${errors.image ? 'text-[#C00000]' : 'text-white/20'}`} />
                  <span className={`text-[10px] font-black ${errors.image ? 'text-[#C00000]' : 'text-white/20'}`}>UPLOAD</span>
                </>
              )}
            </button>

            {[1, 2].map(i => (
              <div key={i} className="aspect-square bg-[#1A1A1A] rounded-2xl border border-white/5 opacity-40 flex items-center justify-center">
                <Package size={20} className="text-white/5" />
              </div>
            ))}
          </div>
          <p className="text-[9px] text-white/30 uppercase font-bold text-center">A primeira imagem será o destaque do anúncio</p>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-2 text-[#FFD700]">
            <Info size={18} />
            <h3 className="text-xs font-black uppercase tracking-widest">Especificações Técnicas</h3>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Nome do Item</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: false });
                }}
                placeholder="Ex: Gerador Honda 5KVA Silencioso"
                className={`w-full bg-[#1A1A1A] border rounded-2xl p-4 text-sm font-bold outline-none transition-all placeholder:text-white/10 ${errors.name ? 'border-[#C00000] ring-2 ring-[#C00000]/10' : 'border-white/5 focus:border-[#FFD700]'
                  }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Preço (Kz)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      if (errors.price) setErrors({ ...errors, price: false });
                    }}
                    placeholder="0.00"
                    className={`w-full bg-[#1A1A1A] border rounded-2xl p-4 pl-4 text-sm font-bold outline-none transition-all ${errors.price ? 'border-[#C00000] ring-2 ring-[#C00000]/10' : 'border-white/5 focus:border-[#FFD700]'
                      }`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Estoque Disponível</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => {
                      setStock(e.target.value);
                      if (errors.stock) setErrors({ ...errors, stock: false });
                    }}
                    className={`w-full bg-[#1A1A1A] border rounded-2xl p-4 pl-12 text-sm font-bold outline-none transition-all ${errors.stock ? 'border-[#C00000] ring-2 ring-[#C00000]/10' : 'border-white/5 focus:border-[#FFD700]'
                      }`}
                  />
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD700]/40" size={16} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Categoria Principal</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:border-[#FFD700] transition-all appearance-none cursor-pointer"
                >
                  <option>Eletrónicos</option>
                  <option>Moda</option>
                  <option>Casa e Lazer</option>
                  <option>Peças Auto</option>
                  <option>Energia Solar</option>
                </select>
                <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-white/20 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Descrição Detalhada</label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors({ ...errors, description: false });
                }}
                placeholder="Descreva o estado do item, se tem garantia, local de entrega..."
                className={`w-full bg-[#1A1A1A] border rounded-2xl p-4 text-sm font-bold outline-none transition-all resize-none placeholder:text-white/10 ${errors.description ? 'border-[#C00000] ring-2 ring-[#C00000]/10' : 'border-white/5 focus:border-[#FFD700]'
                  }`}
              />
              <div className="flex justify-between items-center px-1">
                <p className="text-[9px] text-white/20 uppercase font-bold">Mínimo 20 caracteres</p>
                <p className={`text-[9px] font-black ${description.length < 20 ? 'text-[#C00000]' : 'text-[#FFD700]'}`}>
                  {description.length} caracteres
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="bg-[#1A1A1A] border border-white/5 p-5 rounded-3xl flex gap-4 items-start shadow-xl">
          <div className="bg-[#C00000] p-2 rounded-xl text-white">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] font-black uppercase text-white tracking-widest">Compromisso AngoPlace</h4>
            <p className="text-[10px] text-white/40 font-medium leading-relaxed">
              Todos os anúncios são verificados para evitar burlas. Ao submeter, você concorda com os termos de uso do marketplace líder em Angola.
            </p>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-30">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#FFD700] text-black h-16 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-white active:scale-95 transition-all shadow-2xl shadow-[#FFD700]/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <span>SUBMETER ANÚNCIO</span>
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitProductScreen;
