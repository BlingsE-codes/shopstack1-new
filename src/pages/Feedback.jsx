import { useState, useEffect } from "react";
import "../styles/feedback.css";
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';


export default function Feedback() {
  const [form, setForm] = useState({ name: "", email: "", rating: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: connect to Supabase or backend later
    console.log("Feedback submitted:", form);
    setSubmitted(true);
    setForm({ name: "", email: "", rating: "", message: "" });
  };

  useEffect(() => {
    window.scrollTo(0, 0); // always scroll to top on load
  }, []);

  return (
    <div className="feedback-container">
        <div className="back-to-home-container-about">
          <button className="back-to-home-btn-about" onClick={handleBackToHome}>
            <FaArrowLeft /> Back to Home
          </button>
        </div>
      <h1>Feedback & Reviews</h1>
      <p className="intro-text">
        We value your opinion! Please share your feedback to help us improve ShopStack.
      </p>

      {!submitted ? (
        <form className="feedback-form" onSubmit={handleSubmit}>
          <label>
            Name:
            <input type="text" name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            Email:
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>

          <label>
            Rating:
            <select name="rating" value={form.rating} onChange={handleChange} required>
              <option value="">Select...</option>
              <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
              <option value="4">⭐⭐⭐⭐ Good</option>
              <option value="3">⭐⭐⭐ Average</option>
              <option value="2">⭐⭐ Poor</option>
              <option value="1">⭐ Very Bad</option>
            </select>
          </label>

          <label>
            Message:
            <textarea
              name="message"
              rows="4"
              value={form.message}
              onChange={handleChange}
              required
            ></textarea>
          </label>

          <button type="submit">Submit Feedback</button>
        </form>
      ) : (
        <div className="thank-you">
          <h2>Thank You! 🎉</h2>
          <p>Your feedback has been received.</p>
        </div>
      )}
    </div>
  );
}
