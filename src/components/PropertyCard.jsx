// src/components/PropertyCard.jsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaBed, FaBath, FaRulerCombined, FaHeart, FaShareAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { formatPrice } from '../utils/formatPrice';

// --- COLOR CONSTANTS ---
const PRIMARY_COLOR = '#0f4882'; 
const PRIMARY_HOVER = '#1a5996'; 
const RED_ACCENT = '#ef4444';
const RED_HOVER = '#dc2626';

// --- STYLED COMPONENTS ---

const CardContainer = styled(motion.div)`
  background-color: white;
  border-radius: 0.75rem; /* rounded-xl */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06); /* shadow-lg */
  transition: all 300ms;
  overflow: hidden;
  border: 1px solid #f3f4f6; /* border border-gray-100 */

  &:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05); /* hover:shadow-2xl */
  }
`;

const ImageLink = styled(Link)`
  position: relative;
  display: block;
  overflow: hidden;
  height: 13rem; /* h-52 */
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 500ms;

  ${CardContainer}:hover & {
    transform: scale(1.05); /* group-hover:scale-105 */
  }
`;

const StatusTag = styled.span`
  position: absolute;
  top: 1rem;
  left: 1rem;
  font-size: 0.75rem; /* text-xs */
  font-weight: bold;
  color: white;
  padding: 0.25rem 0.75rem; /* px-3 py-1 */
  border-radius: 9999px; /* rounded-full */
`;

const SaveButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem;
  border-radius: 9999px; /* rounded-full */
  transition: background-color 150ms, color 150ms;

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const SavedButton = styled(SaveButton)`
  background-color: ${RED_ACCENT};
  color: white;
  &:hover {
    background-color: ${RED_HOVER};
  }
`;

const UnsavedButton = styled(SaveButton)`
  background-color: white;
  color: #4b5563; /* text-gray-700 */
  &:hover {
    background-color: #f3f4f6; /* hover:bg-gray-100 */
  }
`;

const DetailsContent = styled.div`
  padding: 1.5rem;
`;

const TitleLink = styled(Link)`
  font-size: 1.25rem; /* text-xl */
  font-weight: bold;
  color: #1f2937; /* text-gray-900 */
  margin-bottom: 0.5rem;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 150ms;

  &:hover {
    color: ${PRIMARY_COLOR}; /* hover:text-primary-600 */
  }
`;

const Location = styled.p`
  color: #6b7280; /* text-gray-500 */
  display: flex;
  align-items: center;
  margin-bottom: 1rem;

  svg {
    width: 1rem;
    height: 1rem;
    margin-right: 0.5rem;
    color: ${PRIMARY_COLOR}; /* text-primary-500 */
  }
`;

const PriceSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb; /* border-t pt-4 */
`;

const PriceText = styled.p`
  font-size: 1.5rem; /* text-2xl */
  font-weight: 800; /* font-extrabold */
  color: ${PRIMARY_COLOR}; /* text-primary-600 */
`;

const ShareButton = styled.button`
  color: #9ca3af; /* text-gray-400 */
  transition: color 150ms;

  &:hover {
    color: ${PRIMARY_COLOR}; /* hover:text-primary-600 */
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1rem;
  color: #374151; /* text-gray-700 */
`;

const FeatureItem = styled.div`
  text-align: center;

  svg {
    margin: 0 auto 0.25rem auto; /* mx-auto mb-1 */
    color: #9ca3af; /* text-gray-400 */
  }

  span {
    font-size: 0.875rem; /* text-sm */
  }
`;

const AmenitiesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const AmenityTag = styled.span`
  padding: 0.25rem 0.75rem; /* px-3 py-1 */
  background-color: #f3f4f6; /* bg-gray-100 */
  color: #4b5563; /* text-gray-600 */
  border-radius: 9999px; /* rounded-full */
  font-size: 0.75rem; /* text-xs */
`;

const ActionSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DetailsButton = styled(Link)`
  padding: 0.5rem 1.5rem; /* px-6 py-2 */
  background-color: ${PRIMARY_COLOR};
  color: white;
  border-radius: 0.5rem; /* rounded-lg */
  transition: background-color 150ms;
  font-weight: 500; /* font-medium */

  &:hover {
    background-color: ${PRIMARY_HOVER};
  }
`;

const AgentInfo = styled.p`
  font-size: 0.875rem; /* text-sm */
  color: #6b7280; /* text-gray-500 */

  span {
    font-weight: 600; /* font-semibold */
    color: #374151; /* text-gray-700 */
  }
`;

// The main component remains a functional React component
const PropertyCard = ({ property, onSaveProperty }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
    if (onSaveProperty) {
      onSaveProperty(property.id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'for-rent': return '#3b82f6'; // blue-500
      case 'for-sale': return '#10b981'; // green-500
      case 'sold': return '#ef4444'; // red-500
      case 'rented': return '#a855f7'; // purple-500
      default: return '#6b7280'; // gray-500
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'for-rent': return 'FOR RENT';
      case 'for-sale': return 'FOR SALE';
      case 'sold': return 'SOLD';
      case 'rented': return 'RENTED';
      default: return 'AVAILABLE';
    }
  };
  
  const StatusStyle = {
    backgroundColor: getStatusColor(property.status)
  };
  
  const SaveBtnComponent = isSaved ? SavedButton : UnsavedButton;
  
  return (
    <CardContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ImageLink to={`/property/${property.id}`}>
        <Image src={property.image} alt={property.title} />
        <StatusTag style={StatusStyle}>
          {getStatusText(property.status)}
        </StatusTag>
        <SaveBtnComponent
          onClick={handleSave}
          aria-label="Save property"
        >
          <FaHeart />
        </SaveBtnComponent>
      </ImageLink>

      <DetailsContent>
        <TitleLink to={`/property/${property.id}`}>
          {property.title}
        </TitleLink>
        <Location>
          <FaMapMarkerAlt />
          {property.location}
        </Location>

        <PriceSection>
          <PriceText>
            {formatPrice(property.price, property.status)}
          </PriceText>
          <ShareButton aria-label="Share property">
            <FaShareAlt />
          </ShareButton>
        </PriceSection>

        <FeaturesGrid>
          <FeatureItem>
            <FaBed />
            <span>{property.bedrooms} Beds</span>
          </FeatureItem>
          <FeatureItem>
            <FaBath />
            <span>{property.bathrooms} Baths</span>
          </FeatureItem>
          <FeatureItem>
            <FaRulerCombined />
            <span>{property.area} sqft</span>
          </FeatureItem>
        </FeaturesGrid>

        <AmenitiesContainer>
          {property.amenities?.slice(0, 3).map((amenity, index) => (
            <AmenityTag key={index}>
              {amenity}
            </AmenityTag>
          ))}
          {property.amenities?.length > 3 && (
            <AmenityTag>
              +{property.amenities.length - 3} more
            </AmenityTag>
          )}
        </AmenitiesContainer>

        <ActionSection>
          <DetailsButton to={`/property/${property.id}`}>
            View Details
          </DetailsButton>
          <AgentInfo>
            Agent: <span>{property.agentName}</span>
          </AgentInfo>
        </ActionSection>
      </DetailsContent>
    </CardContainer>
  );
};

export default PropertyCard;