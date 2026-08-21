import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, fetchCurrentUser, logout } from '../lib/auth';

export default function PendingApproval() {
  const navigate = useNavigate();

  const [user, setUser] = useState(getCurrentUser());
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  const handleCheckStatus = async () => {
    setChecking(true);
    setMessage('');

    try {
      const updated = await fetchCurrentUser();

      if (updated) {
        setUser(updated);

        const status = updated.status;

        if (status === 'ACTIVE' || status === 'APPROVED') {
          setMessage(
            'Your account has been approved and is now active.'
          );

          setTimeout(() => {
            const roleRedirects: Record<string, string> = {
              SYSTEM_ADMIN: '/admin-dashboard',
              HOSPITAL_ADMIN: '/hospital-dashboard',
              DOCTOR: '/doctor-dashboard',
              PATIENT: '/patient-dashboard',
            };

            navigate(
              roleRedirects[updated.role] || '/patient-dashboard'
            );
          }, 1200);
        } else {
          setMessage(
            'Your registration is still under review. Please check back soon.'
          );
        }
      }
    } catch {
      setMessage('Unable to check your status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleSwitchAccount = () => {
    logout();
    navigate('/auth');
  };

  const getStatusInfo = () => {
    if (!user) {
      return {
        title: 'Application Under Review',
        text: 'Your registration is currently pending review.',
        type: 'pending',
      };
    }

    switch (user.role) {
      case 'HOSPITAL_ADMIN':
        if (user.status === 'REJECTED') {
          return {
            title: 'Registration Rejected',
            text: 'Your hospital registration request was rejected by the System Administrator.',
            type: 'rejected',
          };
        }

        return {
          title: 'Hospital Registration Pending',
          text: 'Your hospital application has been submitted and is waiting for administrator review.',
          type: 'pending',
        };

      case 'DOCTOR':
        if (user.status === 'REJECTED') {
          return {
            title: 'Application Rejected',
            text: 'Your doctor application was rejected.',
            type: 'rejected',
          };
        }

        if (user.status === 'HOSPITAL_APPROVED') {
          return {
            title: 'Final Approval Pending',
            text: 'Your hospital administrator approved your application. It is now waiting for final administrator approval.',
            type: 'pending',
          };
        }

        return {
          title: 'Hospital Approval Pending',
          text: 'Your doctor application has been submitted to your selected hospital administrator for review.',
          type: 'pending',
        };

      case 'PATIENT':
        if (user.status === 'REJECTED') {
          return {
            title: 'Request Rejected',
            text: 'Your patient connection request was rejected by the doctor.',
            type: 'rejected',
          };
        }

        return {
          title: 'Doctor Approval Pending',
          text: 'Your registration has been submitted to your selected doctor for review.',
          type: 'pending',
        };

      default:
        return {
          title: 'Application Pending',
          text: 'Your account is waiting for administrator approval.',
          type: 'pending',
        };
    }
  };

  const statusInfo = getStatusInfo();

  const isRejected = statusInfo.type === 'rejected';

  const roleName =
    user?.role
      ?.replaceAll('_', ' ')
      ?.toLowerCase()
      ?.replace(/\b\w/g, (letter: string) => letter.toUpperCase()) ||
    'User';

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-5"
      style={{
        background: '#f3f3f5',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#ffffff',
          borderRadius: '32px',
          padding: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '26px',
            padding: '34px 30px 28px',
          }}
        >
          {/* Top label */}
          <div
            className="text-center"
            style={{
              color: '#8a8a8f',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '24px',
              letterSpacing: '0.2px',
            }}
          >
            ACCOUNT STATUS
          </div>

          {/* Status icon */}
          <div className="d-flex justify-content-center mb-4">
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: '92px',
                height: '92px',
                borderRadius: '50%',
                background: isRejected ? '#fff0f0' : '#e9f8f3',
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: '66px',
                  height: '66px',
                  borderRadius: '50%',
                  background: isRejected ? '#ffe1e1' : '#d7f4eb',
                  fontSize: '30px',
                }}
              >
                {isRejected ? '×' : '✓'}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h2
              style={{
                fontSize: '27px',
                fontWeight: 700,
                color: '#27272a',
                marginBottom: '10px',
                letterSpacing: '-0.6px',
              }}
            >
              {statusInfo.title}
            </h2>

            <p
              style={{
                fontSize: '15px',
                lineHeight: 1.6,
                color: '#85858b',
                margin: '0 auto',
                maxWidth: '400px',
              }}
            >
              {statusInfo.text}
            </p>
          </div>

          {/* Status selector-style control */}
          <div
            className="d-flex align-items-center justify-content-between mt-4"
            style={{
              background: '#f2f2f4',
              borderRadius: '18px',
              padding: '6px',
            }}
          >
            <div
              className="text-center"
              style={{
                flex: 1,
                background: '#ffffff',
                borderRadius: '14px',
                padding: '11px 8px',
                boxShadow: '0 2px 7px rgba(0,0,0,0.05)',
                color: '#27272a',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Current
            </div>

            <div
              className="text-center"
              style={{
                flex: 1,
                color: '#99999f',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              {isRejected ? 'Rejected' : 'Under Review'}
            </div>
          </div>

          {/* Account information */}
          <div
            className="mt-4"
            style={{
              borderTop: '1px solid #eeeeef',
            }}
          >
            <div
              className="d-flex align-items-center justify-content-between py-3"
              style={{
                borderBottom: '1px solid #eeeeef',
              }}
            >
              <span
                style={{
                  color: '#77777d',
                  fontSize: '14px',
                }}
              >
                Registered Email
              </span>

              <span
                style={{
                  color: '#303035',
                  fontSize: '14px',
                  fontWeight: 600,
                  maxWidth: '55%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.email || 'N/A'}
              </span>
            </div>

            <div
              className="d-flex align-items-center justify-content-between py-3"
              style={{
                borderBottom: '1px solid #eeeeef',
              }}
            >
              <span
                style={{
                  color: '#77777d',
                  fontSize: '14px',
                }}
              >
                Account Type
              </span>

              <span
                style={{
                  color: '#303035',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {roleName}
              </span>
            </div>

            <div className="d-flex align-items-center justify-content-between py-3">
              <span
                style={{
                  color: '#77777d',
                  fontSize: '14px',
                }}
              >
                Application Status
              </span>

              <div className="d-flex align-items-center gap-2">
                <span
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: isRejected
                      ? '#e05252'
                      : '#16a085',
                  }}
                />

                <span
                  style={{
                    color: isRejected ? '#d44848' : '#16896f',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {user?.status || 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className="mt-3"
              style={{
                background: message.includes('approved')
                  ? '#eaf8f3'
                  : '#f4f4f5',
                borderRadius: '16px',
                padding: '13px 15px',
                color: message.includes('approved')
                  ? '#147d66'
                  : '#66666c',
                fontSize: '13px',
                textAlign: 'center',
              }}
            >
              {message}
            </div>
          )}

          {/* Main action */}
          {!isRejected && (
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-100 border-0"
              style={{
                marginTop: '20px',
                height: '54px',
                borderRadius: '18px',
                background: '#12a47f',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 600,
                boxShadow: '0 8px 20px rgba(18, 164, 127, 0.20)',
                cursor: checking ? 'wait' : 'pointer',
              }}
            >
              {checking ? 'Checking...' : 'Check Approval Status'}
            </button>
          )}

          {/* Secondary actions */}
          <div
            className="d-flex gap-2 mt-3"
          >
            <button
              onClick={handleSwitchAccount}
              className="flex-grow-1 border-0"
              style={{
                height: '48px',
                borderRadius: '16px',
                background: '#f2f2f4',
                color: '#444449',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Switch Account
            </button>

            <button
              onClick={handleLogout}
              className="border-0"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: '#f2f2f4',
                color: '#77777d',
                fontSize: '18px',
              }}
              title="Logout"
            >
              ↪
            </button>
          </div>

          {/* Footer */}
          <div
            className="text-center mt-4"
            style={{
              color: '#b0b0b5',
              fontSize: '11px',
            }}
          >
            Your account will become available automatically after approval.
          </div>
        </div>
      </div>
    </div>
  );
}