import { useRef, useEffect } from "react";
import emailjs from "@emailjs/browser";
import "../styles/contact.css";
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';


export default function Contact() {
  const formRef = useRef();
   const navigate = useNavigate();

   const handleBackToHome = () => {
     navigate('/');
   };

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs
      .sendForm(
        "service_e6v0gs2",    // from EmailJS dashboard
        "template_e9rc2dl",   // your email template ID
        formRef.current,
        "CXIoImGJ_Kf4llF0g"     // your EmailJS public key
      )
      .then(
        () => {
          alert("Message sent successfully!");
          formRef.current.reset();
        },
        (error) => {
          alert("Failed to send message: " + error.text);
        }
      );
  };

 
  useEffect(() => {
    window.scrollTo(0, 0); // always scroll to top on load
  }, []);

  return (
    <div className="page-container">
        <div className="back-to-home-container-about">
                  <button className="back-to-home-btn-about" onClick={handleBackToHome}>
                    <FaArrowLeft /> Back to Home
                  </button>

                </div>
      <h1>Contact Us</h1>
      <p>
        Have questions or need support? We’re always here to help you make the
        most out of ShopStack.
      </p>

      <div className="contact-info">
        <p><strong>Email:</strong> shopstackng@gmail.com</p>
        <p><strong>Phone:</strong> +234 803 783 4432</p>
        <p><strong>Address:</strong> Plot 1816 House 3 G1 Close Fesctac, Lagos, Nigeria</p>
      </div>

      <h2>Get in Touch</h2>
      <form ref={formRef} onSubmit={sendEmail} className="contact-form">
        <input type="text" name="user_name" placeholder="Your Name" required />
        <input type="email" name="user_email" placeholder="Your Email" required />
        <textarea name="message" placeholder="Your Message" required></textarea>
        <button type="submit">Send Message</button>
      </form>
    </div>
  );
}
