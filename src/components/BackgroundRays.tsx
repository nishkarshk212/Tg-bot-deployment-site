"use client";

import React, { useEffect, useState } from "react";

export const BackgroundRays = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Base background */}
      <div className="absolute inset-0 bg-[#0d1117]" />
      
      {/* Interactive Spotlight */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000 opacity-40"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(37, 99, 235, 0.15), transparent 80%)`,
        }}
      />

      {/* Animated Rays */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" 
          style={{ animationDuration: '8s' }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse" 
          style={{ animationDuration: '12s', animationDelay: '2s' }}
        />
        <div 
          className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-600/10 blur-[100px] rounded-full animate-pulse" 
          style={{ animationDuration: '10s', animationDelay: '1s' }}
        />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      />

      {/* Radial overlay to darken edges */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0d1117_100%)]" />
    </div>
  );
};
