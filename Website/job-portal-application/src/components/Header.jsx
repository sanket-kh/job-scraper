import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Menu, X, User, LogOut } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import logo1 from '../assets/logo1.jpeg';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    console.log('Sign out error:', error);
    if (!error) {
      setUser(null);
      setUserMenuOpen(false);
      navigate('/signin');
    }
  };

  const handleLogin = () => {
    setUserMenuOpen(false);
    navigate('/signin');
  };

  // Don't render anything while loading
  if (loading) {
    return (
      <header className="w-full bg-white border-b border-[#002060]/10 px-4 sm:px-8 lg:px-12 py-3 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#002060] rounded-xl flex items-center justify-center shadow-lg">
                <Search className="text-white" size={20} />
              </div>
              <span className="text-2xl font-bold text-[#002060]">
                International<span className="text-[#002060]/80"> Careers Network</span>
              </span>
            </a>
          </div>
          <div className="w-10 h-10"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-white border-b border-[#002060]/10 px-4 sm:px-8 lg:px-12 py-3 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <a href="/" className="flex items-center gap-3">
            <img src={logo1} alt="Logo" className="w-10 h-10 rounded-xl shadow-lg object-cover" />
            <span className="text-2xl font-bold text-[#002060]">
              International<span className="text-[#002060]/80"> Careers Network</span>
            </span>
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="/jobs"
            className="text-[#002060] font-medium hover:bg-[#e6eaf3] hover:text-[#002060] rounded-xl px-4 py-2 transition-colors duration-200"
          >
            Jobs
          </a>
          <a
            href="/pricing"
            className="text-[#002060] font-medium hover:bg-[#e6eaf3] hover:text-[#002060] rounded-xl px-4 py-2 transition-colors duration-200"
          >
            Pricing
          </a>
          <a
            href="/faq"
            className="text-[#002060] font-medium hover:bg-[#e6eaf3] hover:text-[#002060] rounded-xl px-4 py-2 transition-colors duration-200"
            onClick={() => setMenuOpen(false)}
          >
            FAQ
          </a>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                {user.email?.[0]?.toUpperCase() || 'U'}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  <div className="py-2">
                    <a
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User size={16} />
                      Profile
                    </a>
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogin}
                className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Sign In
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-[#002060] hover:bg-[#e6eaf3] rounded-xl transition-colors"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-[#002060]/10 bg-white">
          <nav className="flex flex-col gap-4 pt-4">
            <a
              href="/jobs"
              className="text-[#002060] font-medium hover:bg-[#e6eaf3] hover:text-[#002060] rounded-xl px-4 py-2 transition-colors duration-200"
              onClick={() => setMenuOpen(false)}
            >
              Jobs
            </a>
            <a
              href="/pricing"
              className="text-[#002060] font-medium hover:bg-[#e6eaf3] hover:text-[#002060] rounded-xl px-4 py-2 transition-colors duration-200"
              onClick={() => setMenuOpen(false)}
            >
              Pricing
            </a>
            <a
              href="/contact"
              className="text-[#002060] font-medium hover:bg-[#e6eaf3] hover:text-[#002060] rounded-xl px-4 py-2 transition-colors duration-200"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </a>
            <a
              href="/faq"
              className="text-[#002060] font-medium hover:bg-[#e6eaf3] hover:text-[#002060] rounded-xl px-4 py-2 transition-colors duration-200"
              onClick={() => setMenuOpen(false)}
            >
              FAQ
            </a>

            {user ? (
              <div className="pt-4 border-t border-[#002060]/10 space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center font-semibold text-sm">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-[#002060] font-medium">{user.email}</span>
                </div>
                <a
                  href="/profile"
                  className="flex items-center gap-3 px-2 py-1 text-[#002060] hover:bg-[#e6eaf3] rounded-xl transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <User size={16} />
                  Profile
                </a>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-2 py-1 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-[#002060]/10 space-y-3">
                <button
                  onClick={() => {
                    handleLogin();
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-[#002060] text-white font-semibold rounded-xl hover:bg-[#001540] transition-colors shadow-lg"
                >
                  Sign In
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;