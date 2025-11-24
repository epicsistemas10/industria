export default function FounderSection() {
  return (
    <section id="founder-note" className="py-24 bg-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full px-6 py-2 mb-6">
            <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">FOUNDERS NOTE</span>
          </div>
        </div>

        {/* Quote and Founder */}
        <div className="text-center">
          <blockquote className="text-2xl md:text-3xl lg:text-4xl font-light text-white mb-12 leading-relaxed max-w-4xl mx-auto">
            <span className="text-blue-400 text-5xl">"</span>
            {' '}We gather your site data. We know your target audience & how your brand can standout from crowd.{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Best part is we also help you with Solutions
            </span>
            {' '}<span className="text-blue-400 text-5xl">"</span>
          </blockquote>

          {/* Founder Info */}
          <div className="flex items-center justify-center space-x-4">
            <img 
              src="https://framerusercontent.com/images/W7xYkGKzPzvnPv58ZBNzxS3JZI.jpg" 
              alt="Co-founder" 
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
            />
            <div className="text-left">
              <div className="text-gray-300 font-medium">Co-founder & ex google designer</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}