import React from "react";

const VideoSection: React.FC = () => {
  const videos = [
    {
      title: "Startup Success Stories",
      description:
        "Discover how innovative startups transformed their ideas into billion-dollar companies using our platform.",
      thumbnail:
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
    },
    {
      title: "Technology Innovation",
      description:
        "Explore cutting-edge technologies that are reshaping industries and creating new opportunities.",
      thumbnail:
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
    },
    {
      title: "Global Impact",
      description:
        "See how startups are solving world problems and making a positive impact on society.",
      thumbnail:
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
    },
  ];

  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-purple-400 text-sm font-medium tracking-wider uppercase mb-4">
            Success Stories
          </p>
          <h2 className="text-4xl font-bold text-white mb-6">
            Watch Innovation in Action
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Discover how startups are leveraging our platform to build the
            future
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {videos.map((video, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-all cursor-pointer group"
            >
              <div className="relative">
                <div
                  className="h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url('${video.thumbnail}')` }}
                >
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all">
                      <i className="ri-play-fill text-white text-xl ml-1"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-purple-400 transition-colors">
                  {video.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {video.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all cursor-pointer whitespace-nowrap shadow-2xl">
            View All Stories
          </button>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
