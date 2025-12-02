
import { useState } from 'react';

export function ShowcaseSection() {
  return (
    <section id="showcase" className="py-24">
      <div className="container mx-auto px-6">
        <div className="relative group">
          <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl relative overflow-hidden border border-gray-700/50">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage: `url('https://static.readdy.ai/image/ef1aae41220ad17a1705abffff22a58b/79e5b45dc8df25c645f3c7a350468079.jpeg')`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-violet-800/20"></div>
            </div>
          </div>
          <button className="group relative bg-transparent border border-white text-white px-8 py-4 rounded-xl text-base font-medium transition-all duration-300 hover:border-purple-400 hover:bg-purple-500/10 whitespace-nowrap cursor-pointer">
            <span className="relative z-10">View Services</span>
          </button>
        </div>
      </div>
    </section>
  );
}