import React, { useState } from 'react';
import { api } from '../services/api';
import { Lock, Mail, User, ShieldCheck } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (token: string, username: string, email: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, showToast }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Backend LoginDto has [Required] on Username, but uses Email to fetch the user.
        // So we send email in both email and username properties to satisfy validation.
        const response = await api.account.login({
          email,
          username: email, // Bypasses Backend validation constraint
          password
        });
        showToast(`Welcome back, ${response.username}!`, 'success');
        onAuthSuccess(response.token, response.username, response.email);
      } else {
        const response = await api.account.register({
          username,
          email,
          password
        });
        showToast('Registration successful! Welcome.', 'success');
        onAuthSuccess(response.token, response.username, response.email);
      }
    } catch (error: any) {
      showToast(error.message || 'An error occurred during authentication', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper animate-fade-in">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <div className="brand-logo" style={{ margin: '0 auto' }}>
            <ShieldCheck size={24} />
          </div>
          <h2 className="auth-title">
            {isLogin ? 'Sign In to Order Flow' : 'Create an Account'}
          </h2>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Enter your credentials to access the management portal' 
              : 'Register a new administrator account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="search-input-wrapper" style={{ maxWidth: '100%' }}>
                <User size={18} className="search-icon" />
                <input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="search-input-wrapper" style={{ maxWidth: '100%' }}>
              <Mail size={18} className="search-icon" />
              <input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="search-input-wrapper" style={{ maxWidth: '100%' }}>
              <Lock size={18} className="search-icon" />
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '1rem', width: '100%' }}
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" />
            ) : (
              isLogin ? 'Sign In' : 'Register'
            )}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? (
            <p>
              Don't have an account?{' '}
              <span className="auth-link" onClick={() => setIsLogin(false)}>
                Register here
              </span>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <span className="auth-link" onClick={() => setIsLogin(true)}>
                Sign in here
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
