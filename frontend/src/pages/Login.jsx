import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-primary" style={{
      backgroundImage: `
        radial-gradient(circle at 15% 50%, rgba(0, 174, 239, 0.1), transparent 25%),
        radial-gradient(circle at 85% 30%, rgba(0, 136, 204, 0.08), transparent 25%)
      `
    }}>
      {/* Decorative background vectors */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary opacity-10 blur-[100px] rounded-full point-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-secondary opacity-10 blur-[120px] rounded-full point-events-none"></div>

      <div className="w-full max-w-md p-8 relative z-10 animate-fade-in text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-2xl flex items-center justify-center shadow-glow">
            <img src="/lab448_icon.png" alt="Lab448" className="w-10 h-10 shadow-sm rounded-lg" />
          </div>
        </div>
        
        <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-accent-primary to-text-primary tracking-tight" style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--text-primary))',
            WebkitBackgroundClip: 'text',
          }}>
          Welcome Back
        </h1>
        <p className="text-secondary tracking-wide mb-8">Sign in to your Lab448 portal.</p>

        <form onSubmit={handleSubmit} className="card text-left">
          {error && (
            <div className="mb-6 p-4 rounded-md border text-sm font-medium animate-fade-in flex items-center gap-3 badge-danger">
              <span className="material-symbols-rounded icon-md">error</span>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-bold text-secondary tracking-wider uppercase mb-2 block">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-rounded absolute left-3 top-3 text-muted">mail</span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@lab448.com"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-secondary tracking-wider uppercase mb-2 flex justify-between">
                <span>Password</span>
              </label>
              <div className="relative">
                <span className="material-symbols-rounded absolute left-3 top-3 text-muted">lock</span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary w-full mt-2 py-3 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-rounded icon-sm animate-spin">progress_activity</span>
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <span className="material-symbols-rounded icon-sm">arrow_forward</span>
                </span>
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-8 text-xs text-muted">
          Secured by Lab448 Infrastructure
        </div>
      </div>
    </div>
  );
}
