'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  quickActions?: { id: string; label: string; action: string }[];
}

interface ChatWidgetProps {
  agentId:        string;
  primaryColor?:  string;
  welcomeMessage?: string;
  agentName?:     string;
}

export function ChatWidget({
  agentId,
  primaryColor  = '#4F46E5',
  welcomeMessage = "Hi! How can I help you today?",
  agentName     = 'AI Assistant',
}: ChatWidgetProps) {
  const [isOpen, setIsOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id:      'welcome',
      role:    'assistant',
      content: welcomeMessage,
    },
  ]);
  const [input, setInput]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [email, setEmail]       = useState('');
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [hasCollectedEmail, setHasCollectedEmail] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Show email prompt after 2 messages if not collected
  useEffect(() => {
    if (messageCount >= 2 && !hasCollectedEmail && !showEmailPrompt) {
      setShowEmailPrompt(true);
    }
  }, [messageCount, hasCollectedEmail, showEmailPrompt]);

  const sendMessage = useCallback(async (overrideMessage?: string) => {
    const messageText = overrideMessage ?? input.trim();
    if (!messageText || isLoading) return;

    // Add user message to UI immediately
    const userMsg: Message = {
      id:      Date.now().toString(),
      role:    'user',
      content: messageText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setMessageCount((c) => c + 1);

    try {
      const res = await fetch('/api/agent/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          message:   messageText,
          sessionId: sessionId || undefined,
          email:     hasCollectedEmail ? email : undefined,
        }),
      });

      const data = await res.json();

      // Store sessionId for conversation continuity
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      const assistantMsg: Message = {
        id:           (Date.now() + 1).toString(),
        role:         'assistant',
        content:      data.message ?? "I'm here to help!",
        quickActions: data.quickActions,
      };
      setMessages((prev) => [...prev, assistantMsg]);

    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id:      (Date.now() + 1).toString(),
          role:    'assistant',
          content: 'Sorry, I had trouble connecting. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, agentId, sessionId, hasCollectedEmail, email]);

  const handleEmailSubmit = () => {
    if (!email || !email.includes('@')) return;
    setHasCollectedEmail(true);
    setShowEmailPrompt(false);
    sendMessage(`My email is ${email}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[360px] rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col"
            style={{ height: '520px' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{agentName}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-xs text-white/80">Online · Powered by Fuelo Tehnologies</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-white/80 hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      msg.role === 'user'
                        ? 'bg-gray-300'
                        : 'text-white'
                    }`}
                    style={
                      msg.role === 'assistant'
                        ? { backgroundColor: primaryColor }
                        : {}
                    }
                  >
                    {msg.role === 'user'
                      ? <User className="h-4 w-4 text-gray-600" />
                      : <Bot  className="h-4 w-4 text-white" />
                    }
                  </div>

                  {/* Bubble */}
                  <div className="max-w-[78%] space-y-1">
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'text-white rounded-br-sm'
                          : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                      }`}
                      style={
                        msg.role === 'user'
                          ? { backgroundColor: primaryColor }
                          : {}
                      }
                    >
                      {msg.content}
                    </div>

                    {/* Quick action buttons */}
                    {msg.quickActions && msg.quickActions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {msg.quickActions.map((qa) => (
                          <button
                            key={qa.id}
                            className="text-xs rounded-full border border-gray-200 bg-white px-3 py-1 text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                            onClick={() => sendMessage(qa.label)}
                          >
                            {qa.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-end gap-2">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl rounded-bl-sm bg-white border border-gray-100 shadow-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Email capture prompt */}
            {showEmailPrompt && (
              <div className="shrink-0 border-t bg-indigo-50 px-4 py-3">
                <p className="text-xs text-indigo-700 font-medium mb-2">
                  📧 Share your email to continue the conversation
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                    placeholder="you@company.com"
                    className="flex-1 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    onClick={handleEmailSubmit}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Submit
                  </button>
                </div>
                <button
                  onClick={() => { setShowEmailPrompt(false); setHasCollectedEmail(true); }}
                  className="mt-1 text-xs text-indigo-400 hover:text-indigo-600"
                >
                  Skip for now
                </button>
              </div>
            )}

            {/* Input area */}
            <div className="shrink-0 border-t bg-white px-3 py-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white transition-all disabled:opacity-40 hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isLoading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send    className="h-4 w-4" />
                  }
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-gray-400">
                Powered by Fuelo Technologies
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg hover:shadow-xl transition-shadow"
        style={{ backgroundColor: primaryColor }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageSquare className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}