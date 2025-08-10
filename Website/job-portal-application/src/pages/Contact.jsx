import { useState } from 'react';
import Header from "../components/Header";
import Footer from "../components/Footer";


const AnimatedJobSVG = () => (
    <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
        <rect x="40" y="60" width="140" height="100" rx="16" fill="#f5f7fa" />
        <rect x="60" y="80" width="100" height="12" rx="6" fill="#e0e7ef">
            <animate attributeName="width" values="100;60;100" dur="2s" repeatCount="indefinite" />
        </rect>
        <rect x="60" y="100" width="80" height="12" rx="6" fill="#e0e7ef">
            <animate attributeName="width" values="80;100;80" dur="2s" repeatCount="indefinite" />
        </rect>
        <circle cx="110" cy="150" r="18" fill="#007bff">
            <animate attributeName="cy" values="150;140;150" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <rect x="100" y="130" width="20" height="30" rx="10" fill="#fff" opacity="0.7" />
        <rect x="105" y="160" width="10" height="20" rx="5" fill="#007bff" opacity="0.5">
            <animate attributeName="height" values="20;10;20" dur="1.5s" repeatCount="indefinite" />
        </rect>
    </svg>
);

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Replace with your actual email address
        const yourEmail = 'birappa.001@gmail.com';
        
        // Create mailto link with form data
        const subject = encodeURIComponent(`Contact Form Message from ${formData.name}`);
        const body = encodeURIComponent(
            `Name: ${formData.name}\n` +
            `Email: ${formData.email}\n\n` +
            `Message:\n${formData.message}`
        );
        
        const mailtoLink = `mailto:${yourEmail}?subject=${subject}&body=${body}`;
        
        // Open user's email client
        window.location.href = mailtoLink;
        
        // Show success message
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-green-100 via-white to-green-50 flex flex-col justify-center items-center py-12 animate-fade-in animate-slide-up">
                <div className="w-full max-w-2xl bg-white/95 border border-green-100 rounded-2xl shadow-2xl p-8 animate-pop-in animate-bounce-once">
                    <div style={{
                        display: "flex",
                        gap: 48,
                        alignItems: "center",
                        justifyContent: "center",
                        flexWrap: "wrap"
                    }}>
                        {/* Contact Form */}
                        <div style={{
                            background: "rgba(255,255,255,0.95)",
                            borderRadius: 18,
                            boxShadow: "0 8px 32px rgba(60,60,120,0.08)",
                            padding: 36,
                            minWidth: 320,
                            maxWidth: 370,
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            gap: 24,
                            animation: "pop-in 0.6s cubic-bezier(.68,-0.55,.27,1.55)"
                        }}>
                            <div>
                                <h2 style={{
                                    fontWeight: 700,
                                    fontSize: 28,
                                    margin: 0,
                                    color: "#222"
                            }}>Contact Us</h2>
                            <p style={{
                                color: "#666",
                                fontSize: 15,
                                margin: "8px 0 0"
                            }}>
                                We'd love to hear from you. Fill out the form and we'll get back soon!
                            </p>
                        </div>

                        {/* Status Messages */}
                        {submitStatus === 'success' && (
                            <div style={{
                                padding: '12px',
                                borderRadius: 8,
                                background: '#d4edda',
                                color: '#155724',
                                border: '1px solid #c3e6cb',
                                fontSize: 14
                            }}>
                                ✅ Email client opened! Please send the pre-filled email from your email app.
                            </div>
                        )}
                        
                        {submitStatus === 'error' && (
                            <div style={{
                                padding: '12px',
                                borderRadius: 8,
                                background: '#f8d7da',
                                color: '#721c24',
                                border: '1px solid #f5c6cb',
                                fontSize: 14
                            }}>
                                ❌ Failed to send message. Please try again.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 18,
                            animation: "fade-in 0.7s"
                        }}>
                            <input
                                type="text"
                                name="name"
                                placeholder="Your Name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                disabled={false}
                                style={{
                                    padding: "12px 14px",
                                    borderRadius: 8,
                                    border: "1px solid #e0e7ef",
                                    fontSize: 15,
                                    background: "#f7fafc",
                                    outline: "none",
                                    transition: "border 0.2s",
                                    opacity: 1
                                }}
                                onFocus={e => e.target.style.border = "1.5px solid #007bff"}
                                onBlur={e => e.target.style.border = "1px solid #e0e7ef"}
                            />
                            <input
                                type="email"
                                name="email"
                                placeholder="Your Email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                style={{
                                    padding: "12px 14px",
                                    borderRadius: 8,
                                    border: "1px solid #e0e7ef",
                                    fontSize: 15,
                                    background: "#f7fafc",
                                    outline: "none",
                                    transition: "border 0.2s"
                                }}
                                onFocus={e => e.target.style.border = "1.5px solid #007bff"}
                                onBlur={e => e.target.style.border = "1px solid #e0e7ef"}
                            />
                            <textarea
                                name="message"
                                placeholder="Your Message"
                                value={formData.message}
                                onChange={handleInputChange}
                                required
                                rows={4}
                                style={{
                                    padding: "12px 14px",
                                    borderRadius: 8,
                                    border: "1px solid #e0e7ef",
                                    fontSize: 15,
                                    background: "#f7fafc",
                                    outline: "none",
                                    resize: "vertical",
                                    transition: "border 0.2s"
                                }}
                                onFocus={e => e.target.style.border = "1.5px solid #007bff"}
                                onBlur={e => e.target.style.border = "1px solid #e0e7ef"}
                            />
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white font-semibold rounded-xl py-3 text-lg shadow-lg hover:from-teal-700 hover:to-teal-800 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 animate-pop-in animate-bounce-once"
                                style={{ boxShadow: "0 2px 8px #e0e7ef" }}
                            >
                                Send Message
                            </button>
                        </form>
                    </div>
                    {/* Animated Illustration */}
                    <div style={{
                        minWidth: 220,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <AnimatedJobSVG />
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    </>
    );
};

export default Contact;