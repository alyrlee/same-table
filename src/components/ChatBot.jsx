import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../hooks/useAppContext';
import { chatResponses } from '../data/recipes';
import { getNaturalNutrients } from '../utils/api';
import Logo from './Logo';

function formatNutritionResponse(foods, lang) {
  if (!foods || foods.length === 0) return null;
  const labels = {
    en: { cal: 'calories', fat: 'fat', protein: 'protein', carbs: 'carbs', per: 'per serving' },
    es: { cal: 'calorías', fat: 'grasa', protein: 'proteína', carbs: 'carbohidratos', per: 'por porción' },
    pt: { cal: 'calorias', fat: 'gordura', protein: 'proteína', carbs: 'carboidratos', per: 'por porção' },
    fr: { cal: 'calories', fat: 'matières grasses', protein: 'protéines', carbs: 'glucides', per: 'par portion' },
  };
  const l = labels[lang] || labels.en;

  return foods
    .map((f) => {
      const name = f.food_name || f.name || 'Food';
      const cal = f.calories ?? f.nf_calories ?? '?';
      const fat = f.total_fat_g ?? f.nf_total_fat ?? '?';
      const protein = f.protein_g ?? f.nf_protein ?? '?';
      const carbs = f.total_carb_g ?? f.nf_total_carbohydrate ?? '?';
      return `🍽️ ${name} (${l.per}):\n• ${cal} ${l.cal}\n• ${fat}g ${l.fat}\n• ${protein}g ${l.protein}\n• ${carbs}g ${l.carbs}`;
    })
    .join('\n\n');
}

export default function ChatBot() {
  const { t, lang, isOnline } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef(null);
  const responseIdx = useRef(0);

  useEffect(() => {
    setMessages([{ id: 'greeting', text: t('chat_greeting'), isUser: false }]);
    setShowQuickReplies(true);
    responseIdx.current = 0;
  }, [lang, t]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
    setShowBadge(false);
  };

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const userMsg = { id: Date.now(), text: text.trim(), isUser: true };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setShowQuickReplies(false);
    setIsTyping(true);

    // Try live Nutritionix API when online
    if (isOnline) {
      try {
        const foods = await getNaturalNutrients(text.trim());
        const formatted = formatNutritionResponse(foods, lang);
        if (formatted) {
          setIsTyping(false);
          setMessages((prev) => [...prev, {
            id: Date.now() + 1,
            text: formatted,
            isUser: false,
            isLive: true,
          }]);
          return;
        }
      } catch {
        // Fall through to offline responses
      }
    }

    // Offline fallback: canned responses
    const responses = chatResponses[lang] || chatResponses.en;
    const delay = 1200 + Math.random() * 600;

    setTimeout(() => {
      setIsTyping(false);
      const botMsg = {
        id: Date.now() + 1,
        text: responses[responseIdx.current % responses.length],
        isUser: false,
      };
      setMessages((prev) => [...prev, botMsg]);
      responseIdx.current++;
    }, delay);
  }, [lang, isOnline]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const quickReplies = [t('qr1'), t('qr2'), t('qr3'), t('qr4')];

  return (
    <>
      <button className="chat-fab" onClick={toggleChat} aria-label="Open chat assistant">
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        {showBadge && <div className="chat-badge">1</div>}
      </button>

      <div className={`chat-window${isOpen ? ' open' : ''}`}>
        <div className="chat-header">
          <div className="chat-avatar">
            <Logo size={30} />
          </div>
          <div className="chat-header-info">
            <h4>Same Table Helper 🍽️</h4>
            <p>{t('chat_status')}</p>
          </div>
          <button className="chat-close" onClick={toggleChat}>×</button>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-msg${msg.isUser ? ' user' : ''}`}>
              <div className={`msg-avatar${msg.isUser ? ' user-av' : ''}`}>
                {msg.isUser ? 'You' : 'ST'}
              </div>
              <div className={`msg-bubble ${msg.isUser ? 'user' : 'bot'}`}>
                {msg.text.split('\n').map((line, i) => (
                  <span key={i}>{line}{i < msg.text.split('\n').length - 1 && <br />}</span>
                ))}
                {msg.isLive && <div className="live-tag">📡 Live data</div>}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="chat-msg">
              <div className="msg-avatar">ST</div>
              <div className="msg-bubble bot">
                <div className="chat-typing">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {showQuickReplies && (
          <div className="chat-quick-replies">
            {quickReplies.map((qr, i) => (
              <button key={i} className="quick-reply" onClick={() => sendMessage(qr)}>
                {qr}
              </button>
            ))}
          </div>
        )}

        <div className="chat-input-row">
          <textarea
            className="chat-input"
            rows="1"
            placeholder={t('chat_placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="chat-send" onClick={() => sendMessage(input)}>
            <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
