import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Bot, Globe, Sparkles, Volume2, Square } from 'lucide-react';
import { chatMessages } from '../data/mockData';
import { askGeminiAssistant, type ChatMessage } from '../lib/gemini';
import { getUserContextSummary } from '../lib/userContext';
import {
  startListening,
  stopListening,
  speakText,
  stopSpeaking,
  isSpeechRecognitionSupported,
  type VoiceState,
  type VoiceLang,
} from '../lib/voiceAssistant';

interface ChatbotProps { darkMode: boolean; }

const quickReplies = [
  'How can AstaWashe help me remember my medication?',
  'What should I do if I miss a dose?',
  'What is my current reminder mode?',
  'Explain how AstaWashe reminders work',
  'Weekly adherence report',
];

export default function Chatbot({ darkMode }: ChatbotProps) {
  const [messages, setMessages] = useState(chatMessages);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [voiceLang, setVoiceLang] = useState<VoiceLang>('en-US');
  const [voiceNotice, setVoiceNotice] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const cardBg = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100';

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, typing, voiceState]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, []);

  const handleSend = async (overrideInput?: string, autoSpeak: boolean = false) => {
    const userText = (overrideInput || input).trim();
    if (!userText || typing) return;

    stopSpeaking();

    const userMsg = {
      id: Date.now(),
      role: 'user' as const,
      text: userText,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      lang: 'English',
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setTyping(true);
    setVoiceState('THINKING');
    setVoiceNotice('');

    try {
      const userContext = await getUserContextSummary();

      const history: ChatMessage[] = newMessages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const replyText = await askGeminiAssistant(
        history,
        userText,
        userContext.formattedContext
      );

      const aiReply = {
        id: Date.now() + 1,
        role: 'ai' as const,
        text: replyText,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        lang: 'English',
      };
      setMessages((prev) => [...prev, aiReply]);

      if (autoSpeak || voiceState === 'LISTENING') {
        speakText(replyText, voiceLang, setVoiceState);
      } else {
        setVoiceState('IDLE');
      }
    } catch (error) {
      const aiErrorReply = {
        id: Date.now() + 1,
        role: 'ai' as const,
        text: 'Sorry, AstaWashe AI is temporarily unavailable. Please try again.',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        lang: 'English',
      };
      setMessages((prev) => [...prev, aiErrorReply]);
      setVoiceState('IDLE');
    } finally {
      setTyping(false);
    }
  };

  const handleMicClick = () => {
    setVoiceNotice('');

    if (voiceState === 'SPEAKING') {
      stopSpeaking(setVoiceState);
      return;
    }

    if (voiceState === 'LISTENING') {
      stopListening();
      setVoiceState('IDLE');
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setVoiceNotice('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    startListening({
      lang: voiceLang,
      onResult: (transcript) => {
        setInput(transcript);
        handleSend(transcript, true);
      },
      onError: (msg) => {
        setVoiceNotice(msg);
      },
      onStateChange: setVoiceState
    });
  };

  const handleQuick = (q: string) => { setInput(q); };

  return (
    <div className="p-6 h-[calc(100vh-8rem)] flex flex-col gap-4">
      {/* Header */}
      <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }}
        className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-5 flex items-center gap-4 text-white shadow-lg"
      >
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Bot size={26}/>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold flex items-center gap-2">AstaWashe AI <Sparkles size={16} className="text-yellow-300"/></h2>
          <p className="text-purple-200 text-sm">Multilingual Healthcare & Voice Assistant · Powered by Gemini</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={voiceLang}
            onChange={(e) => setVoiceLang(e.target.value as VoiceLang)}
            className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-lg border border-white/30 outline-none"
          >
            <option value="en-US" className="text-gray-900">🇬🇧 English (en-US)</option>
            <option value="am-ET" className="text-gray-900">🇪🇹 አማርኛ (am-ET)</option>
          </select>
          <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-xs font-semibold">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
            Online
          </div>
        </div>
      </motion.div>

      {/* Voice Status Alert Bar */}
      {voiceState !== 'IDLE' && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between text-xs font-semibold text-purple-900">
          <div className="flex items-center gap-2">
            {voiceState === 'LISTENING' && <span className="text-red-500 flex items-center gap-1 animate-pulse">🔴 Listening to your voice...</span>}
            {voiceState === 'THINKING' && <span className="text-indigo-600 flex items-center gap-1">✨ Thinking and consulting AstaWashe data...</span>}
            {voiceState === 'SPEAKING' && <span className="text-emerald-600 flex items-center gap-1">🔊 Speaking response...</span>}
          </div>
          {voiceState === 'SPEAKING' && (
            <button
              onClick={() => stopSpeaking(setVoiceState)}
              className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded-lg flex items-center gap-1"
            >
              <Square size={12}/> Stop speaking
            </button>
          )}
        </div>
      )}

      {voiceNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-800">
          ℹ️ {voiceNotice}
        </div>
      )}

      {/* Language support tags */}
      <div className="flex flex-wrap gap-2">
        {['Amharic · አማርኛ','English','Oromiffa · Afaan Oromoo','Tigrigna · ትግርኛ','Somali · Soomaali'].map(l=>(
          <span key={l} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border ${darkMode?'bg-slate-700 border-slate-600 text-slate-300':'bg-gray-50 border-gray-200 text-gray-600'}`}>
            <Globe size={11} className="text-sky-500"/>{l}
          </span>
        ))}
      </div>

      {/* Chat area */}
      <div className={`flex-1 rounded-2xl border overflow-hidden flex flex-col ${cardBg}`}>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <AnimatePresence>
            {messages.map((msg,i)=>(
              <motion.div key={msg.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.05 }}
                className={`flex ${msg.role==='user'?'justify-end':'justify-start'} gap-3`}
              >
                {msg.role==='ai' && (
                  <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot size={18} className="text-white"/>
                  </div>
                )}
                <div className={`max-w-[75%] space-y-1`}>
                  {msg.lang && (
                    <div className={`flex items-center gap-1.5 ${msg.role==='user'?'justify-end':''}`}>
                      <Globe size={10} className="text-sky-400"/>
                      <span className="text-xs text-sky-500 font-medium">{msg.lang}</span>
                    </div>
                  )}
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role==='user' ? 'chat-bubble-user' : `chat-bubble-ai ${darkMode?'bg-slate-700 border-slate-600 text-slate-100':''}`}`}>
                    {msg.text}
                  </div>
                  <div className={`flex items-center gap-1 text-xs text-gray-400 ${msg.role==='user'?'justify-end':''}`}>
                    <span>{msg.time}</span>
                    {msg.role==='ai' && (
                      <button
                        type="button"
                        title="Read aloud"
                        onClick={() => speakText(msg.text, voiceLang, setVoiceState)}
                        className="text-gray-400 ml-1 hover:text-sky-500 transition-colors"
                      >
                        <Volume2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                {msg.role==='user' && (
                  <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md text-white text-xs font-bold">LH</div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {typing && (
            <motion.div initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <Bot size={18} className="text-white"/>
              </div>
              <div className={`px-4 py-3 rounded-2xl flex items-center gap-1 ${darkMode?'bg-slate-700':'bg-white border border-gray-200'}`}>
                {[0,1,2].map(i=>(
                  <motion.div key={i} animate={{ y:[0,-4,0] }} transition={{ repeat:Infinity, duration:0.6, delay:i*0.15 }} className="w-2 h-2 bg-violet-400 rounded-full"/>
                ))}
              </div>
            </motion.div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Quick replies */}
        <div className={`px-4 py-2 border-t flex gap-2 overflow-x-auto ${darkMode?'border-slate-700':'border-gray-100'}`}>
          {quickReplies.map(q=>(
            <button key={q} onClick={()=>handleQuick(q)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all hover:scale-105 ${darkMode?'bg-slate-700 border-slate-600 text-slate-300 hover:border-violet-500':'bg-gray-50 border-gray-200 text-gray-600 hover:border-violet-400 hover:text-violet-600'}`}
            >{q}</button>
          ))}
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${darkMode?'border-slate-700':'border-gray-100'}`}>
          <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${darkMode?'bg-slate-700 border-slate-600':'bg-gray-50 border-gray-200'}`}>
            <input
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask AstaWashe AI in any language..."
              className={`flex-1 bg-transparent text-sm outline-none ${darkMode?'text-white placeholder-slate-400':'text-gray-900'}`}
            />
            
            {/* Microphone Voice Button */}
            <button
              onClick={handleMicClick}
              type="button"
              className={`p-2 rounded-xl transition-all ${
                voiceState === 'LISTENING'
                  ? 'bg-red-500 text-white animate-pulse'
                  : voiceState === 'SPEAKING'
                  ? 'bg-emerald-500 text-white'
                  : darkMode
                  ? 'text-slate-400 hover:bg-slate-600'
                  : 'text-gray-400 hover:bg-gray-200'
              }`}
              title={
                voiceState === 'LISTENING'
                  ? 'Stop listening'
                  : voiceState === 'SPEAKING'
                  ? 'Stop speaking'
                  : 'Tap to speak'
              }
            >
              <Mic size={18}/>
            </button>

            <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} onClick={() => handleSend()} disabled={!input.trim() || typing}
              className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md disabled:opacity-40 transition-all"
            ><Send size={16}/></motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
