import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

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
  const handleSuccess = (credentialResponse: any) => {
    if (credentialResponse.credential) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded: any = jwtDecode(credentialResponse.credential);
      onLoginSuccess({
        id: decoded.sub,
        name: decoded.name,
        picture: decoded.picture,
        email: decoded.email
      });
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
