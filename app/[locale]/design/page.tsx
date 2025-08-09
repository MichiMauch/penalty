'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { IoFootballOutline, IoFootball } from 'react-icons/io5';
import { FaPlay, FaHome, FaDownload, FaArrowRight, FaArrowLeft, FaSearch } from 'react-icons/fa';
import { MdSportsSoccer } from 'react-icons/md';
import { GiSoccerBall, GiGoalKeeper } from 'react-icons/gi';

export default function DesignSystem() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const colors = {
    primary: {
      'Stadium Blue Dark': '#0f1a2e',
      'Stadium Blue': '#1a2b4a',
      'Stadium Blue Light': '#2a3b5a',
      'Grass Green': '#5d9638',
      'Grass Green Light': '#71a84a',
      'Grass Green Dark': '#4a7c2a',
    },
    neutral: {
      'Pure White': '#ffffff',
      'Off White': '#f8f9fa',
      'Light Gray': '#e5e7eb',
      'Medium Gray': '#9ca3af',
      'Dark Gray': '#374151',
      'Pure Black': '#000000',
    },
    status: {
      'Success': '#10b981',
      'Warning': '#f59e0b',
      'Error': '#ef4444',
      'Info': '#3b82f6',
    }
  };

  return (
    <Layout showHeader={false}>
      <div className="design-system-page">
        {/* Hero Section */}
        <section className="design-hero">
          <h1 className="design-hero-title">Penalty Design System</h1>
          <p className="design-hero-subtitle">
            Alle UI-Komponenten und Styles für die Penalty App
          </p>
        </section>

        <div className="design-content">
          {/* Color Palette */}
          <section className="design-section">
            <h2 className="section-title">Farben</h2>
            <p className="section-description">
              Farbpalette basierend auf dem Stadion-Design
            </p>
            
            {Object.entries(colors).map(([category, colorSet]) => (
              <div key={category} className="color-category">
                <h3 className="category-title">{category.charAt(0).toUpperCase() + category.slice(1)} Colors</h3>
                <div className="color-grid">
                  {Object.entries(colorSet).map(([name, value]) => (
                    <div
                      key={name}
                      className="color-card"
                      onClick={() => copyToClipboard(value)}
                    >
                      <div 
                        className="color-preview"
                        style={{ backgroundColor: value }}
                      />
                      <div className="color-info">
                        <span className="color-name">{name}</span>
                        <span className="color-value">{value}</span>
                        {copiedColor === value && (
                          <span className="color-copied">Kopiert!</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Typography */}
          <section className="design-section">
            <h2 className="section-title">Typografie</h2>
            <p className="section-description">
              Überschriften und Text-Stile
            </p>
            
            <div className="typography-showcase">
              <div className="type-example">
                <h1 className="hero-title">Penalty H1</h1>
                <code>hero-title (Notable, 12rem)</code>
              </div>
              
              <div className="type-example">
                <h1>Heading 1</h1>
                <code>h1 (Varela Round, 2.5rem, 700)</code>
              </div>
              
              <div className="type-example">
                <h2>Heading 2</h2>
                <code>h2 (Varela Round, 2rem, 600)</code>
              </div>
              
              <div className="type-example">
                <h3>Heading 3</h3>
                <code>h3 (Varela Round, 1.5rem, 600)</code>
              </div>
              
              <div className="type-example">
                <h4>Heading 4</h4>
                <code>h4 (Varela Round, 1.25rem, 500)</code>
              </div>
              
              <div className="type-example">
                <p className="lead">Lead Paragraph - Für wichtige Einleitungstexte</p>
                <code>lead (Varela Round, 1.25rem, 400)</code>
              </div>
              
              <div className="type-example">
                <p>Regular Paragraph - Standard Text für normale Inhalte</p>
                <code>p (Varela Round, 1rem, 400)</code>
              </div>
              
              <div className="type-example">
                <p className="small">Small Text - Für Hinweise und kleine Texte</p>
                <code>small (Varela Round, 0.875rem, 400)</code>
              </div>
            </div>
          </section>

          {/* Buttons */}
          <section className="design-section">
            <h2 className="section-title">Buttons</h2>
            <p className="section-description">
              Verschiedene Button-Stile und Größen
            </p>
            
            <div className="button-showcase">
              <div className="button-group">
                <h3>Primary Buttons</h3>
                <div className="button-row">
                  <button className="btn btn-primary btn-sm">Klein</button>
                  <button className="btn btn-primary">Standard</button>
                  <button className="btn btn-primary btn-lg">Groß</button>
                  <button className="btn btn-primary" disabled>Deaktiviert</button>
                </div>
              </div>
              
              <div className="button-group">
                <h3>Secondary Buttons</h3>
                <div className="button-row">
                  <button className="btn btn-secondary btn-sm">Klein</button>
                  <button className="btn btn-secondary">Standard</button>
                  <button className="btn btn-secondary btn-lg">Groß</button>
                  <button className="btn btn-secondary" disabled>Deaktiviert</button>
                </div>
              </div>
              
              <div className="button-group">
                <h3>Ghost Buttons</h3>
                <div className="button-row">
                  <button className="btn btn-ghost btn-sm">Klein</button>
                  <button className="btn btn-ghost">Standard</button>
                  <button className="btn btn-ghost btn-lg">Groß</button>
                  <button className="btn btn-ghost" disabled>Deaktiviert</button>
                </div>
              </div>
              
              <div className="button-group">
                <h3>Danger Buttons</h3>
                <div className="button-row">
                  <button className="btn btn-danger btn-sm">Klein</button>
                  <button className="btn btn-danger">Standard</button>
                  <button className="btn btn-danger btn-lg">Groß</button>
                  <button className="btn btn-danger" disabled>Deaktiviert</button>
                </div>
              </div>

              <div className="button-group">
                <h3>Stadium Style (Hero CTA)</h3>
                <div className="button-row">
                  <button className="hero-cta">Jetzt spielen</button>
                  <button className="stadium-btn stadium-btn-primary">Stadium Primary</button>
                  <button className="stadium-btn stadium-btn-secondary">Stadium Secondary</button>
                </div>
              </div>

              <div className="button-group">
                <h3>Pill Buttons (Fully Rounded)</h3>
                <div className="button-row">
                  <button className="btn btn-primary btn-pill btn-pill-sm">SEARCH</button>
                  <button className="btn btn-primary btn-pill">PLAY</button>
                  <button className="btn btn-primary btn-pill btn-pill-lg">SUBSCRIBE</button>
                  <button className="btn btn-outline-primary btn-pill">DOWNLOAD</button>
                </div>
              </div>

              <div className="button-group">
                <h3>Icon Buttons (mit Emojis)</h3>
                <div className="button-row">
                  <button className="btn btn-primary btn-pill icon-play">PLAY</button>
                  <button className="btn btn-primary icon-home">HOME</button>
                  <button className="btn btn-outline-primary icon-download">DOWNLOAD</button>
                  <button className="btn btn-primary icon-arrow-right">SIGN UP</button>
                </div>
              </div>

              <div className="button-group">
                <h3>React Icons Buttons</h3>
                <div className="button-row">
                  <button className="btn btn-primary btn-pill">
                    <IoFootball size={20} />
                    Fußball
                  </button>
                  <button className="btn btn-primary">
                    <MdSportsSoccer size={20} />
                    Spielen
                  </button>
                  <button className="btn btn-outline-primary">
                    <GiSoccerBall size={20} />
                    Training
                  </button>
                  <button className="btn btn-gradient btn-pill">
                    <GiGoalKeeper size={20} />
                    Torwart
                  </button>
                </div>
              </div>

              <div className="button-group">
                <h3>React Icons mit verschiedenen Stilen</h3>
                <div className="button-row">
                  <button className="btn btn-primary">
                    <FaPlay size={16} />
                    Play
                  </button>
                  <button className="btn btn-primary">
                    <FaHome size={18} />
                    Home
                  </button>
                  <button className="btn btn-outline-primary btn-pill">
                    <FaDownload size={16} />
                    Download
                  </button>
                  <button className="btn btn-primary">
                    Sign Up
                    <FaArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div className="button-group">
                <h3>Special Shapes</h3>
                <div className="button-row">
                  <button className="btn btn-primary btn-rounded-left">CLICK</button>
                  <button className="btn btn-primary btn-rounded-right">READ MORE</button>
                  <button className="btn btn-gradient btn-pill">SUBSCRIBE</button>
                  <button className="btn btn-glass btn-pill">GLASS EFFECT</button>
                </div>
              </div>

              <div className="button-group">
                <h3>Outline Variants</h3>
                <div className="button-row">
                  <button className="btn btn-outline-primary">Primary Outline</button>
                  <button className="btn btn-outline-primary btn-pill">Pill Outline</button>
                  <button className="btn btn-outline-white">White Outline</button>
                  <button className="btn btn-outline-white btn-pill">White Pill</button>
                </div>
              </div>

              <div className="button-group">
                <h3>Soft & Gradient Styles</h3>
                <div className="button-row">
                  <button className="btn btn-soft">Soft Button</button>
                  <button className="btn btn-soft btn-pill">Soft Pill</button>
                  <button className="btn btn-gradient">Gradient</button>
                  <button className="btn btn-gradient btn-hover-slide">Slide Effect</button>
                </div>
              </div>
            </div>
          </section>

          {/* Forms */}
          <section className="design-section">
            <h2 className="section-title">Formulare</h2>
            <p className="section-description">
              Input-Felder und Form-Komponenten
            </p>
            
            <div className="form-showcase">
              <div className="form-example">
                <div className="form-group">
                  <label className="form-label">Text Input</label>
                  <input type="text" className="form-input" placeholder="Spielername eingeben..." />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email Input</label>
                  <input type="email" className="form-input" placeholder="email@beispiel.de" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Password Input</label>
                  <input type="password" className="form-input" placeholder="••••••••" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Textarea</label>
                  <textarea className="form-input" rows={4} placeholder="Nachricht eingeben..."></textarea>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Select</label>
                  <select className="form-input">
                    <option>Option wählen</option>
                    <option>Schütze</option>
                    <option>Torwart</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Cards */}
          <section className="design-section">
            <h2 className="section-title">Cards</h2>
            <p className="section-description">
              Verschiedene Card-Komponenten
            </p>
            
            <div className="card-showcase">
              <div className="app-card">
                <h3>Standard Card</h3>
                <p>Eine einfache Card mit Inhalt</p>
              </div>
              
              <div className="modern-card">
                <h3>Modern Card</h3>
                <p>Card mit subtilen Hover-Effekten</p>
              </div>
              
              <div className="stadium-section">
                <h3>Stadium Card</h3>
                <p>Card im Stadium-Design mit Glow-Effekt</p>
              </div>
              
              <div className="grass-card">
                <h3>Grass Card</h3>
                <p>Transparente Card für Overlays</p>
              </div>
            </div>
          </section>

          {/* Alerts */}
          <section className="design-section">
            <h2 className="section-title">Alerts</h2>
            <p className="section-description">
              Benachrichtigungen und Warnungen
            </p>
            
            <div className="alert-showcase">
              <div className="alert alert-success">
                <strong>Erfolg!</strong> Du hast das Spiel gewonnen.
              </div>
              
              <div className="alert alert-error">
                <strong>Fehler!</strong> Etwas ist schiefgelaufen.
              </div>
              
              <div className="alert alert-info">
                <strong>Info:</strong> Neue Herausforderung verfügbar.
              </div>
              
              <div className="alert alert-warning">
                <strong>Achtung!</strong> Spiel läuft noch.
              </div>
            </div>
          </section>

          {/* Spacing */}
          <section className="design-section">
            <h2 className="section-title">Spacing</h2>
            <p className="section-description">
              Abstände und Layout-Utilities
            </p>
            
            <div className="spacing-showcase">
              <div className="spacing-example">
                <div className="spacing-box p-1">p-1 (0.25rem)</div>
                <div className="spacing-box p-2">p-2 (0.5rem)</div>
                <div className="spacing-box p-3">p-3 (0.75rem)</div>
                <div className="spacing-box p-4">p-4 (1rem)</div>
                <div className="spacing-box p-6">p-6 (1.5rem)</div>
                <div className="spacing-box p-8">p-8 (2rem)</div>
              </div>
            </div>
          </section>

          {/* Grid System */}
          <section className="design-section">
            <h2 className="section-title">Grid System</h2>
            <p className="section-description">
              Responsive Grid-Layouts
            </p>
            
            <div className="grid-showcase">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="grid-item">50%</div>
                <div className="grid-item">50%</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="grid-item">33.33%</div>
                <div className="grid-item">33.33%</div>
                <div className="grid-item">33.33%</div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="grid-item">25%</div>
                <div className="grid-item">25%</div>
                <div className="grid-item">25%</div>
                <div className="grid-item">25%</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}