import { useEffect, useState } from 'react';
import { User, Mail, Calendar, Crown, Settings, Edit3, Shield, Award, GraduationCap, Building, FileText, Clock, AlertCircle, Briefcase, Target } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { getUserProfile } from '../services/userProfile';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userProfileData, setUserProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        setError(null);

        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          throw new Error('Failed to get user: ' + userError.message);
        }

        setUser(user);

        if (user) {
          try {
            // Get profile data
            const profileData = await getUserProfile(user.id);
            setProfile(profileData);
          } catch (profileError) {
            console.error('Error fetching profile:', profileError);
            setProfile(null);
          }

          // Fetch user profile information from user_profiles table
          // Remove .single() and handle multiple or no rows
          const { data: userProfileInfo, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id);

          if (profileError) {
            console.error('Error fetching user profile data:', profileError);
            setUserProfileData(null);
          } else if (userProfileInfo && userProfileInfo.length > 0) {
            // Take the first row if multiple exist
            setUserProfileData(userProfileInfo[0]);
          } else {
            // No profile data found
            setUserProfileData(null);
          }
        }
      } catch (err) {
        console.error('Error in fetchUserAndProfile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProfile();
  }, []);

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeSince = (dateString) => {
    if (!dateString) return 'Unknown';

    const now = new Date();
    const date = new Date(dateString);
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  // Helper function to check if user has premium subscription
  const isPremiumUser = () => {
    return userProfileData?.subscription_type === 'Premium';
  };

  // Get membership date - use created_at if premium, otherwise user creation date
  const getMembershipDate = () => {
    if (isPremiumUser()) {
      return userProfileData.created_at;
    }
    return user?.created_at;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your profile...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Profile</h2>
              <p className="text-gray-600 mb-8">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h2>
              <p className="text-gray-600 mb-8">Please sign in to view your profile dashboard.</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Sign In
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gradient-to-br from-slate-50 to-blue-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="h-24 w-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-2xl font-bold backdrop-blur-sm">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="h-full w-full rounded-full object-cover" />
                      ) : (
                        getInitials(profile?.full_name || user?.email || 'User')
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {profile?.full_name || user?.user_metadata?.full_name || 'Welcome User'}
                    </h1>
                    <p className="text-blue-100 text-lg">{user.email}</p>
                    {userProfileData && (
                      <p className="text-blue-200 text-sm mt-1">
                        {userProfileData.course && userProfileData.university &&
                          `${userProfileData.course} • ${userProfileData.university}`
                        }
                      </p>
                    )}
                    <div className="flex items-center mt-3">
                      {isPremiumUser() ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                          <Crown className="h-4 w-4 mr-1" />
                          Premium
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          <User className="h-4 w-4 mr-1" />
                          Free Account
                        </span>
                      )}
                    </div>

                  </div>
                  <button className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 backdrop-blur-sm border border-white border-opacity-20">
                    <Edit3 className="h-5 w-5 inline mr-2" />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Account Status</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {isPremiumUser() ? 'Premium' : 'Free'}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${isPremiumUser() ? 'bg-amber-100' : 'bg-gray-100'}`}>
                  {isPremiumUser() ? (
                    <Crown className="h-6 w-6 text-amber-600" />
                  ) : (
                    <User className="h-6 w-6 text-gray-600" />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {isPremiumUser() ? 'Premium Since' : 'Member Since'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {getTimeSince(getMembershipDate())}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${isPremiumUser() ? 'bg-amber-100' : 'bg-blue-100'}`}>
                  {isPremiumUser() ? (
                    <Crown className="h-6 w-6 text-amber-600" />
                  ) : (
                    <Calendar className="h-6 w-6 text-blue-600" />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Visa Status</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {userProfileData?.visa_type || 'Not Set'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Visa Duration</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {userProfileData?.visa_duration_months ? `${userProfileData.visa_duration_months} months` : 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-orange-100">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Account Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Account Info */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <User className="h-5 w-5 mr-2 text-gray-600" />
                    Account Information
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <User className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-gray-900">
                          {profile?.full_name || user?.user_metadata?.full_name || 'Not set'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <Mail className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-gray-900">{user.email}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Join Date
                      </label>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-gray-900">
                          {formatDate(user?.created_at)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Type
                      </label>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        {isPremiumUser() ? (
                          <Crown className="h-4 w-4 text-amber-500 mr-3" />
                        ) : (
                          <User className="h-4 w-4 text-gray-400 mr-3" />
                        )}
                        <span className="text-gray-900">
                          {isPremiumUser() ? 'Premium Subscriber' : 'Free User'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Premium membership date if applicable */}
                  {isPremiumUser() && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Crown className="h-5 w-5 text-amber-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Premium Member Since</p>
                          <p className="text-amber-700">{formatDate(userProfileData.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Educational & Professional Information */}
              {userProfileData ? (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <GraduationCap className="h-5 w-5 mr-2 text-gray-600" />
                      Educational & Professional Profile
                    </h3>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {userProfileData.course && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Course
                          </label>
                          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                            <GraduationCap className="h-4 w-4 text-blue-500 mr-3" />
                            <span className="text-gray-900">{userProfileData.course}</span>
                          </div>
                        </div>
                      )}
                      {userProfileData.university && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            University
                          </label>
                          <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                            <Building className="h-4 w-4 text-purple-500 mr-3" />
                            <span className="text-gray-900">{userProfileData.university}</span>
                          </div>
                        </div>
                      )}
                      {userProfileData.target_roles && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Target Roles
                          </label>
                          <div className="flex items-start p-3 bg-green-50 rounded-lg">
                            <Briefcase className="h-4 w-4 text-green-500 mr-3 mt-0.5" />
                            <span className="text-gray-900">{userProfileData.target_roles}</span>
                          </div>
                        </div>
                      )}
                      {userProfileData.target_industry && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Target Industry
                          </label>
                          <div className="flex items-center p-3 bg-indigo-50 rounded-lg">
                            <Target className="h-4 w-4 text-indigo-500 mr-3" />
                            <span className="text-gray-900">{userProfileData.target_industry}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {userProfileData.biggest_hurdle && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Biggest Challenge
                        </label>
                        <div className="flex items-start p-3 bg-red-50 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-red-500 mr-3 mt-0.5" />
                          <span className="text-gray-900">{userProfileData.biggest_hurdle}</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {userProfileData.visa_type && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Visa Type
                          </label>
                          <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                            <FileText className="h-4 w-4 text-yellow-600 mr-3" />
                            <span className="text-gray-900">{userProfileData.visa_type}</span>
                          </div>
                        </div>
                      )}
                      {userProfileData.visa_duration_months && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Visa Duration
                          </label>
                          <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                            <Clock className="h-4 w-4 text-orange-600 mr-3" />
                            <span className="text-gray-900">{userProfileData.visa_duration_months} months</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <GraduationCap className="h-5 w-5 mr-2 text-gray-600" />
                      Educational & Professional Profile
                    </h3>
                  </div>
                  <div className="p-6 text-center">
                    <div className="text-gray-400 mb-4">
                      <User className="h-16 w-16 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Profile Not Complete</h4>
                      <p className="text-gray-600">Complete your profile to get personalized recommendations and insights.</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                      Complete Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <div className="w-full bg-gray-900 mt-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
          <Footer />
        </div>
      </div>
    </div>
  );
}