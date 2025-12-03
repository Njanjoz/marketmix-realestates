// src/pages/PropertyDetail.jsx - STYLED COMPONENTS VERSION
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useProperties } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { FaBed, FaBath, FaRulerCombined, FaCar, FaSwimmingPool, FaWifi, FaHeart, FaShareAlt, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaStar } from 'react-icons/fa';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import toast from 'react-hot-toast';
import MortgageCalculator from '../components/MortgageCalculator'; // Assuming this exists

// --- COLOR AND STYLE CONSTANTS ---
const PRIMARY_BLUE = '#0284c7'; 
const PRIMARY_DARK = '#0c4a6e';
const ACCENT_ORANGE = '#f59e0b';
const WHITE = '#ffffff';
const GRAY_600 = '#4b5563';
const GRAY_700 = '#374151';
const BG_LIGHT = '#f9fafb';

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

const Card = styled.div`
    background-color: ${WHITE};
    border-radius: 1rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
`;

// --- PROPERTY DETAIL SPECIFIC STYLES ---

const GalleryWrapper = styled.div`
    margin-bottom: 2rem;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

    img {
        width: 100%;
        height: 400px;
        object-fit: cover;
    }
`;

const PropertyHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
`;

const PriceText = styled.div`
    font-size: 2.5rem;
    font-weight: 800;
    color: ${PRIMARY_DARK};
    line-height: 1;
`;

const StatusBadge = styled.span`
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    color: ${WHITE};
    background-color: ${props => props.color};
`;

const InfoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 1rem;
    background-color: #f3f4f6; /* gray-100 */
    padding: 1rem;
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
`;

const InfoItem = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem;
    
    .icon {
        color: ${PRIMARY_BLUE};
        margin-bottom: 0.25rem;
    }
    
    .label {
        font-size: 0.875rem;
        color: ${GRAY_600};
    }
    
    .value {
        font-weight: 600;
        color: ${GRAY_700};
    }
`;

const ActionChip = styled.button`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    font-weight: 500;
    transition: all 200ms;
    border: 1px solid #d1d5db; /* gray-300 */
    background-color: ${WHITE};
    color: ${GRAY_700};
    
    &:hover {
        border-color: ${PRIMARY_BLUE};
        color: ${PRIMARY_BLUE};
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    
    &.saved {
        background-color: ${ACCENT_ORANGE};
        color: ${WHITE};
        border-color: ${ACCENT_ORANGE};
        &:hover {
            background-color: #d97706; /* amber-700 */
            border-color: #d97706;
        }
    }
`;

const TabsContainer = styled.div`
    border-bottom: 2px solid #e5e7eb; /* gray-200 */
    margin-bottom: 1.5rem;
    display: flex;
`;

const TabButton = styled.button`
    padding: 1rem 1.5rem;
    font-weight: 500;
    text-transform: capitalize;
    transition: color 200ms, border-color 200ms;
    
    ${props => props.active ? `
        border-bottom: 2px solid ${PRIMARY_BLUE};
        color: ${PRIMARY_BLUE};
        font-weight: 600;
    ` : `
        border-bottom: 2px solid transparent;
        color: ${GRAY_600};
        &:hover {
            color: ${GRAY_700};
        }
    `}
`;

const FeatureItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 500;
    color: ${GRAY_700};
    
    .icon {
        color: ${PRIMARY_BLUE};
    }
`;

const FormInput = styled.input`
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db; /* gray-300 */
    border-radius: 0.5rem;
    &:focus {
        outline: none;
        border-color: ${PRIMARY_BLUE};
        box-shadow: 0 0 0 1px ${PRIMARY_BLUE};
    }
`;

const FormTextarea = styled.textarea`
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    &:focus {
        outline: none;
        border-color: ${PRIMARY_BLUE};
        box-shadow: 0 0 0 1px ${PRIMARY_BLUE};
    }
`;

const FormButton = styled.button`
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

const AgentCard = styled(Card)`
    text-align: center;
    padding: 2rem;
    
    img {
        width: 5rem;
        height: 5rem;
        border-radius: 50%;
        object-fit: cover;
        margin: 0 auto 1rem;
        border: 3px solid ${PRIMARY_BLUE};
    }
`;


// --- REACT COMPONENT ---

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPropertyById } = useProperties();
  const { currentUser, saveProperty } = useAuth();
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaved, setIsSaved] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    preferredDate: '',
    preferredTime: ''
  });

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      setTimeout(() => {
        const foundProperty = getPropertyById(id);
        if (foundProperty) {
          setProperty({
            ...foundProperty,
            // Sample details not in the mock data, but needed for the detail page
            description: "Spacious apartment with panoramic city views, modern finishes, and premium amenities. Perfect for families or professionals seeking luxury living in the heart of Nairobi.",
            address: "Kilimani Road, Nairobi",
            yearBuilt: 2020,
            features: ["Gated Community", "24/7 Security", "Gym Access", "Backup Generator", "Ample Parking"],
            amenities: ["Swimming Pool", "Kids Play Area", "Borehole"],
            agent: { name: "Amina Hassan", phone: "+254 734 567 890", email: "amina@marketmix.co.ke", photo: "https://images.unsplash.com/photo-1580489944761-15a191d9d519" }
          });
          // Mock check if saved
          setIsSaved(Math.random() > 0.5); 
        } else {
          // Redirect if not found (or show 404)
          navigate('/properties');
        }
        setLoading(false);
      }, 500);
    };

    fetchProperty();
  }, [id, getPropertyById, navigate]);

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please log in to send an inquiry or book a viewing.');
      return;
    }
    // Mock submission logic
    toast.success('Inquiry sent! The agent will contact you shortly.');
    setInquiryForm({ name: '', email: '', phone: '', message: '', preferredDate: '', preferredTime: '' });
  };
  
  const handleSaveToggle = () => {
      if (!currentUser) {
          toast.error('Please log in to save properties.');
          return;
      }
      setIsSaved(!isSaved);
      saveProperty(property.id, !isSaved); // Assuming saveProperty handles the logic
      toast.success(isSaved ? 'Property unsaved!' : 'Property saved to favorites!');
  };

  const formatPrice = (price) => {
    if (property.status === 'rent') {
      return `KES ${price.toLocaleString()}/month`;
    }
    return `KES ${price.toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'rent': { text: 'FOR RENT', color: '#3b82f6' }, // blue-500
      'sale': { text: 'FOR SALE', color: '#10b981' }, // green-500
      'sold': { text: 'SOLD', color: '#ef4444' }, // red-500
      'rented': { text: 'RENTED', color: '#8b5cf6' } // purple-500
    };
    const badge = badges[status] || { text: status, color: '#6b7280' }; // gray-500
    return <StatusBadge color={badge.color}>{badge.text}</StatusBadge>;
  };

  if (loading || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <FaStar className="animate-spin text-primary-600 text-3xl" />
        <p className="ml-3 text-lg text-gray-600">Loading property details...</p>
      </div>
    );
  }

  const agent = property.agent;

  return (
    <PageWrapper>
      <Container>
        <GalleryWrapper>
            <Splide
                options={{
                    rewind: true,
                    gap: '1rem',
                    perPage: 1,
                    pagination: true,
                    breakpoints: { 768: { perPage: 1 } },
                }}
            >
                {property.images.slice(0, 4).map((image, index) => (
                    <SplideSlide key={index}>
                        <img src={image} alt={`${property.title} slide ${index + 1}`} />
                    </SplideSlide>
                ))}
            </Splide>
        </GalleryWrapper>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2">
            
            <PropertyHeader>
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{property.title}</h1>
                    <div className="flex items-center text-gray-600 mb-2">
                        <FaMapMarkerAlt className="mr-2" />
                        <span className="text-lg">{property.location}</span>
                    </div>
                    {getStatusBadge(property.status)}
                </div>
                <div className="text-right">
                    <PriceText>{formatPrice(property.price)}</PriceText>
                    <div className="flex gap-3 mt-2">
                        <ActionChip 
                            onClick={handleSaveToggle}
                            className={isSaved ? 'saved' : ''}
                        >
                            <FaHeart />
                            {isSaved ? 'Saved' : 'Save'}
                        </ActionChip>
                        <ActionChip onClick={() => toast.success('Link copied!')}>
                            <FaShareAlt />
                            Share
                        </ActionChip>
                    </div>
                </div>
            </PropertyHeader>
            
            {/* Main Info Badges */}
            <InfoGrid>
                <InfoItem>
                    <FaBed className="icon" size={24} />
                    <span className="value">{property.bedrooms}</span>
                    <span className="label">Beds</span>
                </InfoItem>
                <InfoItem>
                    <FaBath className="icon" size={24} />
                    <span className="value">{property.bathrooms}</span>
                    <span className="label">Baths</span>
                </InfoItem>
                <InfoItem>
                    <FaRulerCombined className="icon" size={24} />
                    <span className="value">{property.area} sqft</span>
                    <span className="label">Area</span>
                </InfoItem>
                <InfoItem>
                    <FaCalendarAlt className="icon" size={24} />
                    <span className="value">{property.yearBuilt}</span>
                    <span className="label">Built</span>
                </InfoItem>
            </InfoGrid>

            {/* Tabs */}
            <Card>
                <TabsContainer>
                    {['overview', 'features', 'location', 'virtual-tour'].map((tab) => (
                        <TabButton
                            key={tab}
                            active={activeTab === tab}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.replace('-', ' ')}
                        </TabButton>
                    ))}
                </TabsContainer>

                {/* Tab Content - Overview */}
                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Property Description</h3>
                        <p className="text-gray-700 leading-relaxed mb-6">{property.description}</p>

                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Property Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-gray-700">
                            <div><span className="font-semibold">Type:</span> {property.type.charAt(0).toUpperCase() + property.type.slice(1)}</div>
                            <div><span className="font-semibold">Status:</span> {property.status.toUpperCase()}</div>
                            <div><span className="font-semibold">Address:</span> {property.address}</div>
                            <div><span className="font-semibold">Price:</span> {formatPrice(property.price)}</div>
                        </div>
                    </motion.div>
                )}

                {/* Tab Content - Features */}
                {activeTab === 'features' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Key Features & Amenities</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                            {property.features.map((feature, index) => (
                                <FeatureItem key={index}>
                                    <FaCheckCircle className="icon" size={20} />
                                    <span>{feature}</span>
                                </FeatureItem>
                            ))}
                            {property.amenities.map((amenity, index) => (
                                <FeatureItem key={index}>
                                    <FaStar className="icon" size={20} />
                                    <span>{amenity}</span>
                                </FeatureItem>
                            ))}
                        </div>
                    </motion.div>
                )}
                
                {/* Tab Content - Location */}
                {activeTab === 'location' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Location Map</h3>
                        <div className="h-64 bg-gray-200 flex items-center justify-center rounded-lg">
                            <p className="text-gray-600">Map Integration Here ({property.location})</p>
                        </div>
                        <p className="mt-4 text-gray-700">Located in the prime area of {property.location}, offering easy access to major roads and amenities.</p>
                    </motion.div>
                )}
                
                {/* Tab Content - Virtual Tour */}
                {activeTab === 'virtual-tour' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">360° Virtual Tour</h3>
                        <div className="h-96 bg-gray-200 flex items-center justify-center rounded-lg">
                            <p className="text-gray-600">Video / 360 Embed Integration Here</p>
                        </div>
                    </motion.div>
                )}
            </Card>
          </div>
          
          {/* Right Column - Agent & Tools */}
          <div>
            
            {/* Agent Card */}
            <AgentCard style={{ marginBottom: '2rem' }}>
                <img src={agent.photo} alt={agent.name} />
                <h3 className="text-xl font-bold text-gray-900">{agent.name}</h3>
                <p className="text-sm text-gray-500 mb-4">Property Specialist</p>
                
                <a href={`tel:${agent.phone}`} className="flex items-center justify-center gap-2 font-semibold text-lg text-primary-600 hover:text-primary-700 mb-3">
                    <FaPhone /> {agent.phone}
                </a>
                <a href={`mailto:${agent.email}`} className="flex items-center justify-center gap-2 font-semibold text-lg text-primary-600 hover:text-primary-700">
                    <FaEnvelope /> {agent.email}
                </a>
            </AgentCard>

            {/* Mortgage Calculator (Assuming component exists) */}
            <MortgageCalculator initialPrice={property.price} style={{ marginBottom: '2rem' }} />

            {/* Inquiry Form */}
            <Card>
              <h3 className="text-xl font-bold mb-4">Book a Viewing / Send Inquiry</h3>
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <FormInput
                  type="text"
                  placeholder="Your Name"
                  value={inquiryForm.name}
                  onChange={(e) => setInquiryForm({...inquiryForm, name: e.target.value})}
                  required
                />
                <FormInput
                  type="email"
                  placeholder="Your Email"
                  value={inquiryForm.email}
                  onChange={(e) => setInquiryForm({...inquiryForm, email: e.target.value})}
                  required
                />
                <FormInput
                  type="tel"
                  placeholder="Phone Number"
                  value={inquiryForm.phone}
                  onChange={(e) => setInquiryForm({...inquiryForm, phone: e.target.value})}
                  required
                />
                
                <div className="flex gap-4">
                    <FormInput 
                        type="date"
                        value={inquiryForm.preferredDate}
                        onChange={(e) => setInquiryForm({...inquiryForm, preferredDate: e.target.value})}
                        placeholder="Preferred Date"
                    />
                    <FormInput 
                        type="time"
                        value={inquiryForm.preferredTime}
                        onChange={(e) => setInquiryForm({...inquiryForm, preferredTime: e.target.value})}
                        placeholder="Preferred Time"
                    />
                </div>
                
                <FormTextarea
                  placeholder="Your Message"
                  value={inquiryForm.message}
                  onChange={(e) => setInquiryForm({...inquiryForm, message: e.target.value})}
                  rows="3"
                  required
                ></FormTextarea>
                
                <FormButton type="submit">
                  Send Inquiry
                </FormButton>
              </form>
            </Card>
          </div>
        </div>
      </Container>
    </PageWrapper>
  );
};

export default PropertyDetail;