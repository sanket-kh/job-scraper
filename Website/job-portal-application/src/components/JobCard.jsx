import { useState } from 'react';
import { Building, MapPin, DollarSign, Clock } from 'lucide-react';

const JobCard = ({
  job_title,
  company_name,
  location,
  description,
  salary,
  apply_link,
  company_logo,
  posted_date,
  ...props
}) => {
  const [showDescription, setShowDescription] = useState(false);

  return (
    <div className={"bg-gradient-to-br from-blue-50 via-white to-indigo-100 rounded-2xl shadow-2xl p-8 border border-blue-100 hover:shadow-3xl transition-all duration-300 animate-fade-in animate-pop-in animate-zoom-in " + (props.className || "")} style={props.style}>
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start flex-1">
          <div className="w-16 h-16 bg-white/80 border border-blue-100 rounded-xl flex items-center justify-center mr-6 shadow-md">
            {company_logo && company_logo !== 'null' && company_logo !== '' ? (
              <img
                src={company_logo}
                alt={company_name}
                className="w-14 h-14 object-contain drop-shadow-md"
                loading="lazy"
                onError={e => { e.target.style.display = 'none'; }}
              />
            ) : (
              <Building className="text-blue-200" size={32} />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold text-blue-700 mb-1 leading-tight hover:underline transition-colors cursor-pointer">
              {job_title}
            </h2>
            <div className="text-indigo-700 text-lg font-semibold mb-1">
              {company_name}
            </div>
            <div className="flex items-center text-blue-500 text-base mb-1">
              <MapPin className="mr-1" size={18} />
              <span>{location}</span>
            </div>
            {salary && (
              <div className="flex items-center text-blue-400 text-base mb-1">
                <DollarSign className="mr-1" size={18} />
                <span>{salary}</span>
              </div>
            )}
            {posted_date && (
              <div className="flex items-center text-blue-300 text-xs mb-2">
                <Clock className="mr-1" size={14} />
                <span>Posted {posted_date}</span>
              </div>
            )}
            {description && description.trim() !== '' && (
              <>
                <button
                  className="text-indigo-600 text-sm font-bold underline mb-2 hover:text-indigo-800 transition"
                  onClick={() => setShowDescription((prev) => !prev)}
                  type="button"
                >
                  {showDescription ? 'Hide Description' : 'View Description'}
                </button>
                {showDescription && (
                  <div className="text-gray-700 text-base mb-2 bg-white/80 rounded-xl p-4 border border-blue-50 shadow-inner animate-fade-in">
                    <div dangerouslySetInnerHTML={{ __html: description }} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="ml-6 flex-shrink-0 flex items-start">
          <a
            href={apply_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 hover:scale-105 transition-all border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={e => e.stopPropagation()}
          >
            Apply Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
