export function validateBorrowerProfile(profile) {
  const errors = [];

  if (!profile || typeof profile !== 'object') {
    return { isValid: false, errors: ['Borrower details are missing.'] };
  }

  const age = Number(profile.age);
  const income = Number(profile.netIncome);
  const desiredAmount = Number(profile.desiredAmount);
  const existingEMI = Number(profile.existingEMI || 0);
  const householdExpenses = Number(profile.householdExpenses || 0);
  const score = profile.creditScore === null || profile.creditScore === undefined || profile.creditScore === 'UNKNOWN' ? null : Number(profile.creditScore);

  if (!Number.isFinite(age) || age < 18 || age > 75) {
    errors.push('Age should be between 18 and 75 years.');
  }

  if (!Number.isFinite(income) || income <= 0) {
    errors.push('Monthly net income must be a positive number.');
  }

  if (!Number.isFinite(desiredAmount) || desiredAmount <= 0) {
    errors.push('Requested loan amount must be greater than zero.');
  }

  if (existingEMI < 0) {
    errors.push('Existing EMI cannot be negative.');
  }

  if (householdExpenses < 0) {
    errors.push('Monthly household expenses cannot be negative.');
  }

  if (profile.loanType && !['personal_loan', 'home_loan', 'lap', 'gold_loan', 'two_wheeler_loan', 'business_loan'].includes(profile.loanType)) {
    errors.push('Please select a valid loan type.');
  }

  if (profile.incomeType && !['salaried', 'selfEmployed', 'informal'].includes(profile.incomeType)) {
    errors.push('Please select a valid income type.');
  }

  if (score !== null && (!Number.isFinite(score) || score < 300 || score > 900)) {
    errors.push('Credit score, if known, should be between 300 and 900.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function normaliseProfile(profile) {
  if (!profile) return {};

  const rawCreditScore = profile.creditScore;
  const scoreValue = rawCreditScore === null || rawCreditScore === undefined || rawCreditScore === 'UNKNOWN' || rawCreditScore === 'I don\'t know my credit score' || rawCreditScore === 'unknown' || rawCreditScore === ''
    ? null
    : Number(rawCreditScore);

  return {
    ...profile,
    age: Number(profile.age || 0),
    netIncome: Number(profile.netIncome || 0),
    desiredAmount: Number(profile.desiredAmount || 0),
    existingEMI: Number(profile.existingEMI || 0),
    householdExpenses: Number(profile.householdExpenses || 0),
    coApplicantIncome: Number(profile.coApplicantIncome || 0),
    emergencySavingsMonths: Number(profile.emergencySavingsMonths || 0),
    collateralValue: Number(profile.collateralValue || 0),
    businessProfit: Number(profile.businessProfit || 0),
    expectedMonthlyIncome: Number(profile.expectedMonthlyIncome || 0),
    creditScore: scoreValue === null || Number.isNaN(scoreValue) ? null : scoreValue,
    incomeType: profile.incomeType || 'salaried',
    loanType: profile.loanType || 'personal_loan'
  };
}
