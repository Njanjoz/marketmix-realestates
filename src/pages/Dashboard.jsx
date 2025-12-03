// src/pages/Dashboard.jsx - STYLED COMPONENTS VERSION
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext'; // Assuming context exists
import { FaHome, FaHeart, FaBell, FaCog, FaSignOutAlt, FaUser, FaEnvelope, FaPhone, FaEdit, FaChartLine, FaHistory, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt, FaBed, FaDollarSign } from 'react-icons/fa';

// --- COLOR AND STYLE CONSTANTS ---
const PRIMARY_BLUE = '#0284c7'; 
const PRIMARY_DARK = '#0c4a6e';
const WHITE = '#ffffff';
const BG_LIGHT = '#f9fafb';
const GRAY_100 = '#f3f4f6';
const GRAY_300 = '#d1d5db';
const GRAY_600 = '#4b5563';
const GRAY_700 = '#374151';

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

const DashboardGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    @media (min-width: 1024px) {
        grid-template-columns: 280px 1fr;
    }
`;

const Sidebar = styled.div`
    background-color: ${WHITE};
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 6rem;
    height: fit-content;
`;

const ProfileCard = styled.div`
    text-align: center;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid ${GRAY_300};
    margin-bottom: 1.5rem;
    
    img {
        width: 4rem;
        height: 4rem;
        border-radius: 50%;
        object-fit: cover;
        margin: 0 auto 0.5rem;
        border: 2px solid ${PRIMARY_BLUE};
    }
`;

const NavButton = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    transition: all 150ms;
    font-weight: 500;
    
    ${props => props.active ? `
        background-color: ${PRIMARY_BLUE};
        color: ${WHITE};
    ` : `
        color: ${GRAY_700};
        &:hover {
            background-color: ${GRAY_100};
        }
    `}
    
    .icon {
        font-size: 1.25rem;
    }
`;

const LogoutButton = styled(NavButton)`
    margin-top: 1rem;
    color: #ef4444; /* red-500 */
    border: 1px solid #fca5a5; /* red-300 */
    background-color: #fee2e2; /* red-100 */
    
    &:hover {
        background-color: #fecaca; /* red-200 */
    }
`;

const ContentPanel = styled(motion.div)`
    background-color: ${WHITE};
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 2rem;
`;

const StatCard = styled.div`
    padding: 1.5rem;
    background-color: ${props => props.color};
    color: ${WHITE};
    border-radius: 0.75rem;
    
    .icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }
    
    .value {
        font-size: 2rem;
        font-weight: 700;
        line-height: 1;
    }
    
    .label {
        font-size: 0.875rem;
        opacity: 0.9;
    }
`;

const NotificationItem = styled.div`
    display: flex;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid ${GRAY_100};
    cursor: pointer;
    transition: background-color 150ms;
    
    &:hover {
        background-color: ${GRAY_100};
    }
    
    ${props => props.unread && `
        background-color: #eff6ff; /* blue-50 */
        font-weight: 600;
    `}
`;

const SavedPropertyCard = styled.div`
    border: 1px solid ${GRAY_300};
    border-radius: 0.75rem;
    overflow: hidden;
    background-color: ${WHITE};
    display: flex;
    flex-direction: column;
    
    .image-wrapper {
        height: 12rem;
        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }
    
    .content {
        padding: 1rem;
        h4 {
            font-weight: 700;
            color: ${GRAY_700};
            margin-bottom: 0.25rem;
        }
        p {
            font-size: 0.875rem;
            color: ${GRAY_600};
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
    }
`;

const PrimaryLink = styled.button`
    color: ${PRIMARY_BLUE};
    font-weight: 500;
    transition: color 150ms;
    &:hover {
        color: ${PRIMARY_DARK};
    }
`;

const FormInput = styled.input`
    width: 100%;
    padding: 0.75rem;
    border: 1px solid ${GRAY_300};
    border-radius: 0.5rem;
    background-color: #f9fafb; /* gray-50 */
    
    &:focus {
        outline: none;
        border-color: ${PRIMARY_BLUE};
        box-shadow: 0 0 0 1px ${PRIMARY_BLUE};
        background-color: ${WHITE};
    }
`;

const PrimaryButton = styled.button`
    background-color: ${PRIMARY_BLUE};
    color: ${WHITE};
    padding: 0.75rem 2rem;
    border-radius: 0.5rem;
    font-weight: 600;
    transition: background-color 200ms;
    
    &:hover {
        background-color: ${PRIMARY_DARK};
    }
`;

// --- REACT COMPONENT ---

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Mock implementations for useAuth hooks
  const useAuth = () => ({
    userProfile: { displayName: "Jane Doe", email: "jane.doe@example.com", phone: "+254 7XX XXX XXX", userType: "Buyer", profileImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    currentUser: true, // Mock: assuming user is logged in
    logout: async () => console.log("Logging out...") // Mock logout
  });
    
  const { userProfile, currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const savedProperties = [
    {
      id: 1,
      title: "Modern 3-Bedroom Apartment",
      location: "Kilimani, Nairobi",
      price: 85000,
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811"
    },
    {
      id: 2,
      title: "Luxury Villa in Karen",
      location: "Karen, Nairobi",
      price: 45000000,
      image: "https://images.unsplash.com/photo-1613977257363-707ba9348227"
    }
  ];

  const recentSearches = [
    { query: "2 Bedroom Apartments in Westlands", date: "2024-01-15" },
    { query: "Properties for Rent under 100K", date: "2024-01-14" },
    { query: "Houses in Runda", date: "2024-01-13" }
  ];

  const notifications = [
    { id: 1, message: "Price reduced on a property you saved", time: "2 hours ago", read: false },
    { id: 2, message: "New properties matching your criteria", time: "1 day ago", read: true },
    { id: 3, message: "Viewing scheduled for tomorrow", time: "2 days ago", read: true }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };
  
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Static Dashboard Stats (Mock Data)
  const stats = [
    { label: 'Saved Properties', value: savedProperties.length, icon: FaHeart, color: '#10b981' }, // green-500
    { label: 'Unread Messages', value: 3, icon: FaEnvelope, color: '#f59e0b' }, // amber-500
    { label: 'Scheduled Viewings', value: 1, icon: FaCalendarAlt, color: '#3b82f6' }, // blue-500
    { label: 'Active Listings', value: userProfile.userType === 'Seller' ? 2 : 0, icon: FaHome, color: '#8b5cf6' }, // violet-500
  ];
  
  // Settings Form State (Mock)
  const [settingsForm, setSettingsForm] = useState({
      displayName: userProfile.displayName,
      email: userProfile.email,
      phone: userProfile.phone,
      userType: userProfile.userType,
  });
  
  const handleSettingsChange = (e) => {
      setSettingsForm({ ...settingsForm, [e.target.name]: e.target.value });
  };
  
  const handleSettingsSubmit = (e) => {
      e.preventDefault();
      toast.success('Settings updated successfully!');
  };


  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <FaChartLine className="icon" /> },
    { id: 'saved', label: 'Saved Properties', icon: <FaHeart className="icon" /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell className="icon" />, badge: unreadCount },
    { id: 'history', label: 'Search History', icon: <FaHistory className="icon" /> },
    { id: 'settings', label: 'Settings', icon: <FaCog className="icon" /> },
  ];

  return (
    <PageWrapper>
      <Container>
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-extrabold text-gray-900">{getGreeting()}, {userProfile.displayName}!</h1>
          <p className="text-gray-600">Your personalized real estate hub.</p>
        </motion.header>
        
        <DashboardGrid>
          
          {/* Left Column - Sidebar Navigation */}
          <Sidebar>
            <ProfileCard>
              <img src={userProfile.profileImage} alt={userProfile.displayName} />
              <h3 className="text-lg font-bold text-gray-900">{userProfile.displayName}</h3>
              <p className="text-sm text-gray-500">{userProfile.userType} Account</p>
              <PrimaryLink onClick={() => setActiveTab('settings')}>
                  <FaEdit className="inline mr-1" size={14} /> Edit Profile
              </PrimaryLink>
            </ProfileCard>

            <nav className="space-y-2">
              {menuItems.map((item) => (
                <NavButton
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  active={activeTab === item.id}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge > 0 && item.id === 'notifications' && (
                    <span className="ml-auto bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </NavButton>
              ))}
            </nav>
            
            {/* Logout Button */}
            <LogoutButton onClick={handleLogout}>
              <FaSignOutAlt className="icon" />
              <span>Log Out</span>
            </LogoutButton>
          </Sidebar>

          {/* Right Column - Content */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <ContentPanel>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <StatCard color={stat.color}>
                            <stat.icon className="icon" />
                            <div className="value">{stat.value}</div>
                            <div className="label">{stat.label}</div>
                        </StatCard>
                    </motion.div>
                  ))}
                </div>
                
                {/* Quick Access Panels */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Saved Properties Snapshot */}
                    <ContentPanel style={{ padding: '1.5rem 0' }}>
                        <div className="flex justify-between items-center mb-4 px-6">
                            <h2 className="text-xl font-bold">Saved Properties</h2>
                            <PrimaryLink onClick={() => setActiveTab('saved')}>View All →</PrimaryLink>
                        </div>
                        <div className="space-y-4 px-6">
                            {savedProperties.slice(0, 2).map(prop => (
                                <div key={prop.id} className="flex items-center gap-4 border border-gray-100 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                    <img src={prop.image} alt={prop.title} className="w-16 h-16 object-cover rounded-md" />
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{prop.title}</h4>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <FaMapMarkerAlt size={12} /> {prop.location}
                                        </p>
                                    </div>
                                    <div className="ml-auto text-lg font-bold text-primary-600">
                                        <FaDollarSign size={14} className="inline mr-1" />
                                        {prop.price.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ContentPanel>
                    
                    {/* Recent Searches Snapshot */}
                    <ContentPanel style={{ padding: '1.5rem 0' }}>
                        <div className="flex justify-between items-center mb-4 px-6">
                            <h2 className="text-xl font-bold">Recent Searches</h2>
                            <PrimaryLink onClick={() => setActiveTab('history')}>View History →</PrimaryLink>
                        </div>
                        <div className="space-y-3">
                            {recentSearches.map((search, index) => (
                                <div key={index} className="flex justify-between items-center text-sm px-6 py-2 hover:bg-gray-50 transition-colors">
                                    <p className="text-gray-700">{search.query}</p>
                                    <span className="text-gray-500 text-xs">{search.date}</span>
                                </div>
                            ))}
                        </div>
                    </ContentPanel>
                </div>
              </ContentPanel>
            )}

            {/* Saved Properties Tab */}
            {activeTab === 'saved' && (
              <ContentPanel>
                <h2 className="text-2xl font-bold mb-6">Your Saved Properties</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {savedProperties.map((property) => (
                    <SavedPropertyCard key={property.id}>
                        <div className="image-wrapper">
                            <img src={property.image} alt={property.title} />
                        </div>
                        <div className="content">
                            <h4 className="text-lg">{property.title}</h4>
                            <p>
                                <FaMapMarkerAlt /> {property.location}
                            </p>
                            <p className="text-xl font-bold text-primary-600">
                                <FaDollarSign size={14} className="inline mr-1" />
                                {property.price.toLocaleString()}
                            </p>
                            <PrimaryButton 
                                onClick={() => navigate(`/property/${property.id}`)}
                                style={{ marginTop: '1rem', width: '100%' }}
                            >
                                View Details
                            </PrimaryButton>
                        </div>
                    </SavedPropertyCard>
                  ))}
                  
                  {savedProperties.length === 0 && (
                    <div className="text-center py-12 col-span-full text-gray-600">No saved properties yet.</div>
                  )}
                </div>
              </ContentPanel>
            )}
            
            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <ContentPanel>
                <h2 className="text-2xl font-bold mb-6">Notifications</h2>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {notifications.map((n) => (
                      <NotificationItem key={n.id} unread={!n.read}>
                        <FaBell className={`mr-4 ${n.read ? 'text-gray-400' : 'text-primary-600'}`} size={20} />
                        <div className="flex-grow">
                          <p className={`text-sm ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>{n.message}</p>
                          <span className="text-xs text-gray-500">{n.time}</span>
                        </div>
                        {!n.read && <div className="w-2 h-2 bg-red-500 rounded-full ml-4"></div>}
                      </NotificationItem>
                    ))}
                </div>
              </ContentPanel>
            )}
            
            {/* Search History Tab */}
            {activeTab === 'history' && (
              <ContentPanel>
                <h2 className="text-2xl font-bold mb-6">Search History</h2>
                <div className="space-y-4">
                  {recentSearches.map((search, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-700">{search.query}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{search.date}</span>
                        <PrimaryLink onClick={() => navigate(`/properties?search=${search.query}`)}>Search Again</PrimaryLink>
                      </div>
                    </div>
                  ))}
                </div>
              </ContentPanel>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <ContentPanel>
                    <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
                    <form onSubmit={handleSettingsSubmit} className="space-y-8">
                        {/* Personal Info */}
                        <div>
                            <h3 className="text-xl font-bold mb-4">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <FormInput type="text" name="displayName" value={settingsForm.displayName} onChange={handleSettingsChange} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                                    <FormInput type="text" name="userType" value={settingsForm.userType} disabled />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <FormInput type="email" name="email" value={settingsForm.email} onChange={handleSettingsChange} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <FormInput type="tel" name="phone" value={settingsForm.phone} onChange={handleSettingsChange} required />
                                </div>
                            </div>
                        </div>

                        {/* Notification Preferences */}
                        <div>
                            <h3 className="text-xl font-bold mb-4">Notification Preferences</h3>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3">
                                    <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 rounded" />
                                    <span>Email notifications for new properties</span>
                                </label>
                                <label className="flex items-center gap-3">
                                    <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 rounded" />
                                    <span>Price drop alerts for saved properties</span>
                                </label>
                                <label className="flex items-center gap-3">
                                    <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />
                                    <span>Weekly property digest</span>
                                </label>
                            </div>
                        </div>

                        <PrimaryButton type="submit">
                            Save Changes
                        </PrimaryButton>
                    </form>
                </ContentPanel>
            )}
          </motion.div>
        </DashboardGrid>
      </Container>
    </PageWrapper>
  );
};

export default Dashboard;