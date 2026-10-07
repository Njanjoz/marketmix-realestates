// src/components/seller/constants/propertyTaxonomy.js

export const PROPERTY_TYPES = [
  { id: 'urbannest', label: 'UrbanNest (Short Stay)', description: 'Furnished short-term stays, vacation homes, and serviced apartments.' },
  { id: 'single_room', label: 'Single Room', description: 'One private room rented separately, usually with shared facilities.' },
  { id: 'bedsitter', label: 'Bedsitter', description: 'A single self-contained living space combining sleeping/living area with private facilities.' },
  { id: 'student_hostel', label: 'Student Hostel', description: 'Purpose-built or managed accommodation primarily for students.' },
  { id: 'apartment', label: 'Apartment / Flat', description: 'A multi-unit residential building.' },
  { id: 'studio_apartment', label: 'Studio Apartment', description: 'Self-contained open-plan residential unit.' },
  { id: 'maisonette', label: 'Maisonette', description: 'A multi-level residential house, commonly within its own compound.' },
  { id: 'bungalow', label: 'Bungalow', description: 'A generally single-storey standalone residential house.' },
  { id: 'townhouse', label: 'Townhouse', description: 'A multi-level house forming part of a connected or planned residential development.' },
  { id: 'duplex', label: 'Duplex', description: 'A residential unit arranged over two levels.' },
  { id: 'standalone_house', label: 'Standalone House', description: 'A detached residential house.' },
  { id: 'semi_detached', label: 'Semi-Detached House', description: 'A house sharing one wall with another house.' },
  { id: 'shared_house', label: 'Shared House', description: 'A house where occupants rent individual rooms and share common facilities.' },
  { id: 'serviced_apartment', label: 'Serviced Apartment', description: 'A furnished residential unit with additional services.' },
  { id: 'guest_house', label: 'Guest House', description: 'Short-term or guest accommodation.' },
  { id: 'compound', label: 'Compound / Shared Compound', description: 'Multiple residential units sharing a compound.' },
  { id: 'commercial', label: 'Commercial / Mixed-Use Property', description: 'Property containing commercial, residential or mixed-use spaces.' },
  { id: 'land', label: 'Land', description: 'Vacant land/property parcel.' },
  { id: 'other', label: 'Other', description: 'Something not listed above.' },
];

// Unit options keyed by property type
export const UNIT_OPTIONS_BY_PROPERTY = {
  apartment: ['Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom', '4 Bedroom', '5+ Bedroom', 'Penthouse', 'Other'],
  studio_apartment: ['Studio', 'Other'],
  maisonette: ['1 Bedroom', '2 Bedroom', '3 Bedroom', '4 Bedroom', '5 Bedroom', '6+ Bedroom', 'Other'],
  bungalow: ['1 Bedroom', '2 Bedroom', '3 Bedroom', '4 Bedroom', '5 Bedroom', '6+ Bedroom', 'Other'],
  townhouse: ['1 Bedroom', '2 Bedroom', '3 Bedroom', '4 Bedroom', '5 Bedroom', '6+ Bedroom', 'Other'],
  duplex: ['1 Bedroom', '2 Bedroom', '3 Bedroom', '4 Bedroom', '5 Bedroom', '6+ Bedroom', 'Other'],
  standalone_house: ['1 Bedroom', '2 Bedroom', '3 Bedroom', '4 Bedroom', '5 Bedroom', '6+ Bedroom', 'Other'],
  semi_detached: ['1 Bedroom', '2 Bedroom', '3 Bedroom', '4 Bedroom', '5 Bedroom', '6+ Bedroom', 'Other'],
  serviced_apartment: ['Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom', 'Penthouse', 'Other'],
  shared_house: ['Individual room', 'Shared room', 'Bed space', 'Other'],
  student_hostel: ['Single Room', 'Double Room', 'Triple Room', 'Quadruple Room', 'Shared Room', 'Bed Space', 'Ensuite Single', 'Non-Ensuite Single', 'Ensuite Shared', 'Non-Ensuite Shared', 'Other'],
  single_room: ['Single Room', 'Other'],
  bedsitter: ['Bedsitter', 'Self-contained Bedsitter', 'Non-self-contained Bedsitter'],
  guest_house: ['Single Room', 'Double Room', 'Suite', 'Other'],
  compound: ['Entire property', 'Individual room', 'Floor/unit', 'Other'],
  commercial: ['Commercial space', 'Office', 'Shop', 'Warehouse', 'Mixed-use', 'Other'],
  land: ['Residential', 'Commercial', 'Agricultural', 'Mixed-use', 'Development land', 'Other'],
  other: ['Entire property', 'Individual room', 'Other'],
};

export const GENERAL_UNIT_OPTIONS = [
  'Entire property', 'Entire house', 'Entire apartment', 'Entire studio',
  'Individual room', 'Shared room', 'Bed space', 'Floor/unit',
  'Commercial space', 'Land parcel', 'Other',
];

export const RENTAL_MODELS = [
  'Entire property', 'Entire apartment', 'Entire house', 'Individual room',
  'Shared room', 'Bed space', 'Short-term', 'Long-term', 'Daily', 'Weekly',
  'Monthly', 'Semester', 'Annual', 'Other',
];

export const OCCUPANCY_OPTIONS = ['1', '2', '3', '4', '5+', 'Custom'];

export const SUITABLE_FOR = [
  'Students', 'Families', 'Couples', 'Working professionals',
  'Short-term visitors', 'General', 'Other',
];

export const GENDER_ACCOMMODATION = ['Male', 'Female', 'Mixed', 'No restriction'];

export const STUDENT_HOUSING_CLASSIFICATION = [
  'University hostel', 'Private hostel', 'Student apartment',
  'Bedsitter', 'Single room', 'Shared accommodation', 'General residential property',
];

export const INSTITUTION_TYPES = ['University', 'TVET', 'College', 'Medical training college', 'Other'];

export const ROOM_SIZES = ['Small', 'Medium', 'Large', 'Custom dimensions'];

export const SLEEPING_ARRANGEMENTS = [
  'Bed included', 'Mattress included', 'Bed + mattress', 'No bed', 'Bunk bed', 'Other',
];

export const ROOM_FURNITURE = [
  'Bed', 'Mattress', 'Wardrobe', 'Desk', 'Chair', 'Shelves', 'Curtains', 'Mirror', 'Other',
];

export const BATHROOM_OPTIONS = [
  'Private', 'Ensuite', 'Shared', 'Multiple shared bathrooms', 'No bathroom',
];

export const KITCHEN_OPTIONS = [
  'Private kitchen', 'Shared kitchen', 'Kitchenette', 'Common hostel kitchen', 'No kitchen',
];

export const PAYMENT_FREQUENCIES = [
  'Daily', 'Weekly', 'Monthly', 'Every 2 months', 'Quarterly', 'Semester', 'Annual', 'Other',
];

export const DEPOSIT_OPTIONS = ['None', "One month's rent", 'Fixed amount', 'Other'];

export const DEPOSIT_REFUNDABLE = ['Yes', 'No', 'Conditions apply'];

export const WATER_SOURCES = [
  'County water', 'Borehole', 'Well', 'Water vendor', 'Rainwater',
  'Multiple sources', 'Other', 'Unknown',
];

export const WATER_RELIABILITY = [
  'Reliable', 'Usually available', 'Intermittent', 'Frequently unavailable', 'Unknown',
];

export const WATER_CHARGING_METHOD = [
  'Fixed monthly', 'Per person', 'Per room', 'Metered', 'Other',
];

export const WATER_STORAGE = ['Water tank', 'Underground tank', 'Elevated tank', 'None', 'Other'];

export const HOT_WATER = ['Available', 'Not available', 'Shared', 'Private', 'Solar', 'Electric', 'Other'];

export const ELECTRICITY_TYPES = [
  'Prepaid tokens', 'Postpaid meter', 'Included in rent', 'Landlord-managed',
  'Shared meter', 'Individual meter', 'Solar', 'Other',
];

export const GARBAGE_OPTIONS = ['Included', 'Extra charge', 'Not available', 'Unknown'];

export const CLEANING_OPTIONS = ['Included', 'Extra', 'Not available'];

export const INTERNET_OPTIONS = [
  'Wi-Fi included', 'Wi-Fi available at extra cost', 'Fibre available',
  'Mobile network only', 'No internet', 'Unknown',
];

export const MANAGER_TYPES = [
  'Landlord', 'Property manager', 'Agent', 'Caretaker',
  'Hostel management', 'Company', 'Other',
];

export const MANAGEMENT_AVAILABILITY = [
  '24/7', 'Daytime', 'Business hours', 'On call', 'Not specified',
];

export const RESPONSE_TIMES = [
  'Under 15 minutes', '15–30 minutes', '30–60 minutes', '1–3 hours',
  'Same day', 'Next day', 'More than 1 day', 'Not specified',
];

export const SECURITY_FEATURES = [
  'Locked main gate', 'Watchman/security guard', 'CCTV', 'Perimeter wall',
  'Electric fence', 'Security lighting', 'Controlled entrance', 'Visitor registration',
  'Key access', 'Access card', 'Intercom', 'Alarm', 'Secure parking',
  'Security patrol', 'Caretaker lives on site', 'Landlord lives on site', 'Other', 'None',
];

export const GATE_LOCKED = ['Always', 'At night', 'Specific hours', 'Never', 'Not specified'];

export const AFTER_HOURS_ACCESS = [
  'Free access', 'Key', 'Access card', 'Security approval',
  'Caretaker assistance', 'Not allowed', 'Other',
];

export const VISITOR_POLICY = [
  'Allowed anytime', 'Allowed during specified hours', 'Registration required',
  'Approval required', 'Not allowed', 'Other',
];

export const OVERNIGHT_VISITORS = ['Allowed', 'Allowed with permission', 'Not allowed', 'Not specified'];

export const CURFEW_OPTIONS = ['None', 'Yes', 'Specific time', 'Other'];

export const PARTY_POLICY = [
  'Allowed', 'Allowed with management approval', 'Limited', 'Not allowed', 'Not specified',
];

export const MUSIC_POLICY = [
  'Allowed', 'Allowed until specific time', 'Quiet hours enforced', 'Strictly prohibited', 'Not specified',
];

export const GATHERING_POLICY = ['Allowed', 'Limited', 'Approval required', 'Not allowed', 'Other'];

export const SMOKING_POLICY = ['Allowed', 'Designated area', 'Not allowed', 'Not specified'];
export const ALCOHOL_POLICY = ['Allowed', 'Restricted', 'Not allowed', 'Not specified'];
export const PETS_POLICY = ['Allowed', 'Restricted', 'Not allowed', 'Not specified'];
export const HOURS_POLICY = ['Anytime', 'Specific hours', 'Other'];

export const ROAD_TYPES = ['Tarmac', 'Paved', 'Murram', 'Gravel', 'Rough', 'Footpath', 'Mixed'];
export const ROAD_CONDITIONS = ['Good', 'Fair', 'Poor', 'Difficult during rain', 'Unknown'];
export const STREET_LIGHTING = ['Good', 'Some lighting', 'Poor', 'None', 'Unknown'];
export const FLOODING_HISTORY = ['Never reported', 'Occasional', 'Frequent', 'Unknown'];

export const TRANSPORT_OPTIONS = ['Matatu', 'Bus', 'Boda boda', 'Taxi', 'Walking', 'Other'];

export const ROOM_AMENITIES = [
  'Bed', 'Mattress', 'Wardrobe', 'Desk', 'Chair', 'Shelves',
  'Curtains', 'Balcony', 'Private toilet', 'Private shower',
];

export const PROPERTY_AMENITIES = [
  'Wi-Fi', 'Laundry', 'Kitchen', 'Common room', 'Study room', 'Parking',
  'Water tank', 'Borehole', 'Solar', 'Generator', 'CCTV', 'Garden',
  'Gym', 'Shop', 'Restaurant', 'Other',
];

export const NEARBY_PLACE_TYPES = [
  'Campus', 'Main road', 'Matatu stage', 'Shopping centre', 'Supermarket',
  'M-Pesa', 'ATM', 'Pharmacy', 'Hospital/clinic', 'Restaurant/food',
  'Laundry', 'Gym', 'Police station', 'Church', 'Mosque', 'Other',
];

export const MEDIA_CATEGORIES = [
  { id: 'room', label: 'Room', prompt: 'Add the main room photo.' },
  { id: 'bedroom', label: 'Bedroom', prompt: 'Add the bedroom photo.' },
  { id: 'bathroom', label: 'Bathroom', prompt: 'Add the bathroom photo.' },
  { id: 'toilet', label: 'Toilet', prompt: 'Add the toilet photo.' },
  { id: 'kitchen', label: 'Kitchen', prompt: 'Add the kitchen photo.' },
  { id: 'study', label: 'Study Area', prompt: 'Add the study area photo.' },
  { id: 'exterior', label: 'Building Exterior', prompt: 'Add the building exterior.' },
  { id: 'gate', label: 'Gate', prompt: 'Add the main gate.' },
  { id: 'compound', label: 'Compound', prompt: 'Add the compound photo.' },
  { id: 'water_source', label: 'Water Source', prompt: 'Add the water source.' },
  { id: 'water_tank', label: 'Water Tank', prompt: 'Add the water tank photo.' },
  { id: 'laundry', label: 'Laundry', prompt: 'Add the laundry area.' },
  { id: 'parking', label: 'Parking', prompt: 'Add the parking area.' },
  { id: 'road', label: 'Road', prompt: 'Add a photo showing the road/access.' },
  { id: 'main_road', label: 'Main Road', prompt: 'Add the main road photo.' },
  { id: 'transport_stage', label: 'Transport Stage', prompt: 'Add the transport stage photo.' },
  { id: 'shopping', label: 'Shopping Centre', prompt: 'Add the shopping centre photo.' },
  { id: 'common_area', label: 'Common Area', prompt: 'Add the common area photo.' },
  { id: 'security', label: 'Security', prompt: 'Add the security feature photo.' },
  { id: 'other', label: 'Other', prompt: 'Add another relevant photo.' },
];

// Which property types are "land-like" (skip utilities/rooms)
export const LAND_LIKE = new Set(['land']);

// Which property types are hostels/shared
export const HOSTEL_LIKE = new Set(['student_hostel', 'shared_house', 'single_room', 'compound']);

// Which property types are apartments/units
export const APARTMENT_LIKE = new Set(['apartment', 'studio_apartment', 'serviced_apartment']);

// Which are houses
export const HOUSE_LIKE = new Set([
  'maisonette', 'bungalow', 'townhouse', 'duplex',
  'standalone_house', 'semi_detached',
]);
