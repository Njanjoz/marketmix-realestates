// src/pages/AboutPage.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const AboutPage = () => {
  const [aboutData, setAboutData] = useState({
    title: 'About MarketMix',
    subtitle: 'Redefining real estate in Kenya with transparency, luxury, and trust.',
    story: 'MarketMix Real Estates is Kenya’s premier property platform connecting verified sellers, agents, investors, and buyers with world-class digital tools.'
  });

  useEffect(() => {
    const loadAbout = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'about'));
        if (snap.exists()) {
          setAboutData(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadAbout();
  }, []);

  return (
    <div className="min-h-screen pt-28 pb-20 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">{aboutData.title}</h1>
        <p className="text-lg text-gray-600 mb-8">{aboutData.subtitle}</p>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Our Story & Mission</h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{aboutData.story}</p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
