import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { postJson } from '../lib/api';
import { setUserSession, type User } from '../lib/auth';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const state = location.state as { email?: string; demoOtp?: string } | null;
    const fromState = state?.email || '';
    const stored = localStorage.getItem('pendingVerificationEmail') || '';
    const initialEmail = fromState || stored;
    setEmail(initialEmail);

    const demo = state?.demoOtp || localStorage.getItem('demoOtp');
    if (demo) {
      setDemoCode(demo);
      setOtp(demo);
    }
  }, [location.state]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email || !otp.trim()) {
      setError('Please enter your email and 6-digit verification code.');
      return;
    }

    if (otp.trim().length !== 6) {
      setError('Verification code must be exactly 6 digits.');
      return;
    }

    try {
      setLoading(true);
      const res = await postJson<{ message?: string; user?: User; tokens?: { accessToken: string } }>(
        '/auth/verify-email',
        { email: email.trim(), otp: otp.trim() },
        false
      );

      localStorage.removeItem('pendingVerificationEmail');
      localStorage.removeItem('demoOtp');

      if (res.user && res.tokens?.accessToken) {
        setUserSession(res.user, res.tokens.accessToken);
        setMessage('✅ Email verified successfully!');

        setTimeout(() => {
          const user = res.user!;
          if (user.status && ['PENDING', 'PENDING_HOSPITAL_APPROVAL', 'PENDING_DOCTOR_APPROVAL'].includes(user.status)) {
            navigate('/pending-approval');
          } else {
            const roleRedirects: Record<string, string> = {
              SYSTEM_ADMIN: '/admin-dashboard',
              HOSPITAL_ADMIN: '/hospital-dashboard',
              DOCTOR: '/doctor-dashboard',
              PATIENT: '/patient-dashboard'
            };
            navigate(roleRedirects[user.role] || '/patient-dashboard');
          }
        }, 1200);
      } else {
        setMessage('Email verified successfully. You can now log in.');
        setTimeout(() => navigate('/auth'), 1500);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email address missing. Please return to registration.');
      return;
    }

    try {
      setResending(true);
      setError('');
      setMessage('');
      const res = await postJson<{ message?: string; demoOtp?: string }>('/auth/resend-otp', { email: email.trim() }, false);
      setMessage('📬 A new 6-digit verification code has been sent to your email.');
      if (res?.demoOtp) {
        setDemoCode(res.demoOtp);
        setOtp(res.demoOtp);
        localStorage.setItem('demoOtp', res.demoOtp);
      }
      setCooldown(60);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3 py-5">
      <div className="card shadow-lg border-0 overflow-hidden" style={{ width: '100%', maxWidth: '460px', borderRadius: '16px' }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="mx-auto mb-3 rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: 76, height: 76 }}>
              <span style={{ fontSize: 32 }}>✉️</span>
            </div>
            <h3 className="fw-bold mb-1 text-dark">Email Verification</h3>
            <p className="text-muted small mb-0">Enter the 6-digit OTP code sent to:</p>
            <span className="fw-bold text-primary small">{email || 'your email'}</span>
          </div>

          {demoCode && (
            <div className="alert alert-info rounded-3 py-2 small text-center mb-3">
              <i className="fa fa-key me-1"></i> <strong>Demo Verification Code:</strong> <code className="fs-6 fw-bold text-primary ms-1">{demoCode}</code>
              <br/><span className="text-muted extra-small">(Logged in server terminal as well)</span>
            </div>
          )}

          {error && (
            <div className="alert alert-danger rounded-3 py-2 small" role="alert">
              <i className="fa fa-exclamation-triangle me-2"></i>{error}
            </div>
          )}
          {message && (
            <div className="alert alert-success rounded-3 py-2 small" role="alert">
              {message}
            </div>
          )}

          <form onSubmit={handleVerify}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary">6-Digit OTP Code</label>
              <input
                type="text"
                className="form-control text-center fs-3 tracking-widest fw-bold text-primary py-2"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="- - - - - -"
                inputMode="numeric"
                maxLength={6}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2.5 rounded-pill fw-semibold mb-3" disabled={loading}>
              {loading ? 'Verifying Code...' : 'Verify Code & Proceed'}
            </button>
          </form>

          <div className="d-flex justify-content-between align-items-center border-top pt-3">
            <button type="button" className="btn btn-link btn-sm text-decoration-none text-muted p-0" onClick={() => navigate('/auth')}>
              &larr; Back to login
            </button>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm rounded-pill px-3"
              onClick={handleResend}
              disabled={resending || cooldown > 0 || !email}
            >
              {resending ? 'Sending...' : cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend OTP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
