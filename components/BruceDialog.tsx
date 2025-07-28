'use client';

import { useState, useEffect } from 'react';
import { SaveDirection, ShotDirection } from '@/lib/types';

type BruceContext = 'shooting' | 'keeping' | 'rematch';

interface BruceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  opponentKeepermoves: SaveDirection[];
  opponentShooterMoves: ShotDirection[];
  opponentName: string;
  onContinueRevenge: () => void;
  context?: BruceContext;
}

interface BruceAnalysis {
  analysis: string;
  confidence: string;
  source: string;
  error?: boolean;
}

interface ChatMessage {
  type: 'bruce' | 'user';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  displayedContent?: string;
}

export default function BruceDialog({
  isOpen,
  onClose,
  opponentKeepermoves,
  opponentShooterMoves,
  opponentName,
  onContinueRevenge,
  context = 'shooting'
}: BruceDialogProps) {
  const [analysis, setAnalysis] = useState<BruceAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null);

  // Typewriter effect for Bruce messages
  const typeMessage = (message: string, messageIndex: number) => {
    setTypingMessageIndex(messageIndex);
    let currentIndex = 0;
    
    const typeInterval = setInterval(() => {
      setMessages(prev => 
        prev.map((msg, index) => 
          index === messageIndex 
            ? { ...msg, displayedContent: message.slice(0, currentIndex + 1) }
            : msg
        )
      );
      
      currentIndex++;
      if (currentIndex >= message.length) {
        clearInterval(typeInterval);
        setTypingMessageIndex(null);
      }
    }, 30); // 30ms per character
  };

  // Generate context-based intro message
  const getIntroMessage = (context: BruceContext, opponentName: string): string => {
    switch (context) {
      case 'shooting':
        return `Ja, ja...ich kenne das Spielverhalten von ${opponentName} sehr gut, mein Tipp für das Penalty schiessen wäre folgender:`;
      case 'keeping':
        return `Aha, ${opponentName} wieder! Ich habe seine Schussmuster studiert, hier mein Abwehr-Tipp:`;
      case 'rematch':
        return `Revanche gegen ${opponentName}! Basierend auf eurem letzten Match, hier meine Empfehlung:`;
      default:
        return `Bruce kennt ${opponentName}'s Spielverhalten sehr gut! Er kann die letzten 5 Elfmeter analysieren und dir einen strategischen Tipp geben.`;
    }
  };

  // Reset and start AI conversation when dialog opens
  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setAnalysis(null);
      setShowAnalysis(false);
      setIsLoading(false);
      
      // Start AI conversation immediately
      setTimeout(() => {
        askBruce();
      }, 500);
    }
  }, [isOpen, opponentName, context]);

  const askBruce = async () => {
    setIsLoading(true);
    setShowAnalysis(false);

    try {
      const response = await fetch('/api/bruce-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponentKeepermoves,
          opponentShooterMoves,
          opponentName,
          context
        })
      });

      if (response.ok) {
        const data: BruceAnalysis = await response.json();
        setAnalysis(data);
        
        // Add Bruce's message with typewriter effect
        const newMessage: ChatMessage = {
          type: 'bruce',
          content: data.analysis,
          timestamp: new Date(),
          isTyping: true,
          displayedContent: ''
        };
        
        setMessages(prev => {
          const newMessages = [...prev, newMessage];
          // Start typing effect for the new message
          setTimeout(() => {
            typeMessage(data.analysis, newMessages.length - 1);
          }, 100);
          return newMessages;
        });
        
        setShowAnalysis(true);
      } else {
        throw new Error('Bruce ist gerade nicht verfügbar');
      }
    } catch (error) {
      console.error('Bruce analysis error:', error);
      const fallbackTip = `${opponentName} ist unberechenbar - aber du schaffst das!`;
      setAnalysis({
        analysis: fallbackTip,
        confidence: "Bruce's Notfall-Tipp",
        source: "error",
        error: true
      });
      
      // Add fallback message with typewriter effect
      const fallbackMessage: ChatMessage = {
        type: 'bruce',
        content: fallbackTip,
        timestamp: new Date(),
        isTyping: true,
        displayedContent: ''
      };
      
      setMessages(prev => {
        const newMessages = [...prev, fallbackMessage];
        setTimeout(() => {
          typeMessage(fallbackTip, newMessages.length - 1);
        }, 100);
        return newMessages;
      });
      
      setShowAnalysis(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    onClose();
    onContinueRevenge();
  };

  if (!isOpen) return null;

  return (
    <div className="bruce-dialog-overlay">
      <div className="bruce-dialog">
        {/* Bruce Header */}
        <div className="bruce-header">
          <img 
            src="/bruce.png" 
            alt="Bruce" 
            className="bruce-avatar-img"
          />
          <div>
            <h2 className="bruce-title">Bruce</h2>
            <p className="bruce-subtitle">Der Elfmeter-Experte</p>
          </div>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        {/* Chat Messages */}
        <div className="chat-container">
          {messages.map((message, index) => (
            <div key={index} className={`chat-message ${message.type}`}>
              <div className="message-bubble">
                {message.isTyping && message.displayedContent !== undefined 
                  ? message.displayedContent 
                  : message.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="chat-message bruce">
              <div className="message-bubble typing">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="chat-actions">
          <button 
            onClick={handleContinue}
            className="continue-button"
          >
            ⚽ Weiter zum Schiessen
          </button>
        </div>
      </div>

      <style jsx>{`
        .bruce-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          z-index: 1000;
          pointer-events: none;
        }

        .bruce-dialog {
          background: white;
          border-radius: 1rem;
          width: 420px;
          height: 500px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          position: fixed;
          bottom: 100px;
          right: 20px;
          margin: 0;
          pointer-events: auto;
          border: 1px solid #e5e7eb;
        }

        .bruce-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border-radius: 1rem 1rem 0 0;
          position: relative;
        }

        .bruce-avatar-img {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid rgba(255, 255, 255, 0.3);
        }

        .bruce-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }

        .bruce-subtitle {
          font-size: 0.75rem;
          opacity: 0.9;
          margin: 0;
          font-weight: 400;
        }

        .close-button {
          margin-left: auto;
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.25rem;
          transition: background-color 0.2s;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .chat-container {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
          background: #f8f9fa;
          min-height: 0;
        }

        .chat-message {
          margin-bottom: 1rem;
          display: flex;
        }

        .chat-message.bruce {
          justify-content: flex-start;
        }

        .chat-message.user {
          justify-content: flex-end;
        }

        .message-bubble {
          max-width: 80%;
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          line-height: 1.4;
          font-size: 0.9rem;
        }

        .chat-message.bruce .message-bubble {
          background: #10b981;
          color: white;
          border-radius: 1rem;
        }

        .chat-message.user .message-bubble {
          background: #10b981;
          color: white;
          border-bottom-right-radius: 0.25rem;
        }

        .message-bubble.typing {
          background: #e5e7eb;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .typing-dots {
          display: flex;
          gap: 0.25rem;
        }

        .typing-dots span {
          width: 6px;
          height: 6px;
          background: #6b7280;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }

        .chat-actions {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
          background: white;
          border-radius: 0 0 1rem 1rem;
        }

        .continue-button {
          width: 100%;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .continue-button:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .opponent-stats {
          background: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }

        .moves-display {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .move-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: white;
          padding: 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }

        .move-number {
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
        }

        .bruce-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .ask-bruce-button {
          flex: 1;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .ask-bruce-button:hover {
          transform: translateY(-2px);
        }

        .skip-button {
          background: #6b7280;
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
        }

        .bruce-loading {
          text-align: center;
          padding: 2rem;
        }

        .loading-spinner {
          font-size: 3rem;
          animation: spin 2s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .loading-dots span {
          animation: blink 1.5s infinite;
          font-size: 1.5rem;
        }

        .loading-dots span:nth-child(2) {
          animation-delay: 0.5s;
        }

        .loading-dots span:nth-child(3) {
          animation-delay: 1s;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .bruce-analysis {
          text-align: center;
        }

        .analysis-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .bruce-icon {
          font-size: 2rem;
        }

        .analysis-content {
          background: linear-gradient(135deg, #fef3c7, #fbbf24);
          padding: 1.5rem;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .analysis-text {
          font-size: 1.1rem;
          font-weight: 600;
          color: #92400e;
          margin-bottom: 1rem;
          font-style: italic;
        }

        .analysis-meta {
          display: flex;
          justify-content: center;
          gap: 1rem;
          font-size: 0.875rem;
        }

        .confidence {
          color: #059669;
          font-weight: 500;
        }

        .error-note {
          color: #dc2626;
          font-weight: 500;
        }

        .continue-button {
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          margin-right: 1rem;
          transition: transform 0.2s;
        }

        .continue-button:hover {
          transform: translateY(-2px);
        }

        .cancel-button {
          background: #6b7280;
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}