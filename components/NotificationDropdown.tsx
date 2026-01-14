import React from 'react';
import { Bell, ShoppingBag, Info, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { AppNotification, NotificationType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

interface NotificationDropdownProps {
    notifications: AppNotification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onClose
}) => {
    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'order': return <ShoppingBag className="text-blue-500" size={18} />;
            case 'success': return <CheckCircle className="text-green-500" size={18} />;
            case 'warning': return <AlertTriangle className="text-yellow-500" size={18} />;
            case 'error': return <AlertTriangle className="text-red-500" size={18} />;
            default: return <Info className="text-[#FFD700]" size={18} />;
        }
    };

    return (
        <div className="absolute top-16 right-0 w-80 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#FFD700]">Notificações</h3>
                <button
                    onClick={onMarkAllAsRead}
                    className="text-[10px] font-bold text-white/40 hover:text-white transition-colors"
                >
                    Marcar todas como lidas
                </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                    notifications.map((n) => (
                        <div
                            key={n.id}
                            onClick={() => onMarkAsRead(n.id)}
                            className={`p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer relative ${!n.is_read ? 'bg-[#FFD700]/5' : ''}`}
                        >
                            {!n.is_read && (
                                <div className="absolute top-4 right-4 w-2 h-2 bg-[#C00000] rounded-full"></div>
                            )}
                            <div className="flex gap-3">
                                <div className="shrink-0 mt-1">
                                    {getIcon(n.type)}
                                </div>
                                <div className="space-y-1">
                                    <p className={`text-xs font-bold ${!n.is_read ? 'text-white' : 'text-white/60'}`}>{n.title}</p>
                                    <p className="text-[11px] text-white/40 leading-relaxed">{n.message}</p>
                                    <div className="flex items-center gap-1 mt-2 text-[9px] text-white/20 uppercase font-black">
                                        <Clock size={10} />
                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pt })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-10 text-center">
                        <Bell size={40} className="mx-auto text-white/5 mb-3" />
                        <p className="text-xs text-white/20 font-bold uppercase tracking-widest italic">Sem notificações por agora</p>
                    </div>
                )}
            </div>

            <div className="p-3 bg-black/40 text-center border-t border-white/5">
                <button
                    onClick={onClose}
                    className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-[#FFD700]"
                >
                    Fechar
                </button>
            </div>
        </div>
    );
};

export default NotificationDropdown;
