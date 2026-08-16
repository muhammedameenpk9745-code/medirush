'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Clock, ShieldCheck, User, X, Wifi } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface OrderChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  deliveryPartnerId?: string | null;
  riderName?: string;
}

export const OrderChatModal: React.FC<OrderChatModalProps> = ({
  isOpen,
  onClose,
  orderId,
  deliveryPartnerId,
  riderName = 'Delivery Partner',
}) => {
  const { user } = useAuth();
  const supabase = createClient();

  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'SUBSCRIBED' | 'CONNECTING' | 'CLOSED'>('CONNECTING');

  const fetchOrCreateChat = useCallback(async () => {
    if (!deliveryPartnerId || !user) return;
    setIsLoading(true);

    try {
      // 1. Check if chat already exists for this order
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();

      let activeChatId = existingChat?.id;

      // 2. If chat does not exist, fetch order details to resolve customer_id & delivery_partner_id
      if (!activeChatId) {
        const { data: orderRecord } = await supabase
          .from('orders')
          .select('customer_id, delivery_partner_id')
          .eq('id', orderId)
          .single();

        if (orderRecord && orderRecord.customer_id) {
          const { data: newChat } = await supabase
            .from('chats')
            .insert({
              order_id: orderId,
              customer_id: orderRecord.customer_id,
              delivery_partner_id: orderRecord.delivery_partner_id || deliveryPartnerId,
              status: 'ACTIVE',
            })
            .select()
            .single();

          if (newChat) activeChatId = newChat.id;
        }
      }

      if (activeChatId) {
        setChatId(activeChatId);

        // 3. Fetch Existing Messages
        const { data: msgData } = await supabase
          .from('chat_messages')
          .select('*, profiles(full_name)')
          .eq('chat_id', activeChatId)
          .order('created_at', { ascending: true });

        if (msgData) setMessages(msgData);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [deliveryPartnerId, orderId, supabase, user]);

  useEffect(() => {
    if (isOpen && deliveryPartnerId) {
      fetchOrCreateChat();
    }
  }, [deliveryPartnerId, fetchOrCreateChat, isOpen]);

  // Supabase Realtime Subscription for Instant Live Messages
  useEffect(() => {
    if (!chatId || !isOpen) return;

    setConnectionStatus('CONNECTING');

    const channel = supabase
      .channel(`chat-room-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => {
            // Deduplicate message if already added locally
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('SUBSCRIBED');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('CLOSED');
        } else {
          setConnectionStatus('CONNECTING');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, isOpen, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user) return;

    const messageText = newMessage;
    setNewMessage('');

    const { data: msg } = await supabase
      .from('chat_messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        message: messageText,
      })
      .select('*, profiles(full_name)')
      .single();

    if (msg) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Chat with Delivery Partner (${riderName})`}>
      {!deliveryPartnerId ? (
        <div className="p-8 text-center space-y-3 text-xs">
          <Clock className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
          <p className="font-bold text-slate-900 text-sm">Delivery Rider Not Yet Assigned</p>
          <p className="text-slate-500 leading-relaxed max-w-xs mx-auto">
            Chat will become available as soon as a delivery partner accepts your order dispatch.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connection Status Badge */}
          <div className="flex items-center justify-between text-[11px] bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-600 font-medium">Order Chat ID: {chatId ? `${chatId.substring(0, 8)}...` : 'Connecting...'}</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span className={`w-2 h-2 rounded-full ${connectionStatus === 'SUBSCRIBED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className={connectionStatus === 'SUBSCRIBED' ? 'text-emerald-700' : 'text-amber-700'}>
                {connectionStatus === 'SUBSCRIBED' ? 'Live Realtime' : 'Connecting WebSocket...'}
              </span>
            </div>
          </div>

          {/* Messages Container */}
          <div className="h-64 overflow-y-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
            {isLoading ? (
              <p className="text-center text-slate-400 italic py-8">Loading chat messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-slate-400 italic py-8">No messages yet. Type below to message your delivery partner in real time.</p>
            ) : (
              messages.map((m) => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        isMe
                          ? 'bg-brand-600 text-white rounded-br-none'
                          : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-xs'
                      }`}
                    >
                      <p className="text-[10px] font-bold opacity-80 pb-0.5">{isMe ? 'You' : riderName}</p>
                      <p>{m.message}</p>
                      <p className="text-[9px] opacity-60 text-right pt-1">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Send Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder="Type message to rider..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button variant="primary" size="md" type="submit" leftIcon={<Send className="w-4 h-4" />}>
              Send
            </Button>
          </form>
        </div>
      )}
    </Modal>
  );
};
