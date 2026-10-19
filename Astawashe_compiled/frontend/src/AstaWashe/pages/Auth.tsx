import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../lib/auth';
import { getJson } from '../lib/api';
import '../styles/auth.css';

interface HospitalOption {
  id: string;
  name: string;
  city?: string;
  organizationType?: string;
}

interface DoctorOption {
  id: string;
  name: string;
  specialization?: string;
}

export default function Auth() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);

  // Login State
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<'PATIENT' | 'HOSPITAL_ADMIN' | 'SYSTEM_ADMIN' | 'DOCTOR'>('PATIENT');

  // Registration Step State
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  const [selectedRole, setSelectedRole] = useState<'PATIENT' | 'DOCTOR' | 'HOSPITAL'>('PATIENT');

  // Registration Form Fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Hospital-Specific Registration Fields
  const [hospitalName, setHospitalName] = useState('');
  const [organizationType, setOrganizationType] = useState('General Hospital');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  // Doctor-Specific Registration Fields
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');

  // Patient-Specific Registration Fields
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('OTHER');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');

  // Backend Dropdown Options
  const [approvedHospitals, setApprovedHospitals] = useState<HospitalOption[]>([]);
  const [hospitalDoctors, setHospitalDoctors] = useState<DoctorOption[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // Status & Error
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch approved hospitals when entering Step 3 or when role changes
  useEffect(() => {
    if (isRegister && regStep === 3 && (selectedRole === 'DOCTOR' || selectedRole === 'PATIENT')) {
      loadApprovedHospitals();
    }
  }, [isRegister, regStep, selectedRole]);

  // Fetch doctors whenever selected hospital changes for Patient
  useEffect(() => {
    if (selectedRole === 'PATIENT' && selectedHospitalId) {
      loadHospitalDoctors(selectedHospitalId);
    } else {
      setHospitalDoctors([]);
      setSelectedDoctorId('');
    }
  }, [selectedHospitalId, selectedRole]);

  const loadApprovedHospitals = async () => {
    try {
      setError('');
      const res = await getJson<{ data: HospitalOption[] }>('/hospitals/approved', false);
      const list = res.data || (Array.isArray(res) ? res : []);
      setApprovedHospitals(list);
    } catch {
      setError('Failed to fetch approved hospitals from server.');
    }
  };

  const loadHospitalDoctors = async (hospId: string) => {
    try {
      setError('');
      const res = await getJson<{ data: DoctorOption[] }>(`/hospitals/${hospId}/doctors`, false);
      const list = res.data || (Array.isArray(res) ? res : []);
      setHospitalDoctors(list);
    } catch {
      setError('Failed to fetch doctors for selected hospital.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginId || !loginPassword) {
      setError('Please enter your email/phone and password');
      return;
    }

    try {
      setLoading(true);
      const response = await login(loginId, loginPassword);
      const user = response.user;

      if (!user) {
        setError('Login failed. Please check credentials.');
        return;
      }

      if (user.role && user.role !== loginRole && !(user.role === 'SYSTEM_ADMIN' && loginRole === 'SYSTEM_ADMIN')) {
        setError(`Your account role is ${user.role.replace('_', ' ')}. Please select the correct role option.`);
        return;
      }

      // Check user approval status
      if (user.status && ['PENDING', 'PENDING_HOSPITAL_APPROVAL', 'PENDING_DOCTOR_APPROVAL', 'REJECTED', 'SUSPENDED'].includes(user.status)) {
        navigate('/pending-approval');
        return;
      }

      const roleRedirects: Record<string, string> = {
        SYSTEM_ADMIN: '/admin-dashboard',
        HOSPITAL_ADMIN: '/hospital-dashboard',
        DOCTOR: '/doctor-dashboard',
        PATIENT: '/patient-dashboard'
      };
      navigate(roleRedirects[user.role] || '/patient-dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep1 = () => {
    setError('');
    setRegStep(2);
  };

  const handleNextStep2 = () => {
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (selectedRole === 'HOSPITAL') {
      if (!hospitalName.trim()) {
        setError('Hospital name is required.');
        return;
      }
      if (!fullName.trim()) {
        setError('Administrative contact name is required.');
        return;
      }
    } else {
      if (!fullName.trim()) {
        setError('Full name is required.');
        return;
      }
    }

    setRegStep(3);
  };

  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedRole === 'DOCTOR' && !selectedHospitalId) {
      setError('Please select an approved hospital.');
      return;
    }

    if (selectedRole === 'PATIENT') {
      if (!selectedHospitalId) {
        setError('Please select an approved hospital.');
        return;
      }
      if (!selectedDoctorId) {
        setError('Please select an active doctor from the selected hospital.');
        return;
      }
    }

    try {
      setLoading(true);

      const payload: Record<string, any> = {
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role: selectedRole === 'HOSPITAL' ? 'HOSPITAL_ADMIN' : selectedRole,
        fullName: fullName.trim() || hospitalName.trim(),
        name: fullName.trim() || hospitalName.trim()
      };

      if (selectedRole === 'HOSPITAL') {
        payload.hospitalName = hospitalName.trim();
        payload.organizationType = organizationType;
        payload.licenseNumber = licenseNumber.trim() || undefined;
        payload.registrationNumber = registrationNumber.trim() || undefined;
        payload.city = city.trim() || undefined;
        payload.region = region.trim() || undefined;
        payload.address = address.trim() || undefined;
        payload.description = description.trim() || undefined;
      } else if (selectedRole === 'DOCTOR') {
        payload.licenseNumber = licenseNumber.trim() || undefined;
        payload.specialization = specialization.trim() || undefined;
        payload.experience = experience.trim() || undefined;
        payload.hospitalId = selectedHospitalId;
      } else if (selectedRole === 'PATIENT') {
        payload.hospitalId = selectedHospitalId;
        payload.doctorId = selectedDoctorId;
        payload.dob = dob || undefined;
        payload.gender = gender;
        payload.address = address.trim() || undefined;
        payload.emergencyContact = emergencyContact.trim() || undefined;
        payload.emergencyContactPhone = emergencyContactPhone.trim() || undefined;
        payload.bloodGroup = bloodGroup.trim() || undefined;
        payload.allergies = allergies.trim() || undefined;
        payload.chronicConditions = chronicConditions.trim() || undefined;
      }

      const res = await register(payload);

      if (res.requiresEmailVerification) {
        localStorage.setItem('pendingVerificationEmail', email.trim());
        const demoCode = (res as any).demoOtp;
        if (demoCode) {
          localStorage.setItem('demoOtp', demoCode);
        }
        navigate('/verify-email', { state: { email: email.trim(), demoOtp: demoCode } });
        return;
      }

      navigate('/pending-approval');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light py-4 px-2">
      <div className={`auth-container ${isRegister ? 'active' : ''}`}>
        
        {/* LOGIN FORM BOX */}
        <div className="form-box login">
          <form onSubmit={handleLogin} className="auth-form">
            <h1>Sign In</h1>
            <p className="text-muted small mb-3">Access your AstaWashe portal</p>

            {error && !isRegister && (
              <div className="alert alert-danger py-1.5 px-3 small rounded-3 mb-3 text-start" role="alert">
                <i className="fa fa-exclamation-circle me-1"></i>{error}
              </div>
            )}

            <div className="input-box">
              <input
                type="text"
                placeholder="Email or Phone"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
              />
              <i className="fa fa-envelope"></i>
            </div>

            <div className="input-box">
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              <i className="fa fa-lock"></i>
            </div>

            <div className="input-box">
              <select
                value={loginRole}
                onChange={(e) => setLoginRole(e.target.value as any)}
                required
              >
                <option value="PATIENT">Patient Account</option>
                <option value="DOCTOR">Doctor Account</option>
                <option value="HOSPITAL_ADMIN">Hospital Administrator</option>
                <option value="SYSTEM_ADMIN">System Administrator</option>
              </select>
              <i className="fa fa-user-shield"></i>
            </div>

            <div className="forgot-link">
              <a href="#">Forgot Password?</a>
            </div>

            <button type="submit" className="auth-btn mb-3" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <p className="small text-muted mb-2">or sign in with social platforms</p>
            <div className="social-icons">
              <a href="#" className="google"><i className="fab fa-google"></i></a>
              <a href="#" className="facebook"><i className="fab fa-facebook-f"></i></a>
            </div>
          </form>
        </div>

        {/* REGISTRATION FORM BOX */}
        <div className="form-box register">
          <div className="auth-form d-flex flex-column h-100 justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h1 className="mb-0 fs-3">Registration</h1>
                <span className="badge bg-primary text-white rounded-pill px-2.5 py-1 small">
                  Step {regStep} of 3
                </span>
              </div>

              {error && isRegister && (
                <div className="alert alert-danger py-1 px-2 small rounded-3 mb-2 text-start" role="alert">
                  <i className="fa fa-exclamation-circle me-1"></i>{error}
                </div>
              )}

          {/* Step 1: Role Selection Cards */}
{regStep === 1 && (
  <div className="text-start">
    <p className="text-muted small mb-3">
      Select account type to register:
    </p>

    <div className="d-flex flex-column gap-3 mb-3">

      {/* Patient */}
      <div
        className={`role-selection-card p-3 rounded-3 border transition-all ${
          selectedRole === 'PATIENT'
            ? 'border-primary bg-primary bg-opacity-10 fw-bold'
            : 'bg-light'
        }`}
        onClick={() => setSelectedRole('PATIENT')}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="role-image-wrapper">
            <img
              src="/images/registration/p2.png"
              alt="Patient"
              className="role-image"
            />
          </div>

          <div className="flex-grow-1">
            <div className="small text-dark fw-semibold">
              Patient
            </div>
            <div
              className="text-muted"
              style={{ fontSize: '11px' }}
            >
              Manage prescriptions & adherence reminders
            </div>
          </div>

          {selectedRole === 'PATIENT' && (
            <div className="role-check">✓</div>
          )}
        </div>
      </div>

      {/* Doctor */}
      <div
        className={`role-selection-card p-3 rounded-3 border transition-all ${
          selectedRole === 'DOCTOR'
            ? 'border-primary bg-primary bg-opacity-10 fw-bold'
            : 'bg-light'
        }`}
        onClick={() => setSelectedRole('DOCTOR')}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="role-image-wrapper">
            <img
              src="/images/registration/p1.png"
              alt="Doctor"
              className="role-image"
            />
          </div>

          <div className="flex-grow-1">
            <div className="small text-dark fw-semibold">
              Doctor
            </div>
            <div
              className="text-muted"
              style={{ fontSize: '11px' }}
            >
              Prescribe medications & manage patient care
            </div>
          </div>

          {selectedRole === 'DOCTOR' && (
            <div className="role-check">✓</div>
          )}
        </div>
      </div>

      {/* Hospital */}
      <div
        className={`role-selection-card p-3 rounded-3 border transition-all ${
          selectedRole === 'HOSPITAL'
            ? 'border-primary bg-primary bg-opacity-10 fw-bold'
            : 'bg-light'
        }`}
        onClick={() => setSelectedRole('HOSPITAL')}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="role-image-wrapper">
            <img
              src="/images/registration/pe.png"
              alt="Hospital or Organization"
              className="role-image"
            />
          </div>

          <div className="flex-grow-1">
            <div className="small text-dark fw-semibold">
              Hospital / Organization
            </div>
            <div
              className="text-muted"
              style={{ fontSize: '11px' }}
            >
              Register facility for System Admin approval
            </div>
          </div>

          {selectedRole === 'HOSPITAL' && (
            <div className="role-check">✓</div>
          )}
        </div>
      </div>

    </div>

    <button
      type="button"
      className="auth-btn w-100"
      onClick={handleNextStep1}
    >
      Continue
    </button>
  </div>
)}

              {/* Step 2: Information Fields */}
              {regStep === 2 && (
                <div className="text-start">
                  <div className="overflow-auto pr-1" style={{ maxHeight: '310px' }}>
                    
                    <div className="input-box my-2">
                      <input
                        type="email"
                        placeholder={selectedRole === 'HOSPITAL' ? 'Admin Contact Email *' : 'Email Address *'}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-box my-2">
                      <input
                        type="password"
                        placeholder="Password (min 6 chars) *"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-box my-2">
                      <input
                        type="password"
                        placeholder="Confirm Password *"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>

                    {/* HOSPITAL FIELDS */}
                    {selectedRole === 'HOSPITAL' && (
                      <>
                        <div className="input-box my-2">
                          <input type="text" placeholder="Hospital Name *" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} required />
                        </div>
                        <div className="input-box my-2">
                          <select value={organizationType} onChange={(e) => setOrganizationType(e.target.value)}>
                            <option value="General Hospital">General Hospital</option>
                            <option value="Specialty Clinic">Specialty Clinic</option>
                            <option value="Health Center">Health Center</option>
                          </select>
                        </div>
                        <div className="input-box my-2">
                          <input type="text" placeholder="License Number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
                        </div>
                        <div className="input-box my-2">
                          <input type="text" placeholder="Registration Number" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
                        </div>
                        <div className="input-box my-2">
                          <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                        </div>
                        <div className="input-box my-2">
                          <input type="text" placeholder="Region" value={region} onChange={(e) => setRegion(e.target.value)} />
                        </div>
                        <div className="input-box my-2">
                          <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
                        </div>
                        <div className="input-box my-2">
                          <input type="text" placeholder="Facility Description" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        <div className="input-box my-2">
                          <input type="text" placeholder="Admin Full Name *" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                        </div>
                      </>
                    )}

                    {/* DOCTOR FIELDS */}
                    {selectedRole === 'DOCTOR' && (
                      <>
                        <div className="input-box my-2">
                          <input type="text" placeholder="Doctor Full Name *" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                        </div>
                        <div className="input-box my-2">
                          <input type="text" placeholder="Specialization (e.g. Cardiology)" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
                        </div>
                        <div className="input-box my-2">
                          <input type="text" placeholder="Medical License Number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
                        </div>
                        <div className="input-box my-2">
                          <input type="text" placeholder="Years of Experience" value={experience} onChange={(e) => setExperience(e.target.value)} />
                        </div>
                        <div className="input-box my-2">
                          <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                      </>
                    )}

                    {/* PATIENT FIELDS */}
                    {selectedRole === 'PATIENT' && (
                      <>
                        <div className="input-box my-2">
                          <input type="text" placeholder="Patient Full Name *" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                        </div>
                        <div className="input-box my-2">
                          <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                      
                        <div className="input-box my-2">
                          <select value={gender} onChange={(e) => setGender(e.target.value)}>
                            <option value="MALE">MALE</option>
                            <option value="FEMALE">FEMALE</option>
                          </select>
                        </div>
                        <div className="input-box my-2">
                          <input type="text" placeholder="Emergency Contact Name" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
                        </div>
                        <div className="input-box my-2">
                          <input type="text" placeholder="Emergency Contact Phone" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} />
                        </div>
                      </>
                    )}

                  </div>

                  <div className="d-flex gap-2 mt-3">
                    <button type="button" className="btn btn-outline-secondary w-50 btn-sm rounded-3" onClick={() => setRegStep(1)}>
                      Back
                    </button>
                    <button type="button" className="auth-btn w-50" onClick={handleNextStep2}>
                      Next 
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Backend Link Selection */}
              {regStep === 3 && (
                <form onSubmit={handleFinalRegister} className="text-start">
                  
                  {selectedRole === 'HOSPITAL' && (
                    <div className="p-2.5 rounded-3 bg-light border mb-3">
                      <div className="fw-bold text-primary small">{hospitalName}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>Type: {organizationType}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>Admin: {fullName} ({email})</div>
                      <div className="alert alert-info p-1.5 mt-2 mb-0" style={{ fontSize: '11px' }}>
                        Requires OTP email verification & System Admin approval.
                      </div>
                    </div>
                  )}

                  {selectedRole === 'DOCTOR' && (
                    <div className="mb-3">
                      <label className="form-label small text-secondary fw-semibold mb-1">Select APPROVED Hospital *</label>
                      <div className="input-box my-1">
                        <select value={selectedHospitalId} onChange={(e) => setSelectedHospitalId(e.target.value)} required>
                          <option value="">-- Choose Approved Hospital --</option>
                          {approvedHospitals.map(h => (
                            <option key={h.id} value={h.id}>{h.name} {h.city ? `(${h.city})` : ''}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {selectedRole === 'PATIENT' && (
                    <div className="mb-3">
                      <label className="form-label small text-secondary fw-semibold mb-1">1. Select APPROVED Hospital *</label>
                      <div className="input-box my-1">
                        <select value={selectedHospitalId} onChange={(e) => setSelectedHospitalId(e.target.value)} required>
                          <option value="">-- Choose Approved Hospital --</option>
                          {approvedHospitals.map(h => (
                            <option key={h.id} value={h.id}>{h.name} {h.city ? `(${h.city})` : ''}</option>
                          ))}
                        </select>
                      </div>

                      <label className="form-label small text-secondary fw-semibold mb-1 mt-2">2. Select Doctor *</label>
                      <div className="input-box my-1">
                        <select value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)} required>
                          <option value="">-- Choose Active Doctor --</option>
                          {hospitalDoctors.map(d => (
                            <option key={d.id} value={d.id}>{d.name} {d.specialization ? `(${d.specialization})` : ''}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="d-flex gap-2 mt-3">
                    <button type="button" className="btn btn-outline-secondary w-50 btn-sm rounded-3" onClick={() => setRegStep(2)}>
                      &larr; Back
                    </button>
                    <button type="submit" className="auth-btn w-50" disabled={loading}>
                      {loading ? 'Sending OTP...' : 'Register & Send OTP'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* TOGGLE SLIDING OVERLAY PANEL BOX */}
        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Hello, Welcome!</h1>
            <p>Don't have an account?</p>
            <button
              type="button"
              className="auth-btn register-btn"
              onClick={() => { setIsRegister(true); setError(''); setRegStep(1); }}
            >
              Register
            </button>
          </div>
          <div className="toggle-panel toggle-right">
            <h1>Welcome Back!</h1>
            <p>Already have an account?</p>
            <button
              type="button"
              className="auth-btn login-btn"
              onClick={() => { setIsRegister(false); setError(''); }}
            >
              Login
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
