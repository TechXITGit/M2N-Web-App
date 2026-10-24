import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

interface TwoFactorLoginProps {
  challengeToken: string;
}

const TwoFactorLogin: React.FC<TwoFactorLoginProps> = ({ challengeToken }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useBackup, setUseBackup] = useState(false);
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = useBackup ? '/api/auth/2fa/verify-backup-code' : '/api/auth/2fa/verify-login';

    try {
      const { data } = await axios.post(`http://localhost:6001${endpoint}`, {
        challengeToken,
        code
      });

      login(data);
      if (data.role === 'superadmin') navigate('/superadmin');
      else navigate('/reception');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-10 bg-white shadow-xl" style={{ borderColor: 'var(--color-line)', borderWidth: '1px' }}>
      <h2 className="t-hero text-3xl mb-2 text-center" style={{ color: 'var(--color-ink)' }}>Two-Factor Authentication</h2>
      <p className="u-label text-center mb-6 text-gray-500">
        {useBackup ? 'Enter one of your 8-character backup codes.' : 'Open Google Authenticator on your phone and enter the 6-digit code.'}
      </p>

      {error && <div className="p-3 mb-6 bg-red-100 text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="u-label-sm block mb-2 text-center">
            {useBackup ? 'Backup Code' : '6-Digit Code'}
          </label>
          <input
            type="text"
            className="field w-full text-center text-2xl tracking-widest font-mono"
            value={code}
            onChange={(e) => {
              if (useBackup) {
                setCode(e.target.value.toUpperCase());
              } else {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
              }
            }}
            placeholder={useBackup ? 'XXXX-XXXX' : '000000'}
            required
            autoFocus
          />
        </div>
        <button type="submit" className="btn-outline w-full justify-center" disabled={loading || (!useBackup && code.length !== 6)}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => { setUseBackup(!useBackup); setCode(''); setError(''); }}
            className="text-blue-600 hover:underline text-sm font-semibold"
          >
            {useBackup ? 'Use Authenticator Code' : 'Use Backup Code'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TwoFactorLogin;
