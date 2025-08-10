import React, { useState, useEffect } from 'react';
import { Star, Zap, Heart, MapPin, Calendar } from 'lucide-react';
import { supabase } from '../supabaseClient';

const FeaturedJobs = () => {
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const toggleSaveJob = (jobId) => {
    const newSavedJobs = new Set(savedJobs);
    if (newSavedJobs.has(jobId)) {
      newSavedJobs.delete(jobId);
    } else {
      newSavedJobs.add(jobId);
    }
    setSavedJobs(newSavedJobs);
  };

  // Sample jobs data as fallback
  const sampleJobs = [
    {
      id: 1,
      job_title: "Financial Controller",
      company_name: "UBT",
      location: "Liverpool, England, United Kingdom",
      salary: "£60,000 - £80,000",
      apply_link: "#",
      posted_date: "2024-06-20",
      company_logo: null,
      category: "Finance"
    },
    {
      id: 2,
      job_title: "Head of Marketing - Contemporary Fashion Brand",
      company_name: "MODE SEARCH Ltd.",
      location: "London Area, United Kingdom",
      salary: "£65,000 - £75,000",
      apply_link: "#",
      posted_date: "2024-06-21",
      company_logo: null,
      category: "Marketing"
    },
    {
      id: 3,
      job_title: "Retail Area Manager – UK & Ireland – Luxury Fashion Brand",
      company_name: "MODE SEARCH Ltd.",
      location: "London Area, United Kingdom",
      salary: "£50,000 - £65,000",
      apply_link: "#",
      posted_date: "2024-06-22",
      company_logo: null,
      category: "Retail"
    },
    {
      id: 4,
      job_title: "Business Analyst",
      company_name: "Creatify",
      location: "London Area, United Kingdom",
      salary: "£45,000 - £55,000",
      apply_link: "#",
      posted_date: "2024-06-22",
      company_logo: null,
      category: "Analytics"
    }
  ];

  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('id, job_title, company_name, location, description, salary, apply_link, posted_date, company_logo')
          .order('posted_date', { ascending: false })
          .limit(4);

        if (error) {
          console.error('Error fetching jobs:', error);
          setJobs(sampleJobs);
        } else {
          setJobs(data && data.length > 0 ? data : sampleJobs);
        }
      } catch (error) {
        console.error('Error:', error);
        setJobs(sampleJobs);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedJobs();
  }, []);

  // Function to get initials from company name for logo fallback
  const getCompanyInitials = (companyName) => {
    return companyName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Function to generate a color based on company name
  const getCompanyColor = (companyName) => {
    return '#002060';
  };

  // Function to calculate days since posted
  const getDaysSincePosted = (postedDate) => {
    if (!postedDate) return 'Recently';
    
    const posted = new Date(postedDate);
    const now = new Date();
    
    // Check if the date is valid
    if (isNaN(posted.getTime())) return 'Recently';
    
    const diffTime = Math.abs(now - posted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <section className="py-4 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured remote jobs
            </h2>
            <p className="text-xl text-gray-600">
              Explore latest job opportunities
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-2xl h-56"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Featured remote jobs
          </h2>
          <p className="text-xl text-gray-600">
            Explore {jobs.length}+ latest job opportunities
          </p>
        </div>

        {/* Jobs Grid */}
        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border-2 border-[#002060]/30 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:border-[#002060]"
              >
                {/* Header with logo and actions */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Company Logo */}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {job.company_logo ? (
                        <img
                          src={job.company_logo}
                          alt={`${job.company_name} logo`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full ${job.company_logo ? 'hidden' : 'flex'} items-center justify-center text-white font-bold text-lg`}
                        style={{ backgroundColor: '#002060' }}
                      >
                        {getCompanyInitials(job.company_name)}
                      </div>
                    </div>
                    
                    {/* Job Title and Company */}
                    <div className="min-w-0 flex-1">
                      <h6 className="font-bold text-[#002060] mb-1 line-clamp-2">
                        {job.job_title}
                      </h6>
                      <p className="text-[#002060]/70 text-sm truncate">
                        by {job.company_name}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                    <button className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors">
                      <Star size={18} fill="currentColor" />
                    </button>
                  </div>
                </div>

                {/* Job Details */}
                <div className="space-y-3">
                  {/* Location */}
                  <div className="flex items-center text-[#002060]/70 text-sm">
                    <MapPin size={16} className="mr-2 flex-shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </div>
                  
                  {/* Salary */}
                  {job.salary && (
                    <div className="text-[#002060] font-semibold text-base">
                      {job.salary}
                    </div>
                  )}
                  
                  {/* Posted Date */}
                  <div className="flex items-center text-[#002060]/60 text-sm">
                    <Calendar size={16} className="mr-2 flex-shrink-0" />
                    <span>Posted {getDaysSincePosted(job.posted_date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 text-xl py-12">
            No featured jobs available at the moment.
          </div>
        )}

        {/* Load More Button */}
        <div className="text-center">
          <a
            href="/jobs"
            className="inline-block px-8 py-3 border-2 border-[#002060] text-[#002060] font-semibold rounded-full hover:bg-[#002060] hover:text-white transition-all duration-300"
          >
            View All Jobs
          </a>
        </div>
      </div>
    </section>
  );
};

export default FeaturedJobs;