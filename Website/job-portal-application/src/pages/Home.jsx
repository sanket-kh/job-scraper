import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/Hero';
import BlogSection from '../components/Blog';
import JobSection from '../components/JobSection';
import { Briefcase, Star, ArrowRight, Check, Lock, Users, Award, Globe } from 'lucide-react';
import { BrowserRouter } from 'react-router-dom';

const Home = () => {
  const [featuredCompanies, setFeaturedCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  const subscriptionBenefits = [
    "Access to 1000+ UK visa sponsorship jobs",
    "Direct application to sponsoring companies",
    "CV/Resume review by UK immigration experts",
    "Interview preparation with industry specialists",
    "Regular notifications for new sponsorship positions",
    "Visa application guidance and resources"
  ];

  const stats = [
    { icon: Users, label: "Active Users", value: "12,000+" },
    { icon: Briefcase, label: "Job Placements", value: "3,500+" },
    { icon: Globe, label: "Partner Companies", value: "800+" },
    { icon: Award, label: "Success Rate", value: "89%" }
  ];

  const fetchTopCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('company_name, company_logo')
        .not('company_name', 'is', null)
        .not('company_name', 'eq', '');

      if (error) {
        setFeaturedCompanies([]);
      } else {
        const companyCounts = {};
        data.forEach(job => {
          const companyName = job.company_name.trim();
          if (companyCounts[companyName]) {
            companyCounts[companyName].count++;
            if (!companyCounts[companyName].logo && job.company_logo) {
              companyCounts[companyName].logo = job.company_logo;
            }
          } else {
            companyCounts[companyName] = {
              count: 1,
              logo: job.company_logo || '/api/placeholder/80/80'
            };
          }
        });

        const sortedCompanies = Object.entries(companyCounts)
          .map(([name, data]) => ({
            name,
            jobCount: data.count,
            logo: data.logo,
            rating: (4.0 + Math.random() * 0.3).toFixed(1),
            reviews: Math.floor(Math.random() * 15000) + 5000
          }))
          .sort((a, b) => b.jobCount - a.jobCount)
          .slice(0, 4);

        setFeaturedCompanies(sortedCompanies);
      }
    } catch (error) {
      setFeaturedCompanies([]);
    } finally {
      setCompaniesLoading(false);
    }
  };

  useEffect(() => {
    fetchTopCompanies();
  }, []);

  return (
    <>
      {/* Header Full Width */}
      <div className="w-full">
        <Header />
      </div>

      {/* Hero Section */}
      <section>
        <HeroSection />
      </section>

      {/* How Platform Works Section */}
      <section className="py-16 w-full bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-[#002060] mb-4">
              How Our Platform Works
            </h2>
            <p className="text-lg text-[#002060]/80 max-w-2xl mx-auto">
              Your journey to UK employment starts here with our simple 3-step process
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#e6eaf3] rounded-2xl p-8 border border-[#002060]/20 text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="bg-[#002060] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="text-white" size={32} />
              </div>
              <h3 className="font-bold text-xl mb-4 text-[#002060]">Discover Opportunities</h3>
              <p className="text-[#002060]/80 text-base leading-relaxed">
                Browse our curated database of UK companies with sponsor licenses looking for international talent.
              </p>
            </div>
            <div className="bg-[#e6eaf3] rounded-2xl p-8 border border-[#002060]/20 text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="bg-[#002060] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <ArrowRight className="text-white" size={32} />
              </div>
              <h3 className="font-bold text-xl mb-4 text-[#002060]">Apply Directly</h3>
              <p className="text-[#002060]/80 text-base leading-relaxed">
                Submit applications directly to hiring managers with clear visa sponsorship information.
              </p>
            </div>
            <div className="bg-[#e6eaf3] rounded-2xl p-8 border border-[#002060]/20 text-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="bg-[#002060] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="text-white" size={32} />
              </div>
              <h3 className="font-bold text-xl mb-4 text-[#002060]">Get Expert Support</h3>
              <p className="text-[#002060]/80 text-base leading-relaxed">
                Receive comprehensive guidance throughout the visa application process from our specialists.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Sponsor Companies Section */}
      <section className="py-16 w-full bg-[#e6eaf3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-12">
            <div>
              <h3 className="text-3xl font-bold text-[#002060] mb-2">Top Sponsor Companies</h3>
              <p className="text-[#002060]/80">Leading employers actively hiring international talent</p>
            </div>
            <div className="flex items-center text-[#002060] text-base font-semibold mt-4 sm:mt-0">
              <Lock size={18} className="mr-2" />
              Premium Access
            </div>
          </div>

          {companiesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#e6eaf3] rounded-2xl h-32 animate-pulse border border-[#002060]/10" />
              ))}
            </div>
          ) : featuredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCompanies.map((company, idx) => (
                <div
                  key={company.name}
                  className="bg-white border border-[#002060]/20 rounded-2xl p-6 flex flex-col items-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-16 h-16 rounded-xl mb-4 object-cover shadow border-2 border-[#002060]/30"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/80/80';
                    }}
                  />
                  <h4 className="font-bold text-[#002060] text-lg mb-2 text-center leading-tight">
                    {company.name}
                  </h4>
                  <div className="text-[#002060]/80 text-sm font-medium">
                    {company.jobCount} job{company.jobCount !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-[#002060]/40 py-12">
              <p className="text-lg">No companies data available at the moment.</p>
            </div>
          )}
        </div>
      </section>
      
      {/* Enhanced Jobs Section - Fixed spacing */}
      <section className="py-16 w-full bg-[#f4f7fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-[#002060] mb-4">
              Latest Sponsorship Jobs
            </h2>
            <p className="text-lg text-[#002060]/70 max-w-3xl mx-auto">
              Discover thousands of opportunities with UK companies ready to sponsor your visa
            </p>
          </div>
          <div className="bg-white rounded-3xl shadow-2xl border border-[#002060]/20 px-6">
            <JobSection logoColor="#002060" />
          </div>
        </div>
      </section>

      {/* Why Choose Our Job Board Section */}
      <section className="py-16 w-full bg-[#e6eaf3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-[#002060] mb-6">
                Why choose our Job Board?
              </h2>
              <p className="text-xl text-[#002060]/70 mb-8 leading-relaxed">
                Get everything you need to successfully secure a UK visa sponsored role.
              </p>
              <ul className="space-y-5 mb-10">
                <li className="flex items-start text-[#002060] text-lg font-medium">
                  <div className="bg-[#f4f7fb] rounded-full p-1 mr-4 mt-1 flex-shrink-0">
                    <Check className="text-[#002060]" size={16} />
                  </div>
                  <span>Access To 12,000+ VISA sponsored Roles</span>
                </li>
                <li className="flex items-start text-[#002060] text-lg font-medium">
                  <div className="bg-[#f4f7fb] rounded-full p-1 mr-4 mt-1 flex-shrink-0">
                    <Check className="text-[#002060]" size={16} />
                  </div>
                  <span>Roles refreshed every 24-48 hrs</span>
                </li>
                <li className="flex items-start text-[#002060] text-lg font-medium">
                  <div className="bg-[#f4f7fb] rounded-full p-1 mr-4 mt-1 flex-shrink-0">
                    <Check className="text-[#002060]" size={16} />
                  </div>
                  <span>Access roles from Large companies as well as Small and Medium Firms and Startups</span>
                </li>
                <li className="flex items-start text-[#002060] text-lg font-medium">
                  <div className="bg-[#f4f7fb] rounded-full p-1 mr-4 mt-1 flex-shrink-0">
                    <Check className="text-[#002060]" size={16} />
                  </div>
                  <span>We also list graduate-level roles that have the ability to sponsor</span>
                </li>
                <li className="flex items-start text-[#002060] text-lg font-medium">
                  <div className="bg-[#f4f7fb] rounded-full p-1 mr-4 mt-1 flex-shrink-0">
                    <Check className="text-[#002060]" size={16} />
                  </div>
                  <span>Access internships at firms known to sponsor visa for international talent</span>
                </li>
                <li className="flex items-start text-[#002060] text-lg font-medium">
                  <div className="bg-[#f4f7fb] rounded-full p-1 mr-4 mt-1 flex-shrink-0">
                    <Check className="text-[#002060]" size={16} />
                  </div>
                  <span>Access to Roles by employers with a strong verified track record of Sponsorship</span>
                </li>
                <li className="flex items-start text-[#002060] text-lg font-medium">
                  <div className="bg-[#f4f7fb] rounded-full p-1 mr-4 mt-1 flex-shrink-0">
                    <Check className="text-[#002060]" size={16} />
                  </div>
                  <span>Join a community of 1000+ candidates who are looking to Land a visa-sponsored role</span>
                </li>
              </ul>
              <div className="space-y-4">
                <a 
                  href="/pricing" 
                  className="inline-block bg-[#002060] text-white font-bold rounded-2xl px-10 py-4 text-lg shadow-lg hover:bg-[#001540] transition-all duration-300 transform hover:-translate-y-1"
                >
                  Start your journey £8.49 / month*
                </a>
                <p className="text-[#002060]/60 text-sm">
                  *Monthly rolling subscription, No commitment - Cancel anytime.
                </p>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md flex flex-col items-center">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
                  <circle cx="60" cy="60" r="56" fill="#002060" stroke="#f4f7fb" strokeWidth="8" />
                  <text x="60" y="70" textAnchor="middle" fill="#fff" fontSize="40" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif">UK</text>
                </svg>
                <span className="text-[#002060] font-bold text-lg">Visa Sponsorship</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Stats Section */}
      <section className="py-12 w-full bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <span className="text-4xl font-extrabold text-[#002060] mb-2">12,000+</span>
              <span className="text-lg text-[#002060]/80 font-medium">Jobs</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-extrabold text-[#002060] mb-2">1,000+</span>
              <span className="text-lg text-[#002060]/80 font-medium">Active Users</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-extrabold text-[#002060] mb-2">20+</span>
              <span className="text-lg text-[#002060]/80 font-medium">Success Stories</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-extrabold text-[#002060] mb-2">4.5</span>
              <span className="text-lg text-[#002060]/80 font-medium">Trustpilot Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 w-full bg-[#002060]">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-6">
            Want even more personalised support?
          </h2>
          <p className="text-xl text-white/80 mb-10 leading-relaxed">
            Get access to unlimited CVs, Cover Letters, Linkedin Optimisation, 1:1s, Mock Interviews and the Job Board all under one Platform.
          </p>
          <div className="flex justify-center">
            <a 
              href="https://community.internationalcareersnetwork.com/invitation?code=5GG4C6#landing-page" 
              className="bg-white text-[#002060] font-bold rounded-2xl px-10 py-4 text-lg shadow-lg hover:bg-[#e6eaf3] hover:text-[#002060] transition-all duration-300 transform hover:-translate-y-1 border border-[#002060] focus:outline-none focus:ring-2 focus:ring-[#002060]"
            >
              Join the community
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <BlogSection />
      </div>

      <div className="w-full bg-gray-900 mt-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default Home;