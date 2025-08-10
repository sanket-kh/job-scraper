import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FAQPage = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpanded = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Function to convert text with links and emails to JSX
  const formatTextWithLinks = (text) => {
    // Regular expressions for URLs and emails
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    
    // Split text by URLs and emails, keeping the delimiters
    let parts = text.split(urlRegex);
    parts = parts.flatMap(part => part.split(emailRegex));
    
    return parts.map((part, index) => {
      // Check if it's a URL
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-teal-600 text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-teal-700 transition-colors duration-200 mx-1 my-1 text-sm"
            style={{ textDecoration: 'none' }}
          >
            Visit Link
          </a>
        );
      }
      // Check if it's an email
      else if (emailRegex.test(part)) {
        return (
          <a
            key={index}
            href={`mailto:${part}`}
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-purple-700 transition-colors duration-200 mx-1 my-1 text-sm"
            style={{ textDecoration: 'none' }}
          >
            {part}
          </a>
        );
      }
      // Regular text
      else {
        return part;
      }
    });
  };

  const faqData = {
    students: {
      title: "👩‍🎓 Students & Graduates",
      items: [
        {
          id: 'students-1',
          question: "What exactly is ICN?",
          answer: "ICN (International Careers Network) is a job board built specifically for international students and graduates looking for UK-based roles that offer visa sponsorship. Every employer and job listed on the platform is either a registered sponsor or open to sponsorship making your job search faster and more targeted."
        },
        {
          id: 'students-2',
          question: "How do I know if a job on the ICN job board offers sponsorship?",
          answer: "Every job you see on ICN has already been vetted by our team. We only publish roles that meet one of the following:\n• The employer is on the UK Home Office sponsor list\n• The employer has previously sponsored international graduates\n• The employer accepts Graduate Visa applicants and is open to later sponsoring a Skilled Worker visa"
        },
        {
          id: 'students-3',
          question: "Is the job board only for final-year students and graduates?",
          answer: "No. We support students at all stages - from first-year undergraduates looking for internships to Master's students and recent graduates searching for full-time roles. You can filter roles based on industry, location etc. We also support international talent looking to work in the UK. So if you are planning on landing a role in the UK and do not have direct working rights and will need sponsorship, the job board is for you."
        },
        {
          id: 'students-4',
          question: "Can I apply to jobs directly through ICN?",
          answer: "Yes. Once you create your ICN profile, you can apply directly to jobs through the platform. We redirect you to employers' own portals, as well as other platforms where the roles are hosted by the employer."
        },
        {
          id: 'students-5',
          question: "Is ICN a paid subscription?",
          answer: "Yes - it is a rolling monthly subscription which continues until cancelled."
        },
        {
          id: 'students-6',
          question: "I'm currently on a Graduate Visa. Can ICN help me find a company to switch to a Skilled Worker Visa?",
          answer: "Absolutely. Many of the employers on ICN are familiar with Graduate Visa transitions and are open to converting high-performing graduates onto the Skilled Worker route."
        },
        {
          id: 'students-7',
          question: "What if I'm still learning about the UK visa system?",
          answer: "No worries - we offer clear, jargon-free guides about the Graduate Visa, Skilled Worker sponsorship, and the employer licensing process. We also host free webinars with lawyers, HR reps, and sponsored graduates so you can hear directly from the experts.\n\nTo gain access to all of this, consider joining our community platform here: https://community.internationalcareersnetwork.com/invitation?code=5GG4C6#landing-page"
        },
        {
          id: 'students-8',
          question: "How often are new jobs added to ICN?",
          answer: "We look for new jobs everyday. Our team continually sources roles from employers who meet our sponsorship criteria."
        },
        {
          id: 'students-9',
          question: "Do you offer support beyond job listings?",
          answer: "Yes. International Careers Network offers curated resources and builders for:\n• CVs and cover letter Builder for international students\n• Interview preparation (including cultural and technical questions)\n• LinkedIn profile optimisation\n• Visa sponsor email outreach templates\n\nWe also partner with legal experts and career coaches who provide regular workshops to help you navigate the UK job market.\n\nTo gain access to all of this, consider joining our community platform here: https://community.internationalcareersnetwork.com/invitation?code=5GG4C6#landing-page"
        },
        {
          id: 'students-10',
          question: "What types of employers are listed on ICN?",
          answer: "Our platform features a wide range of employers - from large companies on the official sponsor list to startups, SMEs, and charities that are open to becoming sponsors or hiring via Graduate Visas. We also have public sector organizations."
        },
        {
          id: 'students-11',
          question: "Can I save roles or bookmark opportunities?",
          answer: "Yes - you can save jobs so you never miss a relevant opportunity."
        }
      ]
    },
    universities: {
      title: "🎓 Universities & Career Services",
      items: [
        {
          id: 'uni-1',
          question: "What is ICN and why is it relevant to our international students?",
          answer: "ICN is one of UK's largest job board fully focused on helping international students and graduates secure visa-sponsored opportunities. Our platform addresses one of the biggest pain points your international cohort faces: applying endlessly to roles that ultimately reject them due to visa restrictions."
        },
        {
          id: 'uni-2',
          question: "How does ICN support our graduate outcomes reporting or employability goals?",
          answer: "By giving students access to verified, relevant job opportunities, ICN improves international student career success rates, supports Graduate Outcomes targets, and strengthens your Tier 4 compliance support."
        },
        {
          id: 'uni-3',
          question: "Is there a cost for our university to partner with ICN?",
          answer: "We offer flexible packages:\n• Access based on number of students\n• Premium features like customised job dashboards, analytics, and workshops\n• Campus-wide licenses for access to the job board, reporting, and support"
        },
        {
          id: 'uni-4',
          question: "Can we integrate ICN with our existing careers platform?",
          answer: "Yes. We offer integration or custom feeds based on your CMS, so that our listings can appear on your internal job boards seamlessly. Reach out to us on hello@internationalcareersnetwork.com and we can discuss this in more detail."
        },
        {
          id: 'uni-5',
          question: "How can we be confident about the job quality and visa compliance?",
          answer: "All employers and listings are manually verified by our team. We also cross-check employer names against the official UK sponsor license register and monitor changes weekly. Listings that expire or are no longer compliant are removed immediately."
        },
        {
          id: 'uni-6',
          question: "Can ICN help us educate students on UK sponsorship and immigration pathways?",
          answer: "Yes, International Careers Network is a community based platform and provides:\n• Live visa and sponsorship workshops\n• Q&A sessions with immigration lawyers\n• Employer panels and alumni events\n• Digital guides explaining Sponsorship, Graduate Visa strategy, and timelines\n\nWe also co-host sessions with career services or societies on request."
        },
        {
          id: 'uni-7',
          question: "Do you offer insights into student usage or performance?",
          answer: "Yes. Our partner universities receive termly reports with anonymised data such as:\n• Job application trends\n• Most-viewed industries\n• Sponsorship readiness and awareness\n• Skills or CV support gaps"
        },
        {
          id: 'uni-8',
          question: "How do we get started?",
          answer: "Contact us using the University / Career Coaching Institute Partner Form https://airtable.com/appYipuRmDCH0nRIb/pag2XTkWNfyNyzHRv/form or simply emailing us at hello@internationalcareersnetwork.com to request an introductory demo call."
        }
      ]
    },
    employers: {
      title: "🏢 Employers & Hiring Managers",
      items: [
        {
          id: 'emp-1',
          question: "Why should we use ICN instead of a general job board?",
          answer: "ICN helps you target top international talent from UK universities - a group often missed on generic platforms. Our users are students and graduates with strong academic and technical backgrounds, most of whom are ready to work full-time and bring global perspectives to your workforce. Plus, we pre-filter candidates by visa eligibility, so you get fewer irrelevant applications."
        },
        {
          id: 'emp-2',
          question: "What kinds of candidates are on ICN?",
          answer: "You'll find:\n• Final-year undergraduates and postgraduates across STEM, business, law, and design\n• International students with Graduate Visas, looking to transition to Skilled Worker\n• Visa-ready graduates with strong academic and internship credentials\n• Candidates with prior work experience (especially those doing a second UK Master's)"
        },
        {
          id: 'emp-3',
          question: "We're already a sponsor. How do we post jobs?",
          answer: "Great - just email us at hello@internationalcareersnetwork.com and we can get you set up."
        },
        {
          id: 'emp-4',
          question: "We're not a licensed sponsor yet — can we still list jobs?",
          answer: "Yes. While we only work with employers who are open to exploring sponsorship or currently hiring on a Graduate Visa basis, we can if needed, connect you with immigration partners to get a license for your firm so you can then list job roles on our website."
        },
        {
          id: 'emp-5',
          question: "Is there a cost to post on ICN?",
          answer: "Yes, we offer the following:\n• Standard listings are free\n• Featured employer banners and targeted campaigns to universities or disciplines are paid"
        },
        {
          id: 'emp-6',
          question: "Do I need to know the visa process to hire through ICN?",
          answer: "No - we simplify it for you. We offer onboarding guides, sponsor license resources, and access to immigration partners. Whether you're converting a Graduate Visa hire or starting from scratch, we'll walk you through it. Contact us at hello@internationalcareersnetwork.com to know more."
        },
        {
          id: 'emp-7',
          question: "Can we run hiring campaigns through ICN?",
          answer: "Absolutely. We offer:\n• University-targeted job ads\n• Sponsored email newsletters\n• Custom application funnels"
        },
        {
          id: 'emp-8',
          question: "Can I track applications or manage them within ICN?",
          answer: "Yes. You can choose to manage applications through our platform or redirect applicants to your existing ATS."
        },
        {
          id: 'emp-9',
          question: "How do we get started with ICN as an employer?",
          answer: "Contact us at hello@internationalcareersnetwork.com or fill out our employer onboarding form to book a discovery call."
        }
      ]
    }
  };

  const FAQItem = ({ item }) => {
    const isExpanded = expandedItems[item.id];

    return (
      <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
        <button
          onClick={() => toggleExpanded(item.id)}
          className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
        >
          <h3 className="text-lg font-medium text-gray-800 pr-4">{item.question}</h3>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-teal-600 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
          )}
        </button>
        {isExpanded && (
          <div className="px-6 py-4 bg-green-50 border-t border-green-200">
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
              {formatTextWithLinks(item.answer)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-white to-green-50 animate-fade-in animate-slide-up">
        <div className="bg-white/95 border-b border-green-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                ❓ Frequently Asked Questions
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                The UK's first visa-sponsored job board for international students, graduates,
                universities, career coaching institutes and employers.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 pt-8">
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {Object.entries(faqData).map(([key, section]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${activeTab === key
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md hover:shadow-lg'
                  }`}
              >
                {section.title}
              </button>
            ))}
          </div>

          {/* FAQ Content */}
          <div className="max-w-4xl mx-auto pb-12">
            <div className="bg-white/95 border border-green-100 rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                {faqData[activeTab].title}
              </h2>

              <div className="space-y-4">
                {faqData[activeTab].items.map((item) => (
                  <FAQItem key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* Contact Section */}
            <div className="mt-12 bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 text-white text-center animate-pop-in animate-bounce-once">
              <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
              <p className="text-lg mb-6 opacity-90">
                We're here to help! Get in touch with our team for personalized support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href="mailto:hello@internationalcareersnetwork.com"
                  className="bg-white text-teal-600 px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-200"
                >
                  Email Us
                </a>
                <a
                  href="https://community.internationalcareersnetwork.com/invitation?code=5GG4C6#landing-page"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-green-600 transition-all duration-200"
                >
                  Join Community
                </a>
              </div>
            </div>
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

export default FAQPage;