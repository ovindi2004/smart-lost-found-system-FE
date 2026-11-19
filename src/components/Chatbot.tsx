import { useState, useRef, useEffect, type FormEvent } from "react";
import type { ChatMessage } from "../types";
import { api } from "../services/api";

const PROMPT_SUGGESTIONS = [
  "How do I report a lost item?",
  "How does AI smart matching work?",
  "How can I claim an item someone found?",
  "What categories of items can be reported?",
];

export const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "Hello! 👋 Welcome to UniFind. I am your campus recovery AI assistant. Ask me anything about finding, reporting, or claiming items!",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [messages, open, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const reply = await api.chatbot.sendMessage(text);
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text:
            err instanceof Error
              ? err.message
              : "I'm having trouble connecting right now. Please try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleSend();
  };

  return (
    <div className="chatbot-container">
      {open ? (
        <div className="chatbot-window" role="dialog" aria-label="AI Chatbot Assistant">
          <div className="chatbot-header">
            <div>
              <h3>UniFind Assistant</h3>
              <p>Online · Powered by Gemini AI</p>
            </div>
            <button
              className="chatbot-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-message ${msg.role === "bot" ? "chat-bot" : "chat-user"}`}
              >
                {msg.text}
              </div>
            ))}

            {loading && (
              <div className="chat-message chat-bot chat-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions when there are few messages */}
          {messages.length <= 3 && !loading && (
            <div
              style={{
                display: "flex",
                gap: "6px",
                overflowX: "auto",
                padding: "6px 12px",
                background: "#090d1a",
                borderTop: "1px solid var(--line-strong)",
              }}
            >
              {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => void handleSend(suggestion)}
                  style={{
                    whiteSpace: "nowrap",
                    fontSize: "11px",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    background: "#1e293b",
                    color: "var(--cyan)",
                    border: "1px solid rgba(34, 211, 238, 0.2)",
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="chatbot-form">
            <input
              type="text"
              className="chatbot-input"
              placeholder="Ask UniFind Assistant..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="chatbot-send"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>
        </div>
      ) : (
        <button
          className="chatbot-toggle"
          onClick={() => setOpen(true)}
          aria-label="Open AI Chatbot"
        >
          <span>Ask UniFind AI</span>
        </button>
      )}
    </div>
  );
};

export default Chatbot;
