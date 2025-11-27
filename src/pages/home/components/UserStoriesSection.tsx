export default function UserStoriesSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-purple-800/30 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-600/30 mb-6">
            <span className="text-purple-200 text-sm">Our User Stories</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How We Made an{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Impact
            </span>
          </h2>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto">
            Discover how users transformed their content creation with our
            AI-powered video generation platform.
          </p>
        </div>

        {/* User Stories Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Story 1 */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-600/30">
            <div className="mb-6">
              <img
                src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                alt="Content Creator Success"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="text-white font-semibold text-lg mb-2">
                Content Creator Success
              </h3>
              <p className="text-purple-200 text-sm mb-4">
                "I was able to create 50+ engaging short videos in just one
                week. The AI-generated captions and effects saved me countless
                hours of editing work."
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <img
                src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                alt="Sarah Johnson"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div className="text-white font-medium text-sm">
                  Sarah Johnson
                </div>
                <div className="text-purple-300 text-xs">Content Creator</div>
              </div>
            </div>
          </div>

          {/* Story 2 */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-600/30">
            <div className="mb-6">
              <img
                src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                alt="Marketing Team Growth"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="text-white font-semibold text-lg mb-2">
                Marketing Team Growth
              </h3>
              <p className="text-purple-200 text-sm mb-4">
                "Our social media engagement increased by 300% after using this
                platform. The automated video creation process revolutionized
                our content strategy."
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <img
                src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                alt="Mike Thompson"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div className="text-white font-medium text-sm">
                  Mike Thompson
                </div>
                <div className="text-purple-300 text-xs">Marketing Manager</div>
              </div>
            </div>
          </div>

          {/* Story 3 */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-600/30">
            <div className="mb-6">
              <img
                src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                alt="Small Business Success"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="text-white font-semibold text-lg mb-2">
                Small Business Success
              </h3>
              <p className="text-purple-200 text-sm mb-4">
                "As a small business owner, I couldn't afford expensive video
                production. This tool helped me create professional videos that
                boosted my sales by 150%."
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <img
                src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                alt="Emily Chen"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div className="text-white font-medium text-sm">Emily Chen</div>
                <div className="text-purple-300 text-xs">
                  Small Business Owner
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="ri-instagram-fill text-white text-2xl"></i>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">
              Instagram Reels
            </h3>
            <p className="text-purple-200 text-sm">
              Create viral Instagram Reels with trending music, effects, and
              optimized captions that boost engagement.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="ri-line-chart-fill text-white text-2xl"></i>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">
              Viral Videos
            </h3>
            <p className="text-purple-200 text-sm">
              Generate content that's designed to go viral with AI-powered trend
              analysis and optimized storytelling.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="ri-notification-fill text-white text-2xl"></i>
            </div>
            <h3 className="text-white font-semibtml text-lg mb-2">
              YouTube Shorts
            </h3>
            <p className="text-purple-200 text-sm">
              Optimize your content for YouTube Shorts with perfect aspect
              ratios, engaging thumbnails, and SEO-friendly titles.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
