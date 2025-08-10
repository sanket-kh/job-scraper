import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { upsertUserProfile } from '../services/userProfile';

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setErrorMsg(error.message);
    } else {
      // Upsert user profile immediately after sign up (if user object is available)
      if (data && data.user) {
        try {
          await upsertUserProfile(data.user);
        } catch (e) {
          // Optionally handle error
        }
      }
      setSuccessMsg("Registration successful! Please check your email to confirm your account.");
      setTimeout(() => {
        navigate("/signin");
      }, 4000);
    }

    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/'
      }
    });
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-white to-green-50 flex flex-col justify-center items-center py-12 animate-fade-in animate-slide-up">
        <div className="w-full max-w-md bg-white/95 border border-green-100 rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800">Sign Up</h2>

          {errorMsg && (
            <div className="text-sm text-red-500 text-center">{errorMsg}</div>
          )}

          {successMsg && (
            <div className="text-sm text-green-600 text-center">{successMsg}</div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                className="w-full p-2 border border-gray-300 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                className="w-full p-2 border border-gray-300 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl mb-4 animate-pop-in animate-bounce-once"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </form>
        
          <div className="text-center text-sm text-gray-600 mb-4">
            
          </div>  
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full border border-gray-200 rounded-xl py-4 flex items-center justify-center space-x-2 hover:bg-gray-50 transition-all duration-200 hover:shadow-md mb-4"
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
              <path d="M533.5 278.4c0-18.3-1.6-36-4.7-53H272v100.6h147.3c-6.4 34.7-25.6 64.1-54.7 83.5v69.2h88.4c51.7-47.6 80.5-117.8 80.5-200.3z" fill="#4285f4"/>
              <path d="M272 544.3c73.6 0 135.5-24.4 180.6-66.3l-88.4-69.2c-24.5 16.5-55.9 26.3-92.2 26.3-70.9 0-131-47.9-152.5-112.2H29.7v70.6c45.2 89.6 137.3 150.8 242.3 150.8z" fill="#34a853"/>
              <path d="M119.5 322.9c-10.4-30.7-10.4-63.7 0-94.4v-70.6H29.7c-40.7 79.6-40.7 174.8 0 254.4l89.8-70.6z" fill="#fbbc04"/>
              <path d="M272 107.7c38.8-.6 75.9 13.6 104.3 39.5l78.3-78.3C405.2 24.4 343.3 0 272 0c-105 0-197.1 61.2-242.3 150.8l89.8 70.6c21.5-64.3 81.6-112.2 152.5-112.2z" fill="#ea4335"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">
              {loading ? "Signing up..." : "Sign Up with Google"}
            </span>
          </button>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="text-blue-600 hover:underline font-semibold"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
