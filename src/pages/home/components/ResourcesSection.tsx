
import React from 'react';

const ResourcesSection: React.FC = () => {
  const resources = [
    {
      title: "Getting Started with TechFlow",
      excerpt: "Learn the fundamentals of our platform and start building amazing applications in minutes.",
      date: "Dec 15, 2024",
      category: "Tutorial"
    },
    {
      title: "Advanced API Integration Techniques",
      excerpt: "Discover powerful ways to integrate third-party services and create seamless workflows.",
      date: "Dec 12, 2024",
      category: "Guide"
    },
    {
      title: "Performance Optimization Best Practices",
      excerpt: "Tips and tricks to maximize your application performance and user experience.",
      date: "Dec 10, 2024",
      category: "Best Practices"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Resources</h2>
          <p className="text-xl text-gray-700 font-medium">The latest from TechFlow</p>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {resources.map((resource, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {resource.category}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{resource.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-3">{resource.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{resource.date}</span>
                <button className="text-blue-600 hover:text-blue-800 font-medium">
                  Read More →
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button className="bg-black text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-colors whitespace-nowrap cursor-pointer">
            All Resources
          </button>
        </div>
      </div>
    </section>
  );
};

export default ResourcesSection;
