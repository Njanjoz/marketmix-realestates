// src/pages/ContactPage.jsx - STYLED COMPONENTS VERSION
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

// --- COLOR AND STYLE CONSTANTS ---
const PRIMARY_BLUE = '#0284c7'; 
const PRIMARY_DARK = '#0c4a6e';
const WHITE = '#ffffff';
const BG_LIGHT = '#f9fafb';
const GRAY_600 = '#4b5563';
const GRAY_700 = '#374151';
const GRAY_300 = '#d1d5db';

// --- UTILITY STYLED COMPONENTS ---
const Container = styled.div`
    width: 100%;
    margin-left: auto;
    margin-right: auto;
    padding-left: 1rem;
    padding-right: 1rem;
    @media (min-width: 640px) { padding-left: 1.5rem; padding-right: 1.5rem; }
    @media (min-width: 1024px) { padding-left: 4rem; padding-right: 4rem; }
    @media (min-width: 1280px) { max-width: 1280px; }
`;

const PageWrapper = styled.div`
    min-height: 90vh;
    padding-top: 5rem;
    padding-bottom: 4rem;
    background-color: ${BG_LIGHT};
`;

const ContactContentGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    @media (min-width: 1024px) {
        grid-template-columns: 1fr 2fr;
    }
`;

const InfoCard = styled(motion.div)`
    background-color: ${WHITE};
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    
    .icon-wrapper {
        color: ${PRIMARY_BLUE};
        font-size: 2rem;
        margin-bottom: 0.75rem;
    }
    
    h3 {
        font-size: 1.125rem;
        font-weight: 700;
        color: ${GRAY_700};
        margin-bottom: 0.5rem;
    }
    
    .details {
        font-weight: 500;
        color: ${GRAY_700};
    }
    
    .description {
        font-size: 0.875rem;
        color: ${GRAY_600};
        margin-top: 0.5rem;
    }
`;

const FormCard = styled(motion.div)`
    background-color: ${WHITE};
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
`;

const FormInput = styled.input`
    width: 100%;
    padding: 0.75rem;
    border: 1px solid ${GRAY_300};
    border-radius: 0.5rem;
    &:focus {
        outline: none;
        border-color: ${PRIMARY_BLUE};
        box-shadow: 0 0 0 1px ${PRIMARY_BLUE};
    }
`;

const FormSelect = styled.select`
    width: 100%;
    padding: 0.75rem;
    border: 1px solid ${GRAY_300};
    border-radius: 0.5rem;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 1.5em 1.5em;
    cursor: pointer;
    &:focus {
        outline: none;
        border-color: ${PRIMARY_BLUE};
    }
`;

const FormTextarea = styled.textarea`
    width: 100%;
    padding: 0.75rem;
    border: 1px solid ${GRAY_300};
    border-radius: 0.5rem;
    resize: vertical;
    &:focus {
        outline: none;
        border-color: ${PRIMARY_BLUE};
        box-shadow: 0 0 0 1px ${PRIMARY_BLUE};
    }
`;

const PrimaryButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    background-color: ${PRIMARY_BLUE};
    color: ${WHITE};
    padding: 0.75rem;
    border-radius: 0.5rem;
    font-weight: 600;
    transition: background-color 200ms;
    
    &:hover {
        background-color: ${PRIMARY_DARK};
    }
`;

const SuccessMessage = styled(motion.div)`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 3rem 1rem;
    
    .icon {
        color: #10b981; /* green-500 */
        font-size: 3rem;
        margin-bottom: 1rem;
    }
    
    h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: ${GRAY_700};
        margin-bottom: 0.5rem;
    }
    
    p {
        color: ${GRAY_600};
        max-width: 400px;
    }
`;

const MapWrapper = styled.div`
    margin-top: 2rem;
    background-color: ${WHITE};
    border-radius: 1rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
`;

// --- REACT COMPONENT ---

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    propertyType: 'general'
  });
  const [submitted, setSubmitted] = useState(false);

  const contactInfo = [
    {
      icon: <FaPhone />,
      title: "Phone",
      details: ["+254 700 000 000", "+254 711 000 000"],
      description: "Mon-Fri from 8am to 6pm"
    },
    {
      icon: <FaEnvelope />,
      title: "Email",
      details: ["info@marketmix.co.ke", "support@marketmix.co.ke"],
      description: "We'll respond within 24 hours"
    },
    {
      icon: <FaMapMarkerAlt />,
      title: "Office",
      details: ["Westlands, Nairobi", "Mombasa Road, Nairobi"],
      description: "Visit our offices"
    },
    {
      icon: <FaClock />,
      title: "Business Hours",
      details: ["Mon-Fri: 8:00 AM - 6:00 PM", "Sat: 9:00 AM - 4:00 PM"],
      description: "Closed on Sundays"
    }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In real app, send to backend
    toast.success('Message sent successfully! We\'ll contact you shortly.');
    setSubmitted(true);
    setFormData({
      name: '', email: '', phone: '', subject: '', message: '', propertyType: 'general'
    });
  };

  return (
    <PageWrapper>
      <Container>
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Get In Touch</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're here to help you find your perfect property. Contact us through any of the methods below.
          </p>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {contactInfo.map((item, index) => (
            <InfoCard
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="icon-wrapper">{item.icon}</div>
              <h3>{item.title}</h3>
              {item.details.map((detail, i) => (
                <p key={i} className="details">{detail}</p>
              ))}
              <p className="description">{item.description}</p>
            </InfoCard>
          ))}
        </div>

        <ContactContentGrid>
          {/* Left Column - Contact Form */}
          <FormCard 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Send Us a Message</h2>
            <p className="text-gray-600 mb-6">Fill out the form for a prompt response from our team.</p>
            
            {submitted ? (
              <SuccessMessage
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="icon"><FaCheckCircle /></div>
                <h2>Message Sent!</h2>
                <p>Thank you for reaching out. We have received your inquiry and will get back to you within 24 hours.</p>
                <button 
                    onClick={() => setSubmitted(false)}
                    className="mt-6 text-primary-600 font-semibold hover:text-primary-700"
                >
                    Send Another Message
                </button>
              </SuccessMessage>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput type="text" name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} required />
                  <FormInput type="email" name="email" placeholder="Your Email" value={formData.email} onChange={handleChange} required />
                </div>
                
                <FormInput type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormSelect name="propertyType" value={formData.propertyType} onChange={handleChange}>
                        <option value="general">General Inquiry</option>
                        <option value="sale">Property for Sale</option>
                        <option value="rent">Property for Rent</option>
                        <option value="agent">Connect with an Agent</option>
                    </FormSelect>
                    <FormInput type="text" name="subject" placeholder="Subject" value={formData.subject} onChange={handleChange} required />
                </div>

                <FormTextarea name="message" rows="5" placeholder="Tell us about your property needs..." value={formData.message} onChange={handleChange} required></FormTextarea>
                
                <PrimaryButton type="submit">
                  <FaPaperPlane />
                  <span>Send Message</span>
                </PrimaryButton>
              </form>
            )}
          </FormCard>

          {/* Right Column - Map/Quick Links */}
          <div>
            {/* Quick Links */}
            <FormCard 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                style={{ marginBottom: '2rem' }}
            >
                <h3 className="text-xl font-bold mb-4">Quick Links</h3>
                <ul className="space-y-3">
                    <li><a href="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">How to List a Property →</a></li>
                    <li><a href="/properties?status=rent" className="text-primary-600 hover:text-primary-700 font-medium">Rental Application Process →</a></li>
                    <li><a href="/agents" className="text-primary-600 hover:text-primary-700 font-medium">Find an Agent Directly →</a></li>
                    <li><a href="#" className="text-primary-600 hover:text-primary-700 font-medium">Mortgage Assistance →</a></li>
                </ul>
            </FormCard>

            {/* Map Section */}
            <MapWrapper>
              <div className="h-64 bg-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📍</div>
                  <p className="text-gray-600">Interactive Map Integration Here</p>
                  <p className="text-sm text-gray-500">(Google Maps or Leaflet integration)</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Our Locations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold mb-2 text-gray-900">Nairobi Headquarters</h4>
                    <p className="text-gray-600">Westlands, Nairobi, Kenya</p>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2 text-gray-900">Mombasa Branch</h4>
                    <p className="text-gray-600">Nyali, Mombasa, Kenya</p>
                  </div>
                </div>
              </div>
            </MapWrapper>
          </div>
        </ContactContentGrid>
      </Container>
    </PageWrapper>
  );
};

export default ContactPage;