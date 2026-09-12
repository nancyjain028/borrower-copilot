import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateAssessment } from '../js/calculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rules = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'rules.json'), 'utf-8'));

const cases = {
  Priya: {
    age: 29,
    loanPurpose: 'Wedding',
    loanType: 'personal_loan',
    desiredAmount: 800000,
    netIncome: 110000,
    incomeType: 'salaried',
    existingEMI: 14000,
    householdExpenses: 28000,
    creditScore: 780,
    employmentTenure: 5,
    incomeStability: 'stable',
    recentEMIBounce: false,
    emergencySavingsMonths: 6,
    productiveLoan: false,
    activeLoanCount: 1,
    outstandingDebt: 0,
    collateralAvailable: false,
    coApplicantIncome: 0,
    upcomingLargeExpenses: false
  },
  Ravi: {
    age: 42,
    loanPurpose: 'Business expansion',
    loanType: 'lap',
    desiredAmount: 1500000,
    netIncome: 60000,
    incomeType: 'selfEmployed',
    existingEMI: 0,
    householdExpenses: 25000,
    creditScore: null,
    businessVintage: 14,
    itrIncome: 420000,
    businessIncomeStability: 'stable',
    businessProfit: 150000,
    collateralAvailable: true,
    collateralType: 'property',
    collateralValue: 4500000,
    encumbered: false,
    coApplicantIncome: 18000,
    emergencySavingsMonths: 4,
    productiveLoan: true,
    recentEMIBounce: false,
    incomeStability: 'moderate'
  },
  Anita: {
    age: 35,
    loanPurpose: 'Vehicle purchase',
    loanType: 'two_wheeler_loan',
    desiredAmount: 150000,
    netIncome: 28000,
    incomeType: 'informal',
    existingEMI: 35000,
    householdExpenses: 22000,
    creditScore: null,
    incomeRangeLow: 26000,
    incomeRangeHigh: 30000,
    monthsLowIncome: 6,
    informalIncomeStability: 'volatile',
    recentEMIBounce: true,
    emergencySavingsMonths: 1,
    productiveLoan: true,
    expectedMonthlyIncome: 18000,
    activeLoanCount: 3,
    outstandingDebt: 35000,
    collateralAvailable: false,
    coApplicantIncome: 0,
    upcomingLargeExpenses: false
  },
  UnknownCreditScore: {
    age: 31,
    loanPurpose: 'Medical emergency',
    loanType: 'personal_loan',
    desiredAmount: 450000,
    netIncome: 75000,
    incomeType: 'salaried',
    existingEMI: 8000,
    householdExpenses: 24000,
    creditScore: null,
    employmentTenure: 2,
    incomeStability: 'moderate',
    emergencySavingsMonths: 5,
    recentEMIBounce: false,
    productiveLoan: false
  },
  HighExistingEMI: {
    age: 33,
    loanPurpose: 'Debt consolidation',
    loanType: 'personal_loan',
    desiredAmount: 350000,
    netIncome: 55000,
    incomeType: 'salaried',
    existingEMI: 28000,
    householdExpenses: 22000,
    creditScore: 680,
    employmentTenure: 4,
    incomeStability: 'stable',
    emergencySavingsMonths: 3,
    recentEMIBounce: false,
    activeLoanCount: 2
  },
  HighCostDebt: {
    age: 27,
    loanPurpose: 'Wedding',
    loanType: 'personal_loan',
    desiredAmount: 500000,
    netIncome: 60000,
    incomeType: 'salaried',
    existingEMI: 18000,
    householdExpenses: 20000,
    creditScore: 710,
    employmentTenure: 2,
    incomeStability: 'moderate',
    emergencySavingsMonths: 2,
    activeLoanCount: 2,
    outstandingDebt: 150000,
    existingDebtRate: 32,
    recentEMIBounce: false
  },
  IncomeStress: {
    age: 30,
    loanPurpose: 'Home improvement',
    loanType: 'personal_loan',
    desiredAmount: 600000,
    netIncome: 70000,
    incomeType: 'salaried',
    existingEMI: 11000,
    householdExpenses: 26000,
    creditScore: 730,
    employmentTenure: 3,
    incomeStability: 'volatile',
    emergencySavingsMonths: 2,
    recentEMIBounce: false,
    monthsLowIncome: 4
  },
  RateRise: {
    age: 40,
    loanPurpose: 'Vehicle purchase',
    loanType: 'two_wheeler_loan',
    desiredAmount: 250000,
    netIncome: 95000,
    incomeType: 'salaried',
    existingEMI: 15000,
    householdExpenses: 30000,
    creditScore: 640,
    employmentTenure: 5,
    incomeStability: 'stable',
    emergencySavingsMonths: 4,
    recentEMIBounce: false
  }
};

function printCase(name, profile) {
  const result = calculateAssessment(profile, rules);
  console.log(`\n=== ${name} ===`);
  if (!result.valid) {
    console.log('VALIDATION ERRORS:', result.errors.join(' | '));
    return;
  }

  console.log('Recommendation:', result.recommendation);
  console.log('Lender range:', formatINR(result.lenderSanction.min), '-', formatINR(result.lenderSanction.max));
  console.log('Safe range:', formatINR(result.safeAmount.min), '-', formatINR(result.safeAmount.max));
  console.log('Fair rate:', result.fairRate.min.toFixed(1) + '% - ' + result.fairRate.max.toFixed(1) + '%');
  console.log('APR:', result.apr.min.toFixed(1) + '% - ' + result.apr.max.toFixed(1) + '%');
  console.log('Recommended EMI:', formatINR(result.recommendedMaxEMI));
  console.log('Confidence:', result.confidence.level, '-', result.confidence.reason);
}

function formatINR(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

Object.entries(cases).forEach(([name, profile]) => printCase(name, profile));
