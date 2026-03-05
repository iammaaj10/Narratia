"use client";

import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  MessageCircle,
  Send,
  Loader2,
  X,
  Sparkles,
  Bot,
  User,
  Lightbulb,
  BookOpen,
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type AIWritingPartnerProps = {
  phaseId: string;
  phaseTitle: string;
  currentContent: string;
  fullStoryContext: string; // All previous chapters/phases
  onClose: () => void;
};

export default function AIWritingPartner({
  phaseId,
  phaseTitle,
  currentContent,
  fullStoryContext,
  onClose,
}: AIWritingPartnerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(
    process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
  );
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  // Auto-scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Hi! I'm your AI Writing Partner. I've read your story so far and I'm here to help you with "${phaseTitle}". 

What would you like help with?
- Plot suggestions
- Character development
- Brainstorming ideas
- Fixing plot holes
- Writing tips

Just ask me anything!`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Build conversation history
      const conversationHistory = messages
        .map((msg) => `${msg.role === "user" ? "Writer" : "AI Partner"}: ${msg.content}`)
        .join("\n\n");

      // Create context-aware prompt
      const prompt = `You are a professional writing partner and creative consultant. You're helping a writer with their story.

STORY CONTEXT (what they've written so far):
${fullStoryContext.substring(0, 8000)} 

CURRENT CHAPTER/PHASE:
Title: ${phaseTitle}
Current content: ${currentContent.substring(0, 2000)}

CONVERSATION SO FAR:
${conversationHistory}

Writer: ${input}

Instructions:
- Be helpful, creative, and supportive
- Give specific, actionable advice
- Ask clarifying questions when needed
- Suggest 2-3 concrete ideas when relevant
- Keep responses concise (2-4 paragraphs)
- Stay in character as a writing partner
- Reference their story context
- Be enthusiastic and encouraging

Your response as AI Writing Partner:`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("AI Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    "I'm stuck. What should happen next?",
    "Help me develop my main character",
    "Is this scene paced well?",
    "How can I make this more dramatic?",
  ];

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-gray-900 border-l border-white/10 shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-purple-400" />
            <div>
              <h3 className="font-semibold text-white">AI Writing Partner</h3>
              <p className="text-xs text-gray-400">Context-aware assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === "user"
                  ? "bg-blue-500/20"
                  : "bg-purple-500/20"
              }`}
            >
              {message.role === "user" ? (
                <User className="w-4 h-4 text-blue-300" />
              ) : (
                <Bot className="w-4 h-4 text-purple-300" />
              )}
            </div>

            {/* Message */}
            <div
              className={`flex-1 ${
                message.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block p-3 rounded-lg max-w-[85%] ${
                  message.role === "user"
                    ? "bg-blue-500/20 text-blue-100"
                    : "bg-white/5 text-gray-200"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-300" />
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts (show if no messages yet) */}
      {messages.length === 1 && (
        <div className="p-4 border-t border-white/10 space-y-2">
          <p className="text-xs text-gray-400 mb-2">Quick suggestions:</p>
          {quickPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => setInput(prompt)}
              className="w-full text-left p-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"
            >
              <Lightbulb className="w-3 h-3 inline mr-2 text-yellow-400" />
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-gray-900/50">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask your AI writing partner..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}