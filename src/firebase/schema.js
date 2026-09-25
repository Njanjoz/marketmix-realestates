// src/firebase/schema.js
export const propertySchema = {
  collections: {
    properties: {
      fields: {
        title: 'String',
        description: 'String',
        price: 'Number',
        type: 'String', // apartment, house, villa, commercial, land
        status: 'String', // for-rent, for-sale, sold, rented
        location: 'String',
        address: 'String',
        coordinates: {
          lat: 'Number',
          lng: 'Number'
        },
        bedrooms: 'Number',
        bathrooms: 'Number',
        area: 'Number', // square feet
        yearBuilt: 'Number',
        images: 'Array',
        amenities: 'Array',
        features: 'Array',
        agentId: 'String',
        ownerId: 'String',
        availableFrom: 'Timestamp',
        createdAt: 'Timestamp',
        updatedAt: 'Timestamp',
        featured: 'Boolean',
        verified: 'Boolean',
        views: 'Number',
        savedCount: 'Number'
      }
    },
    
    agents: {
      fields: {
        name: 'String',
        email: 'String',
        phone: 'String',
        photo: 'String',
        bio: 'String',
        specialties: 'Array',
        rating: 'Number',
        totalSales: 'Number',
        totalRentals: 'Number',
        experience: 'Number', // years
        languages: 'Array',
        activeListings: 'Number',
        joinedAt: 'Timestamp'
      }
    },
    
    users: {
      fields: {
        name: 'String',
        email: 'String',
        phone: 'String',
        type: 'String', // buyer, seller, tenant, landlord, agent
        savedProperties: 'Array',
        searchHistory: 'Array',
        notifications: 'Array',
        createdAt: 'Timestamp'
      }
    },
    
    inquiries: {
      fields: {
        propertyId: 'String',
        userId: 'String',
        name: 'String',
        email: 'String',
        phone: 'String',
        message: 'String',
        type: 'String', // viewing, question, offer
        status: 'String', // pending, contacted, scheduled, closed
        createdAt: 'Timestamp'
      }
    },
    
    viewings: {
      fields: {
        propertyId: 'String',
        userId: 'String',
        agentId: 'String',
        date: 'Timestamp',
        status: 'String', // pending, confirmed, completed, cancelled
        notes: 'String'
      }
    }
  }
};

// Example property data
export const sampleProperties = [
  {
    title: "Modern 3-Bedroom Apartment in Kilimani",
    description: "Spacious apartment with panoramic city views, modern finishes, and premium amenities.",
    price: 85000,
    type: "apartment",
    status: "for-rent",
    location: "Kilimani, Nairobi",
    bedrooms: 3,
    bathrooms: 2,
    area: 1800,
    amenities: ["Swimming Pool", "Gym", "24/7 Security", "Parking", "Garden"],
    images: ["image_urls"],
    featured: true
  },
  {
    title: "Luxury Villa in Karen",
    description: "Exclusive 5-bedroom villa with private garden, pool, and staff quarters.",
    price: 45000000,
    type: "villa",
    status: "for-sale",
    location: "Karen, Nairobi",
    bedrooms: 5,
    bathrooms: 4,
    area: 4500,
    amenities: ["Swimming Pool", "Garden", "Staff Quarters", "Garage", "Security"],
    images: ["image_urls"],
    featured: true
  }
];