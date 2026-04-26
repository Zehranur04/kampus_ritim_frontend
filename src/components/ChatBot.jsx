// ChatBot.jsx
import React, { useState, useRef, useEffect } from "react";
import api from "../api/apiService";

const quickActions = [
  {
    id: 1,
    icon: "🎯",
    text: "Bölümüme uygun etkinlik öner",
    message: "Bölümüm: Bilgisayar Mühendisliği, bana uygun etkinlikleri önerir misin?"
  },
  {
    id: 2,
    icon: "🏛️",
    text: "Bölümüme uygun kulüp öner",
    message: "Bölümüm: Bilgisayar Mühendisliği, bana uygun öğrenci kulüplerini önerebilir misin?"
  },
  {
    id: 3,
    icon: "👥",
    text: "Yeni insanlarla tanışmak istiyorum",
    message: "Yeni insanlarla tanışmak istiyorum, hangi kulüpler bana uygun olabilir?"
  },
  {
    id: 4,
    icon: "📅",
    text: "Bu hafta ne var?",
    message: "Bu hafta kampüste hangi etkinlikler var?"
  },
  {
    id: 5,
    icon: "💡",
    text: "Kariyer etkinlikleri",
    message: "Yaklaşan kariyer ve staj etkinliklerini göster"
  }
];

const initialBotMessage = {
  id: 1,
  type: "bot",
  text: "Merhaba! 👋 Ben KampüsRitmi Asistanı. Size nasıl yardımcı olabilirim?",
  timestamp: new Date(),
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([initialBotMessage]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [chatStatus, setChatStatus] = useState(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Fetch lightweight chat status (no OpenAI calls)
  useEffect(() => {
    const fetchStatus = async () => {
      if (!isOpen) return;

      setIsStatusLoading(true);
      try {
        const res = await api.get("/api/chat/status");
        setChatStatus(res?.data ?? null);
      } catch {
        setChatStatus(null);
      } finally {
        setIsStatusLoading(false);
      }
    };

    fetchStatus();
  }, [isOpen]);

  // ESC ile kapatma
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setShowQuickActions(false);
    setIsTyping(true);

    try {
      const res = await api.post("/api/chat", { message: text.trim() });
      const replyText = res?.data?.reply ?? "";

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        text: replyText || "(Boş yanıt)",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const status = err?.response?.status;
      const backendMessage = typeof err?.response?.data === "string" ? err.response.data : "";

      let errorText = "Şu anda cevap üretilemedi.";

      if (status === 503) {
        errorText = backendMessage || "AI şu an kapalı. Açmak için OpenAI:Enabled=true yap.";
      } else if (status === 400) {
        errorText = backendMessage || "Mesaj geçersiz. Lütfen tekrar deneyin.";
      } else if (status) {
        // 401/403/500 vs.
        errorText = backendMessage || `Backend hata kodu: ${status}`;
      } else {
        // No HTTP response: CORS / network / backend down
        errorText = "Backend'e ulaşılamadı (CORS/ağ hatası olabilir). Backend çalışıyor mu?";
      }

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        text: errorText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action) => {
    // Quick action tıklandığında otomatik gönderme; sadece buton metnini input'a yaz.
    setInputValue(action.text);
    setShowQuickActions(false);
    // Input'a odaklan (panel açıkken)
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const handleNewChat = () => {
    setMessages([initialBotMessage]);
    setShowQuickActions(true);
    setInputValue("");
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Chat Button */}
      <button
        className={`chatbot-button ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Chat Asistanı"
      >
        <div className="chatbot-button-inner">
          {isOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <>
              <svg className="chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <div className="button-pulse" />
            </>
          )}
        </div>

        {/* Notification badge */}
        {!isOpen && <span className="chatbot-badge">1</span>}
      </button>

      {/* Chat Panel */}
      <div className={`chatbot-panel ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar">
              <span>🤖</span>
              <div className="avatar-status" />
            </div>
            <div className="chatbot-header-text">
              <h3>KampüsRitmi Asistanı</h3>
              <span className="status-text">
                <span className="status-dot" />
                Çevrimiçi
              </span>
            </div>
          </div>
          <div className="chatbot-header-actions">
            <button
              className="header-action-btn"
              title="Yeni Sohbet"
              onClick={handleNewChat}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <button
              className="header-action-btn"
              onClick={() => setIsOpen(false)}
              title="Kapat"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((message, index) => (
            <div
              key={message.id ?? index}
              className={`message ${message.type}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {message.type === "bot" && <div className="message-avatar">🤖</div>}
              <div className="message-content">
                <div className="message-bubble">
                  <p style={{ whiteSpace: "pre-line" }}>{message.text}</p>
                </div>
                <span className="message-time">{formatTime(message.timestamp)}</span>

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="message-suggestions">
                    {message.suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        className="suggestion-btn"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="message bot typing-message">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="message-bubble typing-bubble">
                  <div className="typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {showQuickActions && messages.length <= 1 && (
          <div className="chatbot-quick-actions">
            <p className="quick-actions-title">Hızlı Sorular</p>
            <div className="quick-actions-grid">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  className="quick-action-btn"
                  onClick={() => handleQuickAction(action)}
                >
                  <span className="quick-action-icon">{action.icon}</span>
                  <span className="quick-action-text">{action.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="chatbot-input">
          <div className="input-container">
            <input
              ref={inputRef}
              type="text"
              placeholder="Mesajınızı yazın..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className={`send-btn ${inputValue.trim() ? "active" : ""}`}
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
          <p className="input-hint">
            <span>⚡</span> AI destekli yanıtlar
          </p>

          {/* Status hint (no OpenAI call) */}
          {isStatusLoading && (
            <p className="input-hint">
              Durum kontrol ediliyor...
            </p>
          )}

          {!isStatusLoading && chatStatus?.aiEnabled === false && (
            <p className="input-hint">
              AI şu an kapalı. Açmak için OpenAI:Enabled=true yap.
            </p>
          )}

          {!isStatusLoading && chatStatus?.isAuthenticated === false && (
            <p className="input-hint">
              Giriş yaparsan bölüm bilgine göre daha iyi öneri yapabilirim.
            </p>
          )}

          {!isStatusLoading && chatStatus?.isAuthenticated === true && chatStatus?.hasDepartment === false && (
            <p className="input-hint">
              Profilinde bölüm bilgisi yok. Profilini güncelleyip bölüm ekleyebilirsin.
            </p>
          )}
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && <div className="chatbot-backdrop" onClick={() => setIsOpen(false)} />}
    </>
  );
}
