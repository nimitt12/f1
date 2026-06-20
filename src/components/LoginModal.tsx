import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

interface AuthUser {
  id: string;
  name: string;
  picture: string;
  email: string;
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  title?: string;
  subtitle?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  onLoginSuccess, 
  title = "Track Your Rivals", 
  subtitle = "Sign in to select your favorite drivers from your account and see their live telemetry clash side-by-side." 
}) => {
  if (!isOpen) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: credentialResponse.credential })
        });
        
        if (!response.ok) throw new Error('Backend authentication failed');
        
        const data = await response.json();
        // Persist the JWT so the admin portal can authorize against the backend
        if (data.token) localStorage.setItem('f1_token', data.token);
        // Standardize the user object (handle potential full_name/avatar_url from backend)
        const userData = {
          ...data.user,
          name: data.user.name || data.user.full_name || 'User',
          picture: data.user.picture || data.user.avatar_url || data.user.picture_url || ''
        };
        onLoginSuccess(userData);
      } catch (error) {
        console.error('Backend auth failed:', error);
      }
    }
  };

  return (
    <div className="battle-modal-overlay" onClick={onClose}>
      <div className="battle-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-checker"></div>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-content">
          <div className="modal-eyebrow">Personalized Insight</div>
          <h3 className="modal-title">
            {title.includes('<em>') ? title : (
              <>
                {title.split(' ').slice(0, -1).join(' ')} <em>{title.split(' ').pop()}</em>
              </>
            )}
          </h3>
          <p className="modal-text">{subtitle}</p>
          <div className="modal-action">
            <GoogleLogin 
              onSuccess={handleSuccess}
              onError={() => console.log('Login Failed')}
              theme="filled_black"
              shape="pill"
              width="250"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
