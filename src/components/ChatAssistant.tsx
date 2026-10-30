import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, RotateCcw, Send, X } from 'lucide-react';
import { Product } from '../types';
import { useSiteSettings } from './SiteSettingsContext';
import { formatMoney } from '../siteSettings';

interface ChatAssistantProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const STARTERS = ['What cakes do you have?', 'Do you deliver?', 'Where are your branches?', 'What are your opening hours?'];

// The assistant ends a reply with [[product:ID]] lines for items it recommends. Pull those out as
// product cards and hide them (including a half-streamed one) from the visible text.
const PRODUCT_MARKER = /\[\[product:([^\]\s]+)\]\]/g;
const splitReply = (content: string) => ({
  text: content.replace(PRODUCT_MARKER, '').replace(/\[\[[^\]]*$/, '').trim(),
  productIds: [...content.matchAll(PRODUCT_MARKER)].map(match => match[1]),
});

export default function ChatAssistant({ products, onProductClick }: ChatAssistantProps) {
  const settings = useSiteSettings();
  const { assistant, business } = settings;
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (!assistant.enabled) return null;

  const updateReply = (id: string, content: string) =>
    setMessages(current => current.map(message => (message.id === id ? { ...message, content } : message)));

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || isSending) return;
    const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: question };
    const replyId = `a-${Date.now()}`;
    const history = [...messages, userMessage];
    setMessages([...history, { id: replyId, role: 'assistant', content: '' }]);
    setInput('');
    setIsSending(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        updateReply(replyId, data?.error || `Sorry, I can’t answer right now. Please call us on ${business.primaryPhone}.`);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let reply = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        updateReply(replyId, reply);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      updateReply(replyId, `Sorry, I couldn’t connect. Please check your internet connection, or call us on ${business.primaryPhone}.`);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsSending(false);
    }
  };

  const restart = () => {
    abortRef.current?.abort();
    setMessages([]);
    setIsSending(false);
    inputRef.current?.focus();
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-2xl"
        aria-label={isOpen ? 'Close chat' : `Chat with ${assistant.name}`}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-24 right-4 z-50 flex h-[min(600px,calc(100dvh-8rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl sm:right-6 sm:w-[380px]"
            aria-label={`Chat with ${assistant.name}`}
          >
            <header className="flex items-center justify-between gap-3 bg-brand-blue px-4 py-3 text-white">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-extrabold">{assistant.name}</h2>
                <p className="text-[11px] text-blue-100/80">{business.name} · usually replies in seconds</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {messages.length > 0 && (
                  <button type="button" onClick={restart} className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white" aria-label="Start a new conversation" title="New conversation">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
                <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white" aria-label="Close chat">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div ref={feedRef} className="flex-1 space-y-3 overflow-y-auto bg-stone-50 px-4 py-4" aria-live="polite">
              <Bubble role="assistant">{assistant.welcomeMessage}</Bubble>

              {messages.map(message => {
                if (message.role === 'user') return <div key={message.id}><Bubble role="user">{message.content}</Bubble></div>;
                const { text, productIds } = splitReply(message.content);
                const suggested = productIds.map(id => products.find(product => product.id === id)).filter((product): product is Product => !!product);
                return (
                  <div key={message.id} className="space-y-2">
                    {text ? <Bubble role="assistant">{text}</Bubble> : <TypingDots />}
                    {suggested.map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => onProductClick(product)}
                        className="flex w-full max-w-[85%] items-center gap-3 rounded-xl border border-stone-200 bg-white p-2 text-left transition hover:border-brand-gold"
                      >
                        <img src={product.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-brand-blue">{product.name}</span>
                          <span className="block text-[11px] text-stone-500">
                            {product.checkoutDisabled ? 'Price updating soon' : formatMoney(product.priceMin, settings)} · View
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}

              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {STARTERS.map(starter => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => send(starter)}
                      className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-blue transition hover:border-brand-blue"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={event => { event.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-stone-200 bg-white p-3">
              <input
                ref={inputRef}
                value={input}
                onChange={event => setInput(event.target.value)}
                maxLength={1500}
                placeholder="Ask about cakes, orders, branches…"
                className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-brand-blue focus:bg-white"
                aria-label="Your message"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue text-white transition hover:bg-brand-blue-light disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="bg-white pb-2 text-center text-[10px] text-stone-400">AI answers can be wrong. Call {business.primaryPhone} to confirm orders.</p>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
        role === 'user' ? 'rounded-br-md bg-brand-blue text-white' : 'rounded-bl-md border border-stone-200 bg-white text-stone-800'
      }`}>
        {children}
      </p>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex">
      <span className="flex gap-1 rounded-2xl rounded-bl-md border border-stone-200 bg-white px-4 py-3.5" aria-label="Typing">
        {[0, 1, 2].map(dot => <span key={dot} className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" style={{ animationDelay: `${dot * 120}ms` }} />)}
      </span>
    </div>
  );
}
