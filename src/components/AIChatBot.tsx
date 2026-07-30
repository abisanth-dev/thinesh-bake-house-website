import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Bot, Sparkles, X, Send, Loader2, ArrowRight, CornerDownLeft, Eye, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { PRODUCTS } from '../data';

interface AIChatBotProps {
  onProductClick: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  products?: Product[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatBot({ onProductClick, onAddToCart, products: propProducts }: AIChatBotProps) {
  const activeProducts = propProducts && propProducts.length > 0 ? propProducts : PRODUCTS;
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! 🌾 I'm Baker Buddy, your virtual assistant at Thinesh Bake House. I can recommend hot golden savories, guide you through designing a custom celebration cake, check baking schedules, or answer ingredient allergy questions! What fresh treat are you craving today?",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompt starters
  const suggestionStarters = [
    { label: "🎂 Custom Cake Pre-order", prompt: "How do I pre-order a custom celebration cake and get the 10% discount?" },
    { label: "🥚 Best Savory Snacks", prompt: "What savory snacks do you recommend? Tell me about the Egg Puff." },
    { label: "⏰ Daily Baking Times", prompt: "When do fresh buns and pastries hit the shelves in the morning?" },
    { label: "🥜 Allergies & Nuts", prompt: "Do you have peanut-free options? What are your food safety guidelines?" }
  ];

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build full conversation history for the model
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      history.push({ role: 'user', content: textToSend });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: history,
          products: activeProducts // Pass the live active product database for grounding
        })
      });

      if (!response.ok) {
        throw new Error('Chat API response was not OK');
      }

      const data = await response.json();
      
      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply || "I didn't receive a clear response. Let me know if I can help you with something else!",
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      
      // Friendly, non-crashing offline error fallback message
      const errorMsg: Message = {
        id: `msg-error-${Date.now()}`,
        role: 'assistant',
        content: "Oops! 🥖 I had a small hiccup connecting to the bakery backend. Please make sure your Gemini API key is configured in the Secrets settings. In the meantime, feel free to browse our delicious menu tabs directly! 🍰",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Scan reply text to find matching products in our database
  const getSuggestedProducts = (text: string): Product[] => {
    const matched: Product[] = [];
    const normalizedText = text.toLowerCase();
    
    for (const prod of activeProducts) {
      // Search for exact product name inside the text (case-insensitive)
      if (normalizedText.includes(prod.name.toLowerCase())) {
        matched.push(prod);
      }
    }
    
    // Fallback: search for substrings if no exact match (e.g. "egg puff" matching "Ceylon Spicy Egg Puff")
    if (matched.length === 0) {
      for (const prod of PRODUCTS) {
        // Splitting into words and checking if any key words match
        const keywords = prod.name.toLowerCase().split(' ');
        const matchedKeywords = keywords.filter(kw => kw.length > 3 && normalizedText.includes(kw));
        if (matchedKeywords.length >= 2) {
          matched.push(prod);
        }
      }
    }

    // Limit to 2 recommended products to keep the design pristine
    return Array.from(new Set(matched)).slice(0, 2);
  };

  return (
    <>
      {/* Floating Chat Bubble Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative bg-[#0B1354] hover:bg-brand-blue-light text-white p-4 rounded-full shadow-2xl flex items-center justify-center cursor-pointer group"
          id="ai-chatbot-toggle-btn"
          aria-label="Open AI Assistant"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <div className="relative">
              <Bot className="h-6 w-6" />
              <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-gold"></span>
              </span>
            </div>
          )}
          
          {/* Label tooltip */}
          <span className="absolute right-16 bg-[#0B1354] text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-md border border-white/10 translate-x-2 group-hover:translate-x-0">
            Ask Baker Buddy ✨
          </span>
        </motion.button>
      </div>

      {/* Floating Chat Panel Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-24 right-4 sm:right-6 w-[340px] sm:w-[400px] h-[550px] max-h-[80vh] bg-[#FDFBF7] rounded-2xl border border-gray-150/90 shadow-2xl flex flex-col overflow-hidden z-50"
            id="ai-chatbot-drawer"
          >
            {/* Header */}
            <div className="bg-[#0B1354] text-white p-4 flex items-center justify-between border-b border-white/10 relative">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-xl border border-white/20">
                  <Bot className="h-5 w-5 text-brand-gold" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-gold font-mono flex items-center gap-1">
                      <Sparkles className="h-3 w-3 fill-brand-gold" /> AI Assistant
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold tracking-tight">Baker Buddy</h3>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close Chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages Feed Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const suggestions = !isUser ? getSuggestedProducts(msg.content) : [];
                
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    {/* User / Agent icon tag above */}
                    <span className="text-[9px] text-gray-400 font-mono mb-1.5 uppercase tracking-wider px-1">
                      {isUser ? 'You' : 'Baker Buddy'}
                    </span>

                    {/* Chat Bubble Card */}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs md:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#0B1354] text-white rounded-tr-none shadow-sm'
                          : 'bg-white text-gray-800 rounded-tl-none border border-gray-200/80 shadow-xs'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Grounding / Smart Product Recommendations */}
                    {suggestions.length > 0 && (
                      <div className="mt-2.5 w-full max-w-[90%] space-y-2 pl-2">
                        <span className="text-[9px] font-bold text-brand-gold uppercase tracking-widest block font-mono">
                          ⚡ Baker Suggestions
                        </span>
                        {suggestions.map((prod) => (
                          <div
                            key={prod.id}
                            className="bg-white rounded-xl border border-gray-150 p-2.5 flex items-center gap-3 shadow-xs hover:border-brand-gold/40 transition-colors"
                          >
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-extrabold text-[#0B1354] text-xs truncate uppercase tracking-tight">
                                {prod.name}
                              </h4>
                              <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                                Category: {prod.category} • {prod.priceMin.toFixed(2)}/=
                              </p>
                            </div>
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <button
                                onClick={() => onProductClick(prod)}
                                className="p-1.5 rounded-md bg-[#0B1354]/5 text-[#0B1354] hover:bg-[#0B1354] hover:text-white transition-colors cursor-pointer"
                                title="View details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              {prod.isCustomizable !== true && onAddToCart && (
                                <button
                                  onClick={() => onAddToCart(prod)}
                                  className="p-1.5 rounded-md bg-brand-gold/10 text-brand-gold hover:bg-brand-gold hover:text-[#0B1354] transition-colors cursor-pointer"
                                  title="Add to Basket"
                                >
                                  <ShoppingBag className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Loader */}
              {isLoading && (
                <div className="flex flex-col items-start">
                  <span className="text-[9px] text-gray-400 font-mono mb-1.5 uppercase tracking-wider px-1">
                    Baker Buddy
                  </span>
                  <div className="bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-150 px-4 py-3 shadow-xs flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#0B1354]" />
                    <span className="text-xs text-gray-400 font-medium font-mono animate-pulse">
                      Preheating ovens...
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Prompt Suggestion Starters at the top of controls */}
            {messages.length === 1 && (
              <div className="p-3 border-t border-gray-100 bg-gray-50/70">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-2 px-1">
                  💡 Start a Conversation
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {suggestionStarters.map((star, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(star.prompt)}
                      className="w-full text-left bg-white border border-gray-200 hover:border-[#0B1354] hover:bg-indigo-50/20 px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#0B1354] transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <span>{star.label}</span>
                      <ArrowRight className="h-3 w-3 text-gray-300 group-hover:text-[#0B1354] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="p-3 border-t border-gray-150 bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your bakery question..."
                className="flex-1 bg-gray-50 text-xs sm:text-sm rounded-xl px-4 py-2.5 border border-gray-200 focus:outline-none focus:border-[#0B1354] focus:bg-white text-gray-800 transition-all placeholder:text-gray-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`p-2.5 rounded-xl transition-all ${
                  input.trim() && !isLoading
                    ? 'bg-[#0B1354] text-white hover:bg-brand-blue-light cursor-pointer active:scale-95 shadow-md'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
