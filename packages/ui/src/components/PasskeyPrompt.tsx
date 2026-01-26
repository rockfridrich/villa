import { forwardRef, type HTMLAttributes } from "react";
import { clsx } from "clsx";
import { colors } from "../theme/colors";
import { Logo } from "./Logo";

export interface PasskeyPromptProps extends HTMLAttributes<HTMLDivElement> {
  state: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
  onRetry?: () => void;
}

export const PasskeyPrompt = forwardRef<HTMLDivElement, PasskeyPromptProps>(
  ({ className, state, errorMessage = "Something went wrong", onRetry, style, ...props }, ref) => {
    
    const spinKeyframes = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;

    return (
      <div
        ref={ref}
        className={clsx(className)}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          textAlign: 'center',
          fontFamily: 'sans-serif',
          color: colors.ink,
          ...style,
        }}
        {...props}
      >
        <style>{spinKeyframes}</style>
        
        <div style={{ marginBottom: 40 }}>
          <Logo size="lg" />
        </div>

        {state === 'idle' && (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 12px 0' }}>Sign in with Passkey</h2>
            <p style={{ fontSize: 16, color: colors.inkMuted, margin: 0, lineHeight: 1.5 }}>
              Use your face, fingerprint, or device PIN to sign in instantly.
            </p>
          </>
        )}

        {state === 'loading' && (
          <>
            <div style={{ 
              width: 48, 
              height: 48, 
              border: `4px solid ${colors.ink}20`, 
              borderTopColor: colors.accent,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: 24
            }} />
            <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Waiting for device...</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div style={{ 
              width: 64, 
              height: 64, 
              borderRadius: '50%', 
              backgroundColor: colors.successText + '20',
              color: colors.successText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px 0' }}>Success</h2>
            <p style={{ fontSize: 16, color: colors.inkMuted, margin: 0 }}>You are now signed in.</p>
          </>
        )}

        {state === 'error' && (
          <>
            <div style={{ 
              width: 64, 
              height: 64, 
              borderRadius: '50%', 
              backgroundColor: colors.errorText + '20',
              color: colors.errorText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px 0', color: colors.errorText }}>Authentication Failed</h2>
            <p style={{ fontSize: 15, color: colors.inkMuted, margin: '0 0 32px 0', lineHeight: 1.5 }}>
              {errorMessage}
            </p>
            {onRetry && (
              <button 
                onClick={onRetry}
                style={{
                  backgroundColor: colors.ink,
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 24px',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                Try Again
              </button>
            )}
          </>
        )}
      </div>
    );
  }
);

PasskeyPrompt.displayName = "PasskeyPrompt";
