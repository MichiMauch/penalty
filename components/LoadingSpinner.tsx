'use client';

interface LoadingSpinnerProps {
  text: string;
}

export default function LoadingSpinner({ text }: LoadingSpinnerProps) {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999999,
        overflow: 'hidden',
        margin: 0,
        padding: 0
      }}
    >
      <div 
        style={{
          color: 'white',
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          textAlign: 'center' as const,
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '2rem 3rem',
          borderRadius: '1rem',
          border: '2px solid #10b981',
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          gap: '1.5rem'
        }}
      >
        <div 
          style={{
            fontSize: '3rem',
            animation: 'spin 1s linear infinite'
          }}
        >
          ⚽
        </div>
        <div>{text}</div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}