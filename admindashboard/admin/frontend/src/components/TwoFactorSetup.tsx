import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

interface TwoFactorSetupProps {
  challengeToken: string;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ challengeToken }) => {
  const [qrCode, setQrCode] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifiedData, setVerifiedData] = useState<any>(null);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQr = async () => {
      try {
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/2fa/setup`, { challengeToken });
        setQrCode(data.qrCode);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || err.message || 'Failed to generate 2FA setup');
      }
    };
    fetchQr();
  }, [challengeToken]);

  const handleVerifyModified = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/2fa/verify-setup`, {
        challengeToken,
        code
      });
      setBackupCodes(data.backupCodes);
      setVerifiedData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const finalizeLogin = () => {
    if (verifiedData) {
      login(verifiedData);
      if (verifiedData.role === 'superadmin') navigate('/superadmin');
      else navigate('/admin');
    }
  };

  if (backupCodes.length > 0) {
    return (
      <div className="w-full max-w-md p-10 bg-white shadow-xl" style={{ borderColor: 'var(--color-line)', borderWidth: '1px' }}>
        <h2 className="t-hero text-3xl mb-4 text-center text-green-600">2FA Enabled ✓</h2>
        <p className="u-label text-center mb-6 text-gray-600">
          Save these backup codes in a secure place. Each can be used only once if you lose access to your authenticator app.
        </p>
        <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm grid grid-cols-2 gap-2 mb-6 text-center">
          {backupCodes.map((c, i) => (
            <div key={i} className="bg-white p-2 border border-gray-300">{c}</div>
          ))}
        </div>
        <button onClick={finalizeLogin} className="btn-outline w-full justify-center">
          Continue to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-10 bg-white shadow-xl" style={{ borderColor: 'var(--color-line)', borderWidth: '1px' }}>
      <h2 className="t-hero text-3xl mb-2 text-center" style={{ color: 'var(--color-ink)' }}>Setup 2FA</h2>
      <p className="u-label text-center mb-6 text-gray-500">Scan this QR code with Google Authenticator</p>

      {error && <div className="p-3 mb-6 bg-red-100 text-red-700 text-sm">{error}</div>}

      <div className="flex justify-center mb-6">
        {qrCode ? <img src={qrCode} alt="QR Code" className="w-48 h-48" /> : <div className="w-48 h-48 bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Loading...</div>}
      </div>

      <form onSubmit={handleVerifyModified} className="space-y-6">
        <div>
          <label className="u-label-sm block mb-2 text-center">Enter the 6-digit code</label>
          <input
            type="text"
            className="field w-full text-center text-2xl tracking-widest font-mono"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            required
            autoFocus
          />
        </div>
        <button type="submit" className="btn-outline w-full justify-center" disabled={loading || code.length !== 6}>
          {loading ? 'Verifying...' : 'Verify & Enable'}
        </button>
      </form>
    </div>
  );
};

export default TwoFactorSetup;
