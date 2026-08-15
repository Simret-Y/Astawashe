import { useEffect, useRef, useState } from "react";
import "./AuthPage.css";

type Role = "PATIENT" | "HOSPITAL_ADMIN" | "ADMIN" | "DOCTOR";

export default function AuthPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState<Role>("PATIENT");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<"login" | "register" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const registerBtn = container.querySelector(".register-btn") as HTMLButtonElement | null;
    const loginBtn = container.querySelector(".login-btn") as HTMLButtonElement | null;
    if (registerBtn) registerBtn.onclick = () => container.classList.add("active");
    if (loginBtn) loginBtn.onclick = () => container.classList.remove("active");
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setErrorType(null);

    if (!loginId || !loginPassword) {
      setError("Please enter email/phone and password");
      setErrorType("login");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      console.log("Login submitted:", { loginId, loginPassword, loginRole });
      setLoading(false);
      // TODO: replace this block with a real call to your auth API later
    }, 700);
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setErrorType(null);

    if (!registerEmail) {
      setError("Please enter an email address or phone number");
      setErrorType("register");
      return;
    }
    if (!registerName) {
      setError("Please enter your full name");
      setErrorType("register");
      return;
    }
    if (!registerPassword) {
      setError("Please enter a password");
      setErrorType("register");
      return;
    }
    if (!registerConfirmPassword) {
      setError("Please confirm your password");
      setErrorType("register");
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setError("Passwords do not match");
      setErrorType("register");
      return;
    }
    if (registerPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setErrorType("register");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      console.log("Register submitted:", { registerName, registerEmail, registerPassword });
      setLoading(false);
      // TODO: replace this block with a real call to your auth API later
    }, 700);
  };

  const closeErrorModal = () => {
    setError("");
    setErrorType(null);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      {error && (
        <div
          className="modal d-block"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="modal-dialog" style={{ maxWidth: "400px" }}>
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="fa fa-exclamation-triangle me-2"></i>
                  {errorType === "login" ? "Login Error" : "Registration Error"}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeErrorModal}></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">{error}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-danger" onClick={closeErrorModal}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={containerRef} className="auth-container">
        <div className="form-box login">
          <form className="auth-form" onSubmit={handleLogin}>
            <h1>Login</h1>
            <div className="input-box">
              <input
                type="text"
                placeholder="Email or Phone"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
              />
              <i className="bx bxs-user"></i>
            </div>
            <div className="input-box">
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              <i className="bx bxs-lock-alt"></i>
            </div>
            <div className="input-box">
              <select
                className="form-select"
                value={loginRole}
                onChange={(e) => setLoginRole(e.target.value as Role)}
                required
              >
                <option value="PATIENT">Patient</option>
                <option value="DOCTOR">Doctor</option>
                <option value="HOSPITAL_ADMIN">Hospital Admin</option>
                <option value="ADMIN">System Admin</option>
              </select>
            </div>
            <div className="forgot-link">
              <a href="#">Forgot Password?</a>
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
            <p>or login with social platforms</p>
            <div className="social-icons">
              <a href="#" className="google"><i className="bx bxl-google"></i></a>
              <a href="#" className="facebook"><i className="bx bxl-facebook"></i></a>
              <a href="#" className="github"><i className="bx bxl-github"></i></a>
              <a href="#" className="linkedin"><i className="bx bxl-linkedin"></i></a>
            </div>
          </form>
        </div>

        <div className="form-box register">
          <form className="auth-form" onSubmit={handleRegister}>
            <h1>Registration</h1>
            <div className="input-box">
              <input
                type="text"
                placeholder="Full Name"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                required
              />
              <i className="bx bxs-user"></i>
            </div>
            <div className="input-box">
              <input
                type="text"
                placeholder="Email or Phone Number"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
              />
              <i className="bx bxs-envelope"></i>
            </div>
            <div className="input-box">
              <input
                type="password"
                placeholder="Password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
              />
              <i className="bx bxs-lock-alt"></i>
            </div>
            <div className="input-box">
              <input
                type="password"
                placeholder="Confirm Password"
                value={registerConfirmPassword}
                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                required
              />
              <i className="bx bxs-lock-alt"></i>
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
            <p>or register with social platforms</p>
            <div className="social-icons">
              <a href="#" className="google"><i className="bx bxl-google"></i></a>
              <a href="#" className="facebook"><i className="bx bxl-facebook"></i></a>
              <a href="#" className="github"><i className="bx bxl-github"></i></a>
              <a href="#" className="linkedin"><i className="bx bxl-linkedin"></i></a>
            </div>
          </form>
        </div>

        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Hello, Welcome!</h1>
            <p>Don't have an account?</p>
            <button className="auth-btn register-btn">Register</button>
          </div>
          <div className="toggle-panel toggle-right">
            <h1>Welcome Back!</h1>
            <p>Already have an account?</p>
            <button className="auth-btn login-btn">Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}