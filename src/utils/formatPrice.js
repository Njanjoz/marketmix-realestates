// src/utils/formatPrice.js
export const formatPrice = (price) => {
  if (price >= 10000000) {
    return `KES ${(price / 1000000).toFixed(1)}M`;
  } else if (price >= 100000) {
    return `KES ${(price / 1000).toFixed(0)}K`;
  } else {
    return `KES ${price.toLocaleString()}`;
  }
};

export const formatPriceDetailed = (price) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// src/utils/propertyUtils.js
export const calculateMonthlyPayment = (price, downPaymentPercent = 20, interestRate = 12, years = 20) => {
  const principal = price * (1 - downPaymentPercent / 100);
  const monthlyInterestRate = interestRate / 100 / 12;
  const numberOfPayments = years * 12;

  if (monthlyInterestRate === 0) {
    return principal / numberOfPayments;
  }

  const x = Math.pow(1 + monthlyInterestRate, numberOfPayments);
  return (principal * x * monthlyInterestRate) / (x - 1);
};

export const getPropertyTypeIcon = (type) => {
  const icons = {
    apartment: '🏢',
    house: '🏠',
    villa: '🏡',
    commercial: '🏬',
    land: '🌳',
    shop: '🏪',
    office: '💼',
    warehouse: '🏭'
  };
  return icons[type] || '🏠';
};