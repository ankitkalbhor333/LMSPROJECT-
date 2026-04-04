import { useState } from "react";
import API from "../../utils/api";
import "./ForgetPassword.css";

export default function ForgotPassword() {
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const normalizedPhone = String(phone).replace(/\D/g, "");
      const { data } = await API.post("/auth/forgot-password", { phone: normalizedPhone });
      alert(data.msg);
    } catch (err) {
      alert(err.response?.data?.msg || "Error occurred");
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h2>Forgot Password</h2>
        <p>Enter your registered phone number</p>

        <form onSubmit={handleSubmit}>
          <input
            type="tel"
            placeholder="Enter 10-digit phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button type="submit">Send Reset Link</button>
        </form>
      </div>
    </div>
  );
}