// src/constants/roles.js
// Single source of truth for user roles across the app.
// - value:       what the UI passes around ("buyer" | "seller" | "driver" | ...)
// - storedRole:  what we write to users/<uid>.role in Firestore
// - userType:    what we write to users/<uid>.userType in Firestore
// - label:       UI label
// - icon:        lucide-react icon name (rendered by the consumer)
// - desc:        short description shown in the ProfilePage switch modal

export const ROLES = {
  buyer: {
    value: "buyer",
    storedRole: "user",
    userType: "user",
    label: "Buyer/Tenant",
    icon: "home",
    desc: "Browse properties",
  },
  seller: {
    value: "seller",
    storedRole: "seller",
    userType: "seller",
    label: "Seller/Landlord",
    icon: "building",
    desc: "List properties",
  },
  agent: {
    value: "agent",
    storedRole: "agent",
    userType: "agent",
    label: "Real Estate Agent",
    icon: "briefcase",
    desc: "Professional tools",
  },
  investor: {
    value: "investor",
    storedRole: "investor",
    userType: "investor",
    label: "Investor",
    icon: "trending",
    desc: "Investment focus",
  },
  driver: {
    value: "driver",
    storedRole: "user", // stays a normal user until admin approves
    userType: "user",
    label: "Driver",
    icon: "truck",
    desc: "Accept moving jobs (requires approval)",
  },
  admin: {
    value: "admin",
    storedRole: "admin",
    userType: "admin",
    label: "Administrator",
    icon: "shield",
    desc: "Full access",
  },
};

// Signup options available on RegisterPage (no admin self-serve)
export const SIGNUP_ROLES = [
  ROLES.buyer,
  ROLES.seller,
  ROLES.agent,
  ROLES.investor,
  ROLES.driver,
];

// Roles a user may switch themselves to from ProfilePage.
// Admin is intentionally excluded — admin rights are granted by another admin.
// Driver is included but stays as a plain user until /api/driver/decision approves.
export const SWITCHABLE_ROLES = [
  ROLES.buyer,
  ROLES.seller,
  ROLES.agent,
  ROLES.investor,
  ROLES.driver,
];

export const getRoleLabel = (storedRoleOrValue) => {
  const match = Object.values(ROLES).find(
    (r) => r.storedRole === storedRoleOrValue || r.value === storedRoleOrValue
  );
  return match ? match.label : "User";
};
