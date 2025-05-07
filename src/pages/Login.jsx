import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import log from "./login.module.css";
import { BiSolidUserRectangle } from "react-icons/bi";
import { FaLock, FaUser } from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("Student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const endpoint = "http://localhost:3000/students/login";
      const userPayload = { registrationNo: identifier, password };

      // Replace this with actual API call, e.g., using fetch or axios
      // For now, simulate success:
      if (identifier === "student123" && password === "password123") {
        setSuccessMessage("Login successful!");
        setTimeout(() => {
          navigate("/exams");
        }, 1000);
      } else {
        setErrorMessage("Invalid credentials. Please try again.");
      }
    } catch (err) {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={log["overall"]}>
      <div className={log["wrapper"]}>
        <div className={log["top-section"]}>
          {/* <img src="./src/assets/images/ciu-logo-login.png" alt="Logo" /> */}
          <h1>ONLINE EXAMINATION SYSTEM</h1>
        </div>
        <div className={log["form-box"]}>
          <form onSubmit={handleSubmit}>
            <div className={log["personel-dropdown"]}>
              <div className={log["icon-div"]}>
                <BiSolidUserRectangle className={log["icon"]} size={40} />
              </div>
              <div className={log["select"]}>
                <div className={log["select-field"]}>
                  <p>{selectedUser}</p>
                </div>
              </div>
            </div>

            <div className={log["input-box"]}>
              <input
                type="text"
                placeholder="Registration Number"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
              <FaUser className={log["icon"]} />
            </div>
            <div className={log["input-box"]}>
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <FaLock className={log["icon"]} />
            </div>
            <div className={log["remember-forgot"]}>
              <label>
                <input type="checkbox" />
                Remember Me
              </label>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={log["login-submit-button"]}
              style={{ width: "100%", height: "45px" }}
            >
              LOGIN
            </button>
            {errorMessage && (
              <p className={log["error-message"]}>{errorMessage}</p>
            )}
            {successMessage && (
              <p className={log["success-message"]}>{successMessage}</p>
            )}
            <div className={log["forgot-password"]}>
              <Link to="/reset-password">Forgot Password?</Link>
              <span> or </span>
              <Link to="/studenttoken-password-reset" className={log.signInLink}>
                Set password using token
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
