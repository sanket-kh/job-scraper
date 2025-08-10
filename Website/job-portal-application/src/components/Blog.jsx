import React from 'react';
import { ArrowRight } from 'lucide-react';

const BlogSection = () => {
  const blogPosts = [
    {
      id: 1,
      title: "Struggling to crack data science technical interviews?",
      date: "June 01, 2025",
      categoryColor: "bg-blue-100 text-blue-700",
      image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=400&fit=crop",
      excerpt: "Meet Meena Sirisha Valavala, Data Scientist at NatWest Group who joins us at International Careers Network this Thursday and brings with her 5+ years of experience across",
      url: "https://www.linkedin.com/posts/hardilshah_struggling-to-crack-data-science-technical-activity-7333046851111157760-SZhl?utm_source=share&utm_medium=member_desktop&rcm=ACoAACx0kQIBiGRQoJ9MnNkO7Bx20UmWA4APmO4"
    },
    {
      id: 2,
      title: "You’re doing everything you’re “supposed to do”",
      date: "June 08, 2025",
      categoryColor: "bg-green-100 text-green-700",
      image: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=600&h=400&fit=crop",
      excerpt: " Drafting cold messages and trying to stand out without sounding desperate",
      url: "https://www.linkedin.com/posts/hardilshah_dear-international-graduate-in-the-uk-you-activity-7332699525213544448-ij8U?utm_source=share&utm_medium=member_desktop&rcm=ACoAACx0kQIBiGRQoJ9MnNkO7Bx20UmWA4APmO4"
    },
  ];

  return (
    <section className="py-16 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Latest from our blog
          </h2>
          <p className="text-xl text-gray-600">
            Get interesting insights, articles, and news
          </p>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {blogPosts.map((post, index) => (
            <article 
              key={post.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer"
            >
              {/* Image */}
              <div className="relative overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Date and Category */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 text-sm">
                    {post.date}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-teal-600 transition-colors duration-300">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {post.excerpt}
                </p>

                {/* Read More Link */}
                <div className="flex items-center text-teal-600 font-medium text-sm group-hover:text-teal-700 transition-colors">
                  <a href={`${post.url}`} className="hover:underline">Read more</a>
                  <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;