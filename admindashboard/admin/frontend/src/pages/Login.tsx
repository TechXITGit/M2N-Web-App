import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import TwoFactorSetup from '../components/TwoFactorSetup';
import TwoFactorLogin from '../components/TwoFactorLogin';

const Login: React.FC = () => {
  const [step, setStep] = useState<'login' | 'setup' | '2fa'>('login');
  const [challengeToken, setChallengeToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const config = {
        headers: {
          'Content-type': 'application/json',
        },
      };

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/login`,
        { email, password },
        config
      );

      if (data.requiresSetup) {
        setChallengeToken(data.challengeToken);
        setStep('setup');
        return;
      }
      if (data.requires2FA) {
        setChallengeToken(data.challengeToken);
        setStep('2fa');
        return;
      }

      login(data);

      if (data.role === 'superadmin') {
        navigate('/superadmin');
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-porcelain)' }}>
      {step === 'setup' && <TwoFactorSetup challengeToken={challengeToken} />}
      {step === '2fa' && <TwoFactorLogin challengeToken={challengeToken} />}
      {step === 'login' && (
        <div className="w-full max-w-md p-10 bg-white shadow-xl" style={{ borderColor: 'var(--color-line)', borderWidth: '1px' }}>
          <h2 className="t-hero text-4xl mb-2 text-center" style={{ color: 'var(--color-ink)' }}>M2N Admin</h2>
          <p className="u-label text-center mb-10" style={{ color: 'var(--color-muted)' }}>M2N Group of Hotels</p>

          {error && <div className="p-3 mb-6 bg-red-100 text-red-700 text-sm">{error}</div>}

          <form onSubmit={submitHandler} className="space-y-8">
            <div>
              <label className="u-label-sm block mb-2" style={{ color: 'var(--color-ink)' }}>Email Address</label>
              <input
                type="email"
                className="field w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="u-label-sm block mb-2" style={{ color: 'var(--color-ink)' }}>Password</label>
              <input
                type="password"
                className="field w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-outline w-full justify-center mt-6"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Login;
