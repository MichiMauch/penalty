interface GameRulesDisplayProps {
  currentShot?: string;
  currentSave?: string;
  compact?: boolean;
}

export default function GameRulesDisplay({ 
  currentShot, 
  currentSave,
  compact = false 
}: GameRulesDisplayProps) {
  
  const rules = [
    { 
      shot: { emoji: '⬅️', name: 'Links', key: 'links' }, 
      save: { emoji: '⬅️', name: 'Links-Hecht', key: 'links' },
      color: '#10B981'
    },
    { 
      shot: { emoji: '🎯', name: 'Mitte', key: 'mitte' }, 
      save: { emoji: '🎯', name: 'Mitte-Bleiben', key: 'mitte' },
      color: '#F59E0B'
    },
    { 
      shot: { emoji: '➡️', name: 'Rechts', key: 'rechts' }, 
      save: { emoji: '➡️', name: 'Rechts-Hecht', key: 'rechts' },
      color: '#3B82F6'
    }
  ];
  
  if (compact) {
    return (
      <div className="rules-display-compact">
        <div className="rules-title">⚽ Elfmeter-Regeln:</div>
        <div className="rules-list-compact">
          {rules.map((rule, index) => (
            <div 
              key={index} 
              className={`rule-compact ${
                currentShot === rule.shot.key || currentSave === rule.save.key 
                  ? 'active' 
                  : ''
              }`}
              style={{ '--rule-color': rule.color } as React.CSSProperties}
            >
              <span className="shot">⚽{rule.shot.emoji}</span>
              <span className="equals">=</span>
              <span className="save">🧤{rule.save.emoji}</span>
              <span className="result">PARADE</span>
            </div>
          ))}
        </div>
        
        <style jsx>{`
          .rules-display-compact {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 0.75rem;
            padding: 0.75rem 1rem;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            display: inline-flex;
            align-items: center;
            gap: 1rem;
          }
          
          .rules-title {
            font-weight: 600;
            font-size: 0.875rem;
            color: #4B5563;
          }
          
          .rules-list-compact {
            display: flex;
            gap: 1rem;
          }
          
          .rule-compact {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.5rem;
            border-radius: 0.5rem;
            transition: all 0.3s ease;
            border: 2px solid transparent;
          }
          
          .rule-compact.active {
            background: var(--rule-color)20;
            border-color: var(--rule-color);
            transform: scale(1.1);
          }
          
          .rule-compact span {
            font-size: 1.25rem;
          }
          
          .arrow {
            color: #9CA3AF;
            font-size: 1rem !important;
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <div className="rules-display">
      <h3 className="rules-header">
        <span className="icon">⚽</span>
        Elfmeter-Regeln
      </h3>
      <div className="rules-grid">
        {rules.map((rule, index) => {
          const isActive = currentShot === rule.shot.key || currentSave === rule.save.key;
          
          return (
            <div 
              key={index}
              className={`rule-card ${isActive ? 'active' : ''}`}
              style={{ '--card-color': rule.color } as React.CSSProperties}
            >
              <div className="rule-content">
                <div className="move shot-move">
                  <span className="emoji">⚽{rule.shot.emoji}</span>
                  <span className="name">{rule.shot.name}-Schuss</span>
                </div>
                <div className="versus">gleiche Richtung wie</div>
                <div className="move save-move">
                  <span className="emoji">🧤{rule.save.emoji}</span>
                  <span className="name">{rule.save.name}</span>
                </div>
                <div className="result">= PARADE!</div>
              </div>
              <div className="color-indicator" style={{ backgroundColor: rule.color }} />
            </div>
          );
        })}
      </div>
      
      <style jsx>{`
        .rules-display {
          background: white;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          margin-bottom: 1.5rem;
        }
        
        .rules-header {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1F2937;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .rules-header .icon {
          font-size: 1.5rem;
        }
        
        .rules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        
        .rule-card {
          position: relative;
          background: #F9FAFB;
          border: 2px solid #E5E7EB;
          border-radius: 0.75rem;
          padding: 1rem;
          transition: all 0.3s ease;
          overflow: hidden;
        }
        
        .rule-card.active {
          border-color: var(--card-color);
          background: var(--card-color)10;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--card-color)30;
        }
        
        .rule-content {
          position: relative;
          z-index: 1;
        }
        
        .move {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.5rem 0;
        }
        
        .move .emoji {
          font-size: 1.5rem;
        }
        
        .move .name {
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        .versus {
          font-size: 0.75rem;
          color: #6B7280;
          text-align: center;
          margin: 0.25rem 0;
        }
        
        .color-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          transition: height 0.3s ease;
        }
        
        .rule-card.active .color-indicator {
          height: 8px;
        }
      `}</style>
    </div>
  );
}