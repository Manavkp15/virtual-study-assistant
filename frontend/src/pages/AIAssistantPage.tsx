import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Bot, Send, Sparkles, Brain, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatMessage {
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
}

export const AIAssistantPage: React.FC = () => {
  const { t, i18n } = useTranslation('ai');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const presetQuestions = [
    t('prompt1'),
    t('prompt2'),
    t('prompt3'),
    t('prompt4')
  ];

  useEffect(() => {
    // Initial welcome AI guidance message
    const initAI = async () => {
      try {
        const res = await api.get(`/ai/guidance?lang=${i18n.language}`);
        const guidance = res.data.guidance;
        setMessages([
          {
            sender: 'AI',
            text: `👋 ${guidance.personalizedFeedback}\n\n💡 ${guidance.nextStepGuidance}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } catch (err) {
        setMessages([
          {
            sender: 'AI',
            text: i18n.language === 'gu'
              ? 'નમસ્તે! હું તમારો AI વર્ચ્યુઅલ અભ્યાસ મદદગાર છું. તમારા પ્રદર્શન અથવા અભ્યાસ યોજના વિશે કંઈ પણ પૂછો.'
              : 'Hello! I am your AI Virtual Study Assistant. Ask me anything about your performance, weak topics, or study schedule.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    };
    initAI();
  }, [i18n.language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      sender: 'USER',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { question: q, language: i18n.language });
      const aiMsg: ChatMessage = {
        sender: 'AI',
        text: res.data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'AI',
        text: i18n.language === 'gu'
          ? 'ક્ષમા કરશો, ક્ષતિ આવી છે. કૃપા કરીને ફરી પ્રયાસ કરો.'
          : 'Sorry, I ran into an issue retrieving your database telemetry. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
          <Bot className="w-7 h-7 text-blue-400" />
          <span>{t('title')}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between overflow-hidden">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${
                msg.sender === 'USER' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div className={`p-2.5 rounded-2xl flex-shrink-0 ${
                msg.sender === 'USER' ? 'bg-blue-600 text-white' : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              }`}>
                {msg.sender === 'USER' ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
              </div>

              <div className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed space-y-1 ${
                msg.sender === 'USER'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none whitespace-pre-wrap'
              }`}>
                <p>{msg.text}</p>
                <span className={`block text-[10px] ${msg.sender === 'USER' ? 'text-blue-200 text-right' : 'text-slate-500'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Brain className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-xs text-slate-400">
                {t('thinking')}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Preset Questions Chips */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>{t('quickPrompts')}:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {presetQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-xl border border-slate-700 transition-all text-left"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="relative pt-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('askPlaceholder')}
              className="w-full pl-4 pr-12 py-3 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !inputQuery.trim()}
              className="absolute right-2 top-4 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
