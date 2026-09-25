// src/components/MortgageCalculator.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaCalculator, FaHome, FaPercentage, FaCalendarAlt } from 'react-icons/fa';

// --- COLOR CONSTANTS ---
const PRIMARY_COLOR = '#0f4882'; 
const BLUE_ACCENT = '#3b82f6';
const GREEN_ACCENT = '#10b981';
const RED_ACCENT = '#ef4444';
const PURPLE_ACCENT = '#a855f7';

// --- STYLED COMPONENTS ---

const CalculatorContainer = styled(motion.div)`
  background-color: white;
  padding: 1.5rem;
  border-radius: 1rem; /* rounded-2xl */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-xl */
  border: 1px solid #f3f4f6; /* border border-gray-100 */
`;

const Title = styled.h2`
  font-size: 1.5rem; /* text-2xl */
  font-weight: bold;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  color: #374151; /* text-gray-800 */

  svg {
    width: 1.5rem;
    height: 1.5rem;
    margin-right: 0.75rem;
    color: ${PRIMARY_COLOR}; /* text-primary-600 */
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* space-y-6 */
`;

const InputCard = styled.div`
  padding: 1rem;
  border-radius: 0.5rem; /* rounded-lg */
  
  /* Dynamic styling based on props, defaulting to gray if no color is passed */
  &.blue {
    border: 1px solid #dbeafe; /* border-blue-100 */
    background-color: #eff6ff; /* bg-blue-50 */
    svg { color: ${BLUE_ACCENT}; }
    input[type="range"] { accent-color: ${BLUE_ACCENT}; background-color: #bfdbfe; } /* bg-blue-200 */
  }
  &.green {
    border: 1px solid #d1fae5; /* border-green-100 */
    background-color: #ecfdf5; /* bg-green-50 */
    svg { color: ${GREEN_ACCENT}; }
    input[type="range"] { accent-color: ${GREEN_ACCENT}; background-color: #a7f3d0; } /* bg-green-200 */
  }
  &.red {
    border: 1px solid #fee2e2; /* border-red-100 */
    background-color: #fef2f2; /* bg-red-50 */
    svg { color: ${RED_ACCENT}; }
    input[type="range"] { accent-color: ${RED_ACCENT}; background-color: #fecaca; } /* bg-red-200 */
  }
  &.purple {
    border: 1px solid #ede9fe; /* border-purple-100 */
    background-color: #f5f3ff; /* bg-purple-50 */
    svg { color: ${PURPLE_ACCENT}; }
    input[type="range"] { accent-color: ${PURPLE_ACCENT}; background-color: #d8b4fe; } /* bg-purple-200 */
  }
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem; /* text-sm */
  font-weight: 500;
  color: #374151; /* text-gray-700 */
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
`;

const RangeInput = styled.input.attrs({ type: 'range' })`
  width: 100%;
  height: 0.5rem;
  border-radius: 0.5rem;
  appearance: none;
  cursor: pointer;
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); /* focus:ring-2 and a custom color */
  }
`;

const RangeMinMax = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem; /* text-xs */
  color: #6b7280; /* text-gray-500 */
  margin-top: 0.25rem;
`;

const ResultsContainer = styled(motion.div)`
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb; /* border-t border-gray-200 */
`;

const ResultsTitle = styled.h3`
  font-size: 1.25rem; /* text-xl */
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;
  color: ${PRIMARY_COLOR}; /* text-primary-600 */
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)); /* grid-cols-3 */
  gap: 1rem; /* gap-4 */
  background-color: #eff6ff; /* bg-primary-50 (assuming this is a light blue) */
  padding: 1rem;
  border-radius: 0.75rem; /* rounded-xl */
  border: 1px solid #dbeafe; /* border border-primary-100 */
`;

const ResultItem = styled.div`
  text-align: center;
`;

const ResultLabel = styled.div`
  font-size: 0.875rem; /* text-sm */
  color: #6b7280; /* text-gray-500 */
`;

const MonthlyPaymentValue = styled.div`
  font-size: 1.875rem; /* text-3xl */
  font-weight: bold;
  color: ${PRIMARY_COLOR}; /* text-primary-600 */
`;

const PaymentValue = styled.div`
  font-size: 1.5rem; /* text-2xl */
  font-weight: bold;
`;

const InterestValue = styled(PaymentValue)`
  color: ${RED_ACCENT}; /* text-red-600 */
`;

const LoanDetailsGrid = styled.div`
  margin-top: 1.5rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
`;

const LoanDetailLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const LoanDetailValue = styled.div`
  font-weight: 600;
`;

const Disclaimer = styled.p`
  font-size: 0.75rem; /* text-xs */
  color: #6b7280; /* text-gray-500 */
  margin-top: 1rem;
`;


const MortgageCalculator = () => {
  const [price, setPrice] = useState(5000000);
  const [downPayment, setDownPayment] = useState(20);
  const [interestRate, setInterestRate] = useState(12);
  const [loanTerm, setLoanTerm] = useState(20);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);

  useEffect(() => {
    calculateMortgage();
  }, [price, downPayment, interestRate, loanTerm]);

  const calculateMortgage = () => {
    const principal = price * (1 - downPayment / 100);
    const monthlyInterestRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    if (monthlyInterestRate === 0) {
      const payment = principal / numberOfPayments;
      setMonthlyPayment(payment);
      setTotalPayment(payment * numberOfPayments);
      setTotalInterest(0);
      return;
    }

    const x = Math.pow(1 + monthlyInterestRate, numberOfPayments);
    const monthly = (principal * monthlyInterestRate * x) / (x - 1);
    const total = monthly * numberOfPayments;
    const interest = total - principal;

    setMonthlyPayment(monthly);
    setTotalPayment(total);
    setTotalInterest(interest);
  };

  const formatKES = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <CalculatorContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Title>
        <FaCalculator />
        Mortgage Calculator
      </Title>

      <InputGroup>
        <InputCard className="blue">
          <Label>
            <FaHome className="w-4 h-4 mr-2" />
            Property Price (KES) - {formatKES(price)}
          </Label>
          <RangeInput
            min="1000000"
            max="50000000"
            step="100000"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
          <RangeMinMax>
            <span>1M</span>
            <span>50M+</span>
          </RangeMinMax>
        </InputCard>

        <InputCard className="green">
          <Label>
            <FaPercentage className="w-4 h-4 mr-2" />
            Down Payment Percentage - {downPayment}%
          </Label>
          <RangeInput
            min="5"
            max="50"
            step="1"
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
          />
          <div className="text-xs text-gray-500 mt-1">
            Amount: {formatKES(price * downPayment / 100)}
          </div>
        </InputCard>

        <InputCard className="red">
          <Label>
            <FaPercentage className="w-4 h-4 mr-2" />
            Annual Interest Rate - {interestRate}%
          </Label>
          <RangeInput
            min="1"
            max="25"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
          />
        </InputCard>

        <InputCard className="purple">
          <Label>
            <FaCalendarAlt className="w-4 h-4 mr-2" />
            Loan Term - {loanTerm} years
          </Label>
          <RangeInput
            min="1"
            max="30"
            step="1"
            value={loanTerm}
            onChange={(e) => setLoanTerm(Number(e.target.value))}
          />
          <div className="text-xs text-gray-500 mt-1">
            {loanTerm * 12} total payments
          </div>
        </InputCard>
      </InputGroup>

      <ResultsContainer
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
      >
        <ResultsTitle>Your Estimated Payment</ResultsTitle>
        <ResultsGrid>
          <ResultItem>
            <ResultLabel>Monthly Payment</ResultLabel>
            <MonthlyPaymentValue>{formatKES(monthlyPayment)}</MonthlyPaymentValue>
          </ResultItem>
          <ResultItem>
            <ResultLabel>Total Payment</ResultLabel>
            <PaymentValue>{formatKES(totalPayment)}</PaymentValue>
          </ResultItem>
          <ResultItem>
            <ResultLabel>Total Interest</ResultLabel>
            <InterestValue>{formatKES(totalInterest)}</InterestValue>
          </ResultItem>
        </ResultsGrid>

        <LoanDetailsGrid>
          <div>
            <LoanDetailLabel>Loan Amount</LoanDetailLabel>
            <LoanDetailValue>{formatKES(price * (1 - downPayment / 100))}</LoanDetailValue>
          </div>
          <div>
            <LoanDetailLabel>Down Payment Amount</LoanDetailLabel>
            <LoanDetailValue>{formatKES(price * downPayment / 100)}</LoanDetailValue>
          </div>
        </LoanDetailsGrid>
      </ResultsContainer>

      <Disclaimer>
        *This calculator provides estimates only. Actual mortgage payments may vary based on additional fees, taxes...
      </Disclaimer>
    </CalculatorContainer>
  );
};

export default MortgageCalculator;