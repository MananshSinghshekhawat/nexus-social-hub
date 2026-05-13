import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import "./AIChatBot.css";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I am your AI assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Configuration Error: The AI API key is missing. If you are on Vercel, please add `VITE_OPENROUTER_API_KEY` to your Vercel Environment Variables. If you are testing locally, make sure your `.env` file is created and you have restarted the dev server." 
      }]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Nexus Social Hub",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini", // Using a highly reliable and advanced model
          messages: [
            { 
              role: "system", 
              content: `
You are Nexus AI — a highly advanced, intelligent, and reliable AI assistant (2026 standard).

CORE BEHAVIOR:
- Always provide accurate, up-to-date, and well-structured answers.
- If unsure, say "I may be mistaken" instead of hallucinating.
- Never generate false facts confidently.
- Prioritize clarity, usefulness, and real-world applicability.

RESPONSE STYLE:
- Use clean formatting (headings, bullet points, steps).
- Keep responses engaging but not overly verbose.
- Adapt tone based on user intent:
  - Casual → friendly
  - Business → professional
  - Technical → precise

INTELLIGENCE MODE:
- Break down complex topics step-by-step.
- Provide examples where helpful.
- Offer actionable suggestions (not just theory).
- Think like a senior expert in every domain.

CONTEXT AWARENESS:
- Understand user intent deeply before answering.
- Ask clarifying questions if needed.
- Remember previous messages in the conversation.

SAFETY & LIMITS:
- Do not generate harmful, illegal, or unethical instructions.
- Avoid misleading or dangerous advice.
- Be responsible and trustworthy.

SPECIAL ABILITIES:
- Help with coding, business, social media, design, marketing, and AI tools.
- Give modern (2026-level) insights and trends.
- Optimize answers for real-world results.

FORMAT RULES:
- Use short paragraphs.
- Use bullets for lists.
- Highlight important points clearly.

GOAL:
Deliver the most helpful, accurate, and practical response possible — like a top-tier AI assistant.
`
            },
            ...messages.filter(m => m.role !== 'system'),
            userMessage
          ]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || `API Error: ${response.status}`);
      }

      if (data.choices && data.choices.length > 0) {
        const aiMessage: Message = { 
          role: "assistant", 
          content: data.choices[0].message.content 
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error?.message || "Failed to get response from AI");
      }
    } catch (error: unknown) {
      console.error("Chat API Error:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "I'm having trouble connecting right now.";

      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `Error: ${errorMessage}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 ${isOpen ? 'scale-0' : 'scale-100 hover:-translate-y-1'}`}
        aria-label="Open AI Chat"
        title="Open AI Chat"
      >
        <MessageCircle size={28} />
        <span className="sr-only">Open AI Chat</span>
      </button>

      {/* Chat Window */}
      <div 
        className={`ai-chatbot-window fixed bottom-6 right-6 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col z-50 transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-primary/5 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-full text-white">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
              <p className="text-xs text-green-500 font-medium">Online</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Close AI Chat"
            title="Close AI Chat"
          >
            <X size={20} />
            <span className="sr-only">Close AI Chat</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
            >
              <div className={`flex max-w-[80%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-auto ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-primary'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div 
                  className={`p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-br-sm' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-in fade-in">
              <div className="flex max-w-[80%] gap-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-auto bg-gray-100 dark:bg-gray-800 text-primary">
                  <Bot size={16} />
                </div>
                <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 rounded-bl-sm flex items-center gap-1">
                  <div className="ai-chatbot-typing-dot-1 w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="ai-chatbot-typing-dot-2 w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="ai-chatbot-typing-dot-3 w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800/50 p-1 pl-4 rounded-3xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              aria-label="Type your message"
              className="flex-1 max-h-32 min-h-[40px] py-2.5 bg-transparent border-none focus:ring-0 resize-none outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
              rows={1}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2.5 m-0.5 rounded-full bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex-shrink-0"
              aria-label={isLoading ? "Sending message" : "Send message"}
              title={isLoading ? "Sending message" : "Send message"}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              <span className="sr-only">{isLoading ? "Sending message" : "Send message"}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
