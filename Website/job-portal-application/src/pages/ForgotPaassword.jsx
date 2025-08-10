import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Link } from 'react-router-dom';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage('Error resetting password. Please try again.');
    } else {
      setMessage('Password updated successfully.');
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Reset Your Password
        </h2>

        {!success ? (
          <form onSubmit={handleReset} className="space-y-4">
            <input
              type="password"
              placeholder="Enter new password"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Reset Password
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-green-600 font-medium">{message}</p>
            <Link
              to="/signin"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Go to Sign In
            </Link>
          </div>
        )}

        {message && !success && (
          <p className="text-center text-sm text-red-500">{message}</p>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
