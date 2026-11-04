import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Lock, Mail, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);

      // Check onboarding completion
      if (!user.onboarding_completed && user.role !== 'admin' && user.role !== 'doctor') {
        navigate(`/onboarding/${user.role}`);
        return;
      }

      // Role specific redirection
      const redirectState = location.state?.from?.pathname;
      if (redirectState) {
        navigate(redirectState);
      } else if (user.role === 'donor') {
        navigate('/donor/dashboard');
      } else if (user.role === 'receiver') {
        navigate('/receiver/dashboard');
      } else if (user.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-narrow my-12">
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div className="brand-icon" style={{ margin: '0 auto 12px', width: '48px', height: '48px' }}>
          <Heart size={24} fill="#ffffff" />
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-slate-900)' }}>
          Sign in to LifeLink
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-slate-500)', marginTop: '4px' }}>
          Access your donor cooldown, emergency requests, or doctor verification queue
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
              style={{ marginTop: '20px' }}
            >
              {loading ? 'Verifying Credentials...' : 'Sign In'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        <div className="card-footer" style={{ textAlign: 'center', fontSize: '13px' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

