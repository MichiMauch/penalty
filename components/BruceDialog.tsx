'use client';

import { useState } from 'react';
import { SaveDirection, ShotDirection } from '@/lib/types';

interface BruceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  opponentKeepermoves: SaveDirection[];
  opponentShooterMoves: ShotDirection[];
  opponentName: string;
  onContinueRevenge: () => void;
}

interface BruceAnalysis {
  analysis: string;
  confidence: string;
  source: string;
  error?: boolean;
}

export default function BruceDialog({
  isOpen,
  onClose,
  opponentKeepermoves,
  opponentShooterMoves,
  opponentName,
  onContinueRevenge
}: BruceDialogProps) {
  const [analysis, setAnalysis] = useState<BruceAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

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
          opponentName
        })
      });

      if (response.ok) {
        const data: BruceAnalysis = await response.json();
        setAnalysis(data);
        setShowAnalysis(true);
      } else {
        throw new Error('Bruce ist gerade nicht verfügbar');
      }
    } catch (error) {
      console.error('Bruce analysis error:', error);
      setAnalysis({
        analysis: `${opponentName} ist unberechenbar - aber du schaffst das!`,
        confidence: "Bruce's Notfall-Tipp",
        source: "error",
        error: true
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
          <div className="bruce-avatar">🧠</div>
          <div>
            <h2 className="bruce-title">Frag Bruce</h2>
            <p className="bruce-subtitle">Der Elfmeter-Experte</p>
          </div>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        {/* Content */}
        <div className="bruce-content">
          {!showAnalysis && !isLoading && (
            <div className="bruce-intro">
              <p className="mb-4">
                🎯 Bruce kennt <strong>{opponentName}&apos;s</strong> Spielverhalten sehr gut! 
                Er kann die letzten 5 Elfmeter analysieren und dir einen strategischen Tipp geben.
              </p>
              
              <div className="opponent-stats">
                {opponentKeepermoves.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">🧤 {opponentName}&apos;s letzte Paraden:</h4>
                    <div className="moves-display">
                      {opponentKeepermoves.map((move, index) => (
                        <div key={index} className="move-item">
                          <span className="move-number">#{index + 1}</span>
                          <span className="move-direction">
                            {move === 'links' ? '👈 Links' : 
                             move === 'rechts' ? '👉 Rechts' : 
                             '🎯 Mitte'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {opponentShooterMoves.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">⚽ {opponentName}&apos;s letzte Schüsse:</h4>
                    <div className="moves-display">
                      {opponentShooterMoves.map((move, index) => (
                        <div key={index} className="move-item">
                          <span className="move-number">#{index + 1}</span>
                          <span className="move-direction">
                            {move === 'links' ? '👈 Links' : 
                             move === 'rechts' ? '👉 Rechts' : 
                             '🎯 Mitte'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bruce-actions">
                <button 
                  onClick={askBruce}
                  className="ask-bruce-button"
                >
                  🧠 Bruce fragen
                </button>
                <button 
                  onClick={handleContinue}
                  className="skip-button"
                >
                  Ohne Tipp weiter
                </button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="bruce-loading">
              <div className="loading-spinner">🧠</div>
              <p>Bruce analysiert die Daten...</p>
              <div className="loading-dots">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          )}

          {showAnalysis && analysis && (
            <div className="bruce-analysis">
              <div className="analysis-header">
                <span className="bruce-icon">🎯</span>
                <h3>Bruce&apos;s Analyse</h3>
              </div>
              
              <div className="analysis-content">
                <p className="analysis-text">&quot;{analysis.analysis}&quot;</p>
                <div className="analysis-meta">
                  <span className="confidence">📈 {analysis.confidence}</span>
                  {analysis.error && (
                    <span className="error-note">⚠️ Backup-Tipp verwendet</span>
                  )}
                </div>
              </div>
              
              <div className="bruce-actions">
                <button 
                  onClick={handleContinue}
                  className="continue-button"
                >
                  💪 Revanche starten!
                </button>
                <button 
                  onClick={onClose}
                  className="cancel-button"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .bruce-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .bruce-dialog {
          background: white;
          border-radius: 1rem;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .bruce-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border-radius: 1rem 1rem 0 0;
        }

        .bruce-avatar {
          font-size: 2.5rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bruce-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0;
        }

        .bruce-subtitle {
          font-size: 0.9rem;
          opacity: 0.9;
          margin: 0;
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

        .bruce-content {
          padding: 1.5rem;
        }

        .bruce-intro p {
          color: #4b5563;
          line-height: 1.6;
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