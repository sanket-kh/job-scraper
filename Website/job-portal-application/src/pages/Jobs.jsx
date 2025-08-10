import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Heart, MapPin, Calendar, Building, ExternalLink, Crown, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../supabaseClient";

const Jobs = () => {
  // State management
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [debouncedLocation, setDebouncedLocation] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const [userPlan, setUserPlan] = useState("free"); // "free" or "premium"
  const [userId, setUserId] = useState(null); // Add user ID state

  const navigate = useNavigate();
  // Constants
  const pageSize = 10;
  const FREE_PLAN_LIMIT = 10;

  // Computed values
  const isFreePlan = userPlan === "free";
  const effectiveLimit = isFreePlan ? FREE_PLAN_LIMIT : totalJobs;
  const totalPages = useMemo(() => Math.ceil(effectiveLimit / pageSize), [effectiveLimit, pageSize]);
  const showUpgradePrompt = isFreePlan && totalJobs > FREE_PLAN_LIMIT;

  // Function to check user plan
  const checkUserPlan = useCallback(async () => {
    try {
      // Get current user from Supabase auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        setUserPlan("free");
        return;
      }

      if (!user) {
        // No authenticated user, keep as free plan
        setUserPlan("free");
        return;
      }

      setUserId(user.id);

      // Check if user exists in user_profiles table
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, subscription_type') // Assuming you have a subscription_type column, adjust as needed
        .eq('user_id', user.id) // Assuming user_id is the foreign key to auth.users
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile found, user is on free plan
          console.log('No user profile found, defaulting to free plan');
          setUserPlan("free");
        } else {
          console.error('Profile fetch error:', profileError);
          setUserPlan("free");
        }
        return;
      }

      if (profile) {
        // User has a profile, set to premium
        // You can also check profile.subscription_type if you have that column
        setUserPlan("premium");
        console.log('User profile found, setting to premium plan');
      } else {
        setUserPlan("free");
      }

    } catch (error) {
      console.error('Error checking user plan:', error);
      setUserPlan("free");
    }
  }, []);

  // Check user plan on component mount
  useEffect(() => {
    checkUserPlan();
  }, [checkUserPlan]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        checkUserPlan();
      }
    });

    return () => subscription.unsubscribe();
  }, [checkUserPlan]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Main fetch function
  const fetchJobs = useCallback(async (isFilterChange = false) => {
    try {
      if (isFilterChange) {
        setLoading(true);
        setIsFiltering(true);
      } else {
        setIsPaginating(true);
      }

      // Build query conditions - only apply filters for premium users
      const conditions = [];
      if (!isFreePlan) {
        if (debouncedSearchTerm) conditions.push(["job_title", "ilike", `%${debouncedSearchTerm}%`]);
        if (debouncedLocation) conditions.push(["location", "ilike", `%${debouncedLocation}%`]);
      }

      // Fetch total count on filter change
      if (isFilterChange) {
        let countQuery = supabase.from("jobs").select("id", { count: "exact", head: true });
        conditions.forEach(([column, operator, value]) => {
          countQuery = countQuery[operator](column, value);
        });
        const countResult = await countQuery;
        setTotalJobs(countResult.count || 0);
      }

      // Calculate range based on user plan
      const startRange = (page - 1) * pageSize;
      const endRange = isFreePlan ? Math.min(page * pageSize - 1, FREE_PLAN_LIMIT - 1) : page * pageSize - 1;

      // Fetch jobs
      let query = supabase
        .from("jobs")
        .select("id, job_title, company_name, location, description, salary, apply_link, posted_date, company_logo")
        .order("posted_date", { ascending: sortOrder === "asc" })
        .range(startRange, endRange);

      conditions.forEach(([column, operator, value]) => {
        query = query[operator](column, value);
      });

      const { data, error } = await query;

      if (error) {
        setJobs([]);
        setSelectedJob(null);
      } else {
        setJobs(data || []);
        if (data?.length > 0) {
          if (!selectedJob || !data.find((job) => job.id === selectedJob.id)) {
            setSelectedJob(data[0]);
          }
        } else {
          setSelectedJob(null);
        }
      }
    } catch {
      setJobs([]);
      setSelectedJob(null);
    } finally {
      setLoading(false);
      setIsFiltering(false);
      setIsPaginating(false);
    }
  }, [debouncedSearchTerm, debouncedLocation, page, pageSize, sortOrder, selectedJob, isFreePlan]);

  // Effects - only apply filter effects for premium users
  useEffect(() => {
    if (!isFreePlan) {
      fetchJobs(true);
    } else {
      // For free users, only fetch jobs without filters
      fetchJobs(true);
    }
  }, [isFreePlan ? sortOrder : debouncedSearchTerm, isFreePlan ? undefined : debouncedLocation, sortOrder]);

  useEffect(() => {
    if (page !== 1) fetchJobs(false);
  }, [page]);

  useEffect(() => {
    if (!isFreePlan) {
      setPage(1);
    }
  }, [debouncedSearchTerm, debouncedLocation, sortOrder, isFreePlan]);

  // Event handlers
  const handleFilter = useCallback((e) => {
    if (e) e.preventDefault();
    
    // Prevent filtering for free users
    if (isFreePlan) {
      // Show upgrade prompt or do nothing
      return;
    }
    
    setDebouncedSearchTerm(searchTerm);
    setDebouncedLocation(location);
    setPage(1);
  }, [searchTerm, location, isFreePlan]);

  const toggleSaveJob = useCallback((jobId) => {
    setSavedJobs((prev) => {
      const newSavedJobs = new Set(prev);
      if (newSavedJobs.has(jobId)) {
        newSavedJobs.delete(jobId);
      } else {
        newSavedJobs.add(jobId);
      }
      return newSavedJobs;
    });
  }, []);

  const handleUpgrade = useCallback(() => {
    // Implement your upgrade logic here
    navigate('/pricing'); // Example: redirect to pricing page
    // You might want to redirect to a payment page or show a modal
    console.log("Redirecting to upgrade page...");
  }, []);

  const handleFilterClick = useCallback(() => {
    if (isFreePlan) {
      handleUpgrade();
    } else {
      handleFilter();
    }
  }, [isFreePlan, handleUpgrade, handleFilter]);

  // Utility functions
  const getCompanyInitials = useMemo(
    () => (companyName) =>
      companyName
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2),
    []
  );

  const getCompanyColor = useMemo(
    () => (companyName) => {
      const colors = ["#EC4899", "#8B5CF6", "#3B82F6", "#1F2937", "#10B981", "#F59E0B", "#EF4444"];
      return colors[companyName.length % colors.length];
    },
    []
  );

  const getDaysSincePosted = useCallback((postedDate) => {
    const posted = new Date(postedDate);
    const now = new Date();
    const diffTime = Math.abs(now - posted);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  // Loading state
  if ((loading && !isPaginating) || (isFiltering && !isPaginating)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="text-center py-4 px-4">
          <h1 className="text-2xl font-bold text-[#002060] mb-2">Find Your Dream Job</h1>
          <p className="text-base text-[#002060]/80">Discover the latest opportunities from top companies</p>
        </div>
        <div className="px-4 mb-4">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse bg-gray-200 rounded-lg h-12 shadow-sm"></div>
          </div>
        </div>
        <div className="px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-5 xl:col-span-4 space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-24 shadow-sm"></div>
              ))}
            </div>
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="animate-pulse bg-gray-200 rounded-lg h-96 shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Compact Header Section */}
        {/* <div className="text-center py-4 px-2">
          <p className="text-base text-[#002060]/80">
            {totalJobs.toLocaleString()}+ opportunities
            {isFreePlan && (
              <span className="block text-sm text-[#002060] mt-1">
                Free plan: Showing first {FREE_PLAN_LIMIT} jobs
              </span>
            )}
          </p>
        </div> */}

        {/* Compact Search Form */}
        <div className="px-4 mb-4">
          <div className="max-w-7xl mx-auto">
            <form onSubmit={handleFilter} className="flex flex-col md:flex-row gap-3 items-center justify-center bg-white rounded-lg shadow-md p-4 border">
              <div className="relative w-full md:w-1/3">
                <input
                  type="text"
                  placeholder="Job title, skills or company"
                  className={`border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:ring-2 focus:ring-[#0077B5] focus:outline-none ${
                    isFreePlan ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isFreePlan}
                />
                {isFreePlan && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Lock size={14} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="relative w-full md:w-1/4">
                <input
                  type="text"
                  placeholder="City or region"
                  className={`border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:ring-2 focus:ring-[#0077B5] focus:outline-none ${
                    isFreePlan ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isFreePlan}
                />
                {isFreePlan && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Lock size={14} className="text-gray-400" />
                  </div>
                )}
              </div>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-1/4 text-sm focus:ring-2 focus:ring-[#0077B5] focus:outline-none bg-white"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
              <button 
                type="button"
                onClick={handleFilterClick}
                className={`px-6 py-2 rounded-md font-medium text-sm shadow transition-colors whitespace-nowrap ${
                  isFreePlan 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600' 
                    : 'bg-[#002060] text-white hover:bg-[#005885]'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {isFreePlan ? (
                    <>
                      <Crown className="h-4 w-4" />
                      Upgrade
                    </>
                  ) : (
                    'Search'
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Compact Upgrade Prompt */}
        {showUpgradePrompt && (
          <div className="px-4 mb-4">
            <div className="max-w-7xl mx-auto">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Unlock All {totalJobs.toLocaleString()} Jobs</h3>
                      <p className="text-sm text-gray-600">Advanced filters and premium listings</p>
                    </div>
                  </div>
                  <button
                    onClick={handleUpgrade}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-colors"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compact Main Content */}
        <div className="px-4 pb-6">
          <div className="max-w-7xl mx-auto">
            {isMobile ? (
              <MobileLayout
                jobs={jobs}
                selectedJob={selectedJob}
                setSelectedJob={setSelectedJob}
                totalJobs={totalJobs}
                totalPages={totalPages}
                page={page}
                setPage={setPage}
                isFiltering={isFiltering}
                savedJobs={savedJobs}
                toggleSaveJob={toggleSaveJob}
                getCompanyInitials={getCompanyInitials}
                getCompanyColor={getCompanyColor}
                getDaysSincePosted={getDaysSincePosted}
                isFreePlan={isFreePlan}
                effectiveLimit={effectiveLimit}
              />
            ) : (
              <DesktopLayout
                jobs={jobs}
                selectedJob={selectedJob}
                setSelectedJob={setSelectedJob}
                totalJobs={totalJobs}
                totalPages={totalPages}
                page={page}
                setPage={setPage}
                isFiltering={isFiltering}
                savedJobs={savedJobs}
                toggleSaveJob={toggleSaveJob}
                getCompanyInitials={getCompanyInitials}
                getCompanyColor={getCompanyColor}
                getDaysSincePosted={getDaysSincePosted}
                isFreePlan={isFreePlan}
                effectiveLimit={effectiveLimit}
              />
            )}
          </div>
        </div>
      </div>
      <div className="w-full bg-gray-900 mt-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
          <Footer />
        </div>
      </div>
    </>
  );
};

// Compact Mobile Layout Component
const MobileLayout = ({
  jobs, selectedJob, setSelectedJob, totalJobs, totalPages, page, setPage,
  isFiltering, savedJobs, toggleSaveJob, getCompanyInitials, getCompanyColor,
  getDaysSincePosted, isFreePlan, effectiveLimit
}) => (
  <div className="space-y-2">
    {selectedJob && (
      <div className="lg:hidden">
        <button
          onClick={() => setSelectedJob(null)}
          className="mb-3 text-[#0077B5] hover:text-[#005885] text-sm font-medium"
        >
          ← Back to job list
        </button>
        <JobDetails
          job={selectedJob}
          onToggleSave={toggleSaveJob}
          isSaved={savedJobs.has(selectedJob.id)}
          getCompanyInitials={getCompanyInitials}
          getCompanyColor={getCompanyColor}
          getDaysSincePosted={getDaysSincePosted}
        />
      </div>
    )}

    {(!selectedJob || window.innerWidth >= 1024) && (
      <div className={selectedJob && window.innerWidth < 1024 ? "hidden" : ""}>
        <JobList
          jobs={jobs}
          selectedJob={selectedJob}
          setSelectedJob={setSelectedJob}
          totalJobs={totalJobs}
          totalPages={totalPages}
          page={page}
          setPage={setPage}
          isFiltering={isFiltering}
          savedJobs={savedJobs}
          toggleSaveJob={toggleSaveJob}
          getCompanyInitials={getCompanyInitials}
          getCompanyColor={getCompanyColor}
          getDaysSincePosted={getDaysSincePosted}
          isMobile={true}
          isFreePlan={isFreePlan}
          effectiveLimit={effectiveLimit}
        />
      </div>
    )}
  </div>
);

// Compact Desktop Layout Component
const DesktopLayout = ({
  jobs, selectedJob, setSelectedJob, totalJobs, totalPages, page, setPage,
  isFiltering, savedJobs, toggleSaveJob, getCompanyInitials, getCompanyColor,
  getDaysSincePosted, isFreePlan, effectiveLimit
}) => (
  <div className="grid grid-cols-12 gap-3 h-[calc(100vh-200px)] min-h-[500px]">
    {/* Left Column - Compact Job List */}
    <div className="col-span-5 xl:col-span-4 flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm h-full min-h-0">
      <div className="p-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Jobs ({effectiveLimit.toLocaleString()}{isFreePlan && totalJobs > effectiveLimit ? `/${totalJobs.toLocaleString()}` : ""})
            {isFiltering && <span className="text-xs text-gray-500 ml-2">Searching...</span>}
          </h2>
          {isFreePlan && (
            <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              <Lock size={10} />
              <span>Free</span>
            </div>
          )}
        </div>
      </div>

      <JobList
        jobs={jobs}
        selectedJob={selectedJob}
        setSelectedJob={setSelectedJob}
        totalJobs={totalJobs}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        isFiltering={isFiltering}
        savedJobs={savedJobs}
        toggleSaveJob={toggleSaveJob}
        getCompanyInitials={getCompanyInitials}
        getCompanyColor={getCompanyColor}
        getDaysSincePosted={getDaysSincePosted}
        isMobile={false}
        isFreePlan={isFreePlan}
        effectiveLimit={effectiveLimit}
      />
    </div>

    {/* Right Column - Compact Job Details */}
    <div className="col-span-7 xl:col-span-8 flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {selectedJob ? (
          <JobDetails
            job={selectedJob}
            onToggleSave={toggleSaveJob}
            isSaved={savedJobs.has(selectedJob.id)}
            getCompanyInitials={getCompanyInitials}
            getCompanyColor={getCompanyColor}
            getDaysSincePosted={getDaysSincePosted}
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <Building size={20} className="text-gray-400" />
              </div>
              <p className="text-base font-medium">Select a job to view details</p>
              <p className="text-sm mt-1">{jobs.length} available positions</p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Compact Job List Component
const JobList = ({
  jobs, selectedJob, setSelectedJob, totalJobs, totalPages, page, setPage,
  isFiltering, savedJobs, toggleSaveJob, getCompanyInitials, getCompanyColor,
  getDaysSincePosted, isMobile, isFreePlan, effectiveLimit
}) => (
  <>
    <div className={`${isMobile ? 'space-y-2' : 'flex-1 min-h-0 overflow-y-auto'}`}>
      {jobs.length > 0 ? (
        <div className={isMobile ? '' : 'divide-y divide-gray-100'}>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSelected={selectedJob?.id === job.id}
              onSelect={setSelectedJob}
              onToggleSave={toggleSaveJob}
              isSaved={savedJobs.has(job.id)}
              getCompanyInitials={getCompanyInitials}
              getCompanyColor={getCompanyColor}
              getDaysSincePosted={getDaysSincePosted}
              isMobile={isMobile}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8 bg-white border border-gray-200 rounded-lg">
          <p className="text-base">No jobs found matching your criteria.</p>
          <p className="text-sm mt-1">Try adjusting your search filters.</p>
        </div>
      )}
    </div>

    {/* Compact Pagination */}
    {totalPages > 1 && (
      <div className={`${isMobile ? 'flex justify-center items-center mt-4 gap-2' : 'p-3 border-t border-gray-200 flex justify-center items-center gap-2 flex-shrink-0'}`}>
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1 || isFiltering}
          className="px-3 py-1 text-xs rounded bg-gray-100 text-gray-700 disabled:opacity-50 hover:bg-gray-200 transition-colors"
        >
          Previous
        </button>
        <span className="px-2 py-1 text-xs text-gray-600">
          {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages || isFiltering}
          className="px-3 py-1 text-xs rounded bg-gray-100 text-gray-700 disabled:opacity-50 hover:bg-gray-200 transition-colors"
        >
          Next
        </button>
      </div>
    )}
  </>
);

const JobCard = React.memo(({
  job, isSelected, onSelect, onToggleSave, isSaved, getCompanyInitials,
  getCompanyColor, getDaysSincePosted, isMobile
}) => {
  return (
    <div
      onClick={() => onSelect(job)}
      className={`cursor-pointer transition-all duration-200 border border-[#e5e7eb] shadow-sm hover:shadow-xl hover:border-[#2563eb] bg-white/95 ${isMobile
          ? `rounded-2xl p-5 ${isSelected ? "ring-2 ring-[#2563eb] border-[#2563eb] bg-blue-50/60" : "hover:bg-blue-50/40"}` : "rounded-xl p-5"}`}
      style={{ backgroundColor: isSelected ? "#f0f6ff" : undefined }}
    >
      <div className="flex items-start justify-between space-x-4">
        <div className="flex-shrink-0">
          {job.company_logo ? (
            <img
              src={job.company_logo}
              alt={job.company_name + " logo"}
              className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-md bg-white"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-md border-2 border-white"
              style={{ backgroundColor: getCompanyColor(job.company_name) }}
            >
              {getCompanyInitials(job.company_name)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-xl font-bold ${isSelected ? "text-[#2563eb]" : "text-gray-900"} truncate`}>{job.job_title}</h3>
          <p className="text-base text-gray-700 font-medium truncate">{job.company_name}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              <MapPin size={13} className="text-gray-400" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              <Calendar size={13} className="text-gray-400" />
              {getDaysSincePosted(job.posted_date)}
            </span>
            {job.salary && (
              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full font-semibold">
                <span className="text-green-400 font-bold">£</span>
                {job.salary}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center space-x-2">
          {isMobile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(job.id);
              }}
              className={`p-2 rounded-full border transition-colors shadow-sm ${isSaved ? "bg-red-100 border-red-200 hover:bg-red-200" : "bg-gray-100 border-gray-200 hover:bg-gray-200"}`}
              aria-label={isSaved ? "Unsave job" : "Save job"}
            >
              <Heart size={18} className={`${isSaved ? "text-red-600" : "text-gray-400"} transition-colors`} />
            </button>
          )}
        </div>
      </div>
      {!isMobile && (
        <div className="mt-4">
          <div className="text-sm text-gray-700 line-clamp-2 mb-2" dangerouslySetInnerHTML={{ __html: job.description }}></div>
          <div className="flex items-center justify-between mt-3">
            {isSaved && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(job.id);
                }}
                className="p-2 rounded-full bg-red-100 hover:bg-red-200 border border-red-200 transition-colors shadow-sm"
                aria-label="Unsave job"
              >
                <Heart size={16} className="text-red-600" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
// Job Details Component
const JobDetails = ({ job, onToggleSave, isSaved, getCompanyInitials, getCompanyColor, getDaysSincePosted }) => {
  return (
    <div className="bg-white/95 border border-[#e5e7eb] rounded-3xl shadow-2xl p-8 h-full flex flex-col animate-fade-in animate-slide-up animate-duration-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-5">
          {job.company_logo ? (
            <img
              src={job.company_logo}
              alt={job.company_name + " logo"}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-lg bg-white"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg border-2 border-white"
              style={{ backgroundColor: getCompanyColor(job.company_name) }}
            >
              {getCompanyInitials(job.company_name)}
            </div>
          )}
          <div>
            <h2 className="text-3xl font-bold text-[#2563eb] leading-tight mb-1">{job.job_title}</h2>
            <p className="text-lg text-gray-800 font-semibold">{job.company_name}</p>
          </div>
        </div>
        <button
          onClick={() => onToggleSave(job.id)}
          className={`p-3 rounded-full border transition-colors shadow-md ${isSaved ? "bg-red-100 border-red-200 hover:bg-red-200" : "bg-gray-100 border-gray-200 hover:bg-gray-200"}`}
          aria-label={isSaved ? "Unsave job" : "Save job"}
        >
          <Heart size={22} className={`${isSaved ? "text-red-600" : "text-gray-400"} transition-colors`} />
        </button>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <span className="inline-flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          <MapPin size={15} className="text-gray-400" />
          {job.location}
        </span>
        <span className="inline-flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          <Calendar size={15} className="text-gray-400" />
          Posted {getDaysSincePosted(job.posted_date)}
        </span>
        {job.salary && (
          <span className="inline-flex items-center gap-1 text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full font-semibold">
            <span className="text-green-400 font-bold">£</span>
            {job.salary}
          </span>
        )}
      </div>
      <div className="flex-grow overflow-y-auto mb-6">
        <div className="prose prose-blue max-w-none text-gray-900 text-base" dangerouslySetInnerHTML={{ __html: job.description }}></div>
      </div>
      {job.apply_link && (
        <a
          href={job.apply_link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-2 px-6 py-3 bg-[#002060] text-white rounded-xl font-bold shadow-lg hover:bg-[#1d4ed8] transition-colors text-lg"
        >
          Apply Now <ExternalLink size={18} />
        </a>
      )}
    </div>
  );
};
export default Jobs;