import { calculateEMI, calculateLoanAmountForEMI, calculateTotalRepayment, calculateTotalInterest, buildTenureTradeoff } from './emi.js';
import { determineFoir, getCreditBand, getProductRules, getRiskFlags, decideRecommendation, calculateConfidence } from './ruleEngine.js';
import { normaliseProfile, validateBorrowerProfile } from './validation.js';

export function formatINR(value) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(safeValue);
}

export function formatINRCompact(value) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const absValue = Math.abs(safeValue);

  if (absValue >= 10000000) {
    return `₹${(safeValue / 100000).toFixed(1)}L`;
  }

  if (absValue >= 100000) {
    return `₹${(safeValue / 100000).toFixed(2)}L`;
  }

  return `₹${Math.round(safeValue).toLocaleString('en-IN')}`;
}

export function calculateAssessment(profile, rules) {
  const normalised = normaliseProfile(profile);
  const validation = validateBorrowerProfile(normalised);

  if (!validation.isValid) {
    return {
      valid: false,
      errors: validation.errors,
      recommendation: null
    };
  }

  const product = getProductRules(normalised.loanType, rules);
  const creditBand = getCreditBand(normalised.creditScore, rules);
  const incomeType = normalised.incomeType || 'salaried';
  const annualIncome = normalised.netIncome + (normalised.coApplicantIncome || 0);
  const foir = determineFoir(normalised, rules);
  const maxTotalEMICapacity = annualIncome * foir;
  const existingEMI = Number(normalised.existingEMI || 0);
  const averageLivingCost = Number(normalised.householdExpenses || 0);
  const minimumResidual = Math.max(annualIncome * rules.bankingAssumptions.minimumSurplusRatio, 15000);

  let maxNewEMI = Math.max(0, maxTotalEMICapacity - existingEMI);
  const householdCheck = annualIncome - averageLivingCost - existingEMI;
  const affordabilityEMI = Math.max(0, householdCheck * 0.6);
  maxNewEMI = Math.min(maxNewEMI, affordabilityEMI, annualIncome * 0.4);

  if (normalised.emergencySavingsMonths < rules.bankingAssumptions.minimumEmergencyMonths) {
    maxNewEMI *= 0.85;
  }

  if (normalised.recentEMIBounce) {
    maxNewEMI *= rules.riskAdjustments.recentEMIBounce;
  }

  if (normalised.incomeStability === 'volatile' || normalised.monthsLowIncome > 3) {
    maxNewEMI *= rules.riskAdjustments.incomeVolatility;
  }

  if ((normalised.existingLoanCount || 0) > 1 || (normalised.outstandingDebt || 0) > 50000) {
    maxNewEMI *= rules.riskAdjustments.highCostDebt;
  }

  if (normalised.collateralAvailable && normalised.collateralValue) {
    maxNewEMI *= 1 + rules.riskAdjustments.collateralBoost;
  }

  if (normalised.expectedMonthlyIncome && normalised.loanType === 'business_loan') {
    maxNewEMI *= 1 + rules.riskAdjustments.businessProfitBoost;
  }

  if (normalised.creditScore === null) {
    maxNewEMI *= rules.riskAdjustments.unknownCreditScore;
  }

  const recommendedMaxEMI = Math.max(0, maxNewEMI);
  const safeRate = Math.max(product.interestRateBand.min, Math.min(product.interestRateBand.max, product.interestRateBand.min + (product.interestRateBand.max - product.interestRateBand.min) * 0.5 + creditBand.rateAdjustment));
  // Keep a fair range with honest widening when risk is higher or the credit score is unknown.
  const baseMin = product.interestRateBand.min + (normalised.creditScore === null ? 1.5 : 0);
  const baseMax = product.interestRateBand.max + (normalised.creditScore === null ? 2.8 : 0.8);
  const riskAdd = normalised.recentEMIBounce ? 1.5 : 0;
  const incomeAdd = normalised.incomeStability === 'volatile' ? 1.0 : 0;
  const debtAdd = existingEMI > 0 ? 0.8 : 0;
  const fairMin = Math.max(baseMin + riskAdd + incomeAdd + debtAdd - 0.5, product.interestRateBand.min);
  const fairMax = Math.max(baseMax + riskAdd + incomeAdd + debtAdd + 1.2, fairMin + 0.9);
  const aprMin = fairMin + product.processingFeePct / 12;
  const aprMax = fairMax + product.processingFeePct / 12;

  const safeLoan = calculateLoanAmountForEMI(recommendedMaxEMI, safeRate, product.defaultTenureMonths);
  const safeRange = {
    min: Math.max(0, safeLoan * 0.75),
    max: Math.max(0, safeLoan)
  };

  const lenderBase = Math.min(
    Number(normalised.desiredAmount || 0),
    (annualIncome * (incomeType === 'salaried' ? 42 : incomeType === 'selfEmployed' ? 34 : 28)) * product.sanctionMultiplier
  );
  const sanctionSpread = Math.max(0.7, 1 - (Math.max(0, existingEMI) / Math.max(1, annualIncome * 0.5)) * 0.4);
  const lenderRange = {
    min: Math.min(Number(normalised.desiredAmount || 0), Math.max(0, lenderBase * 0.72 * sanctionSpread)),
    max: Math.min(Number(normalised.desiredAmount || 0), Math.max(0, lenderBase * 1.08 * sanctionSpread))
  };

  if (normalised.desiredAmount > lenderRange.max) {
    lenderRange.min = Math.min(lenderRange.min, lenderRange.max);
  }

  const riskFlags = getRiskFlags(normalised, rules);
  const recommendationDecision = decideRecommendation(safeRange, normalised.desiredAmount, riskFlags, rules);

  const confidence = calculateConfidence(normalised, rules);

  const stressIncome = annualIncome * (1 - rules.bankingAssumptions.stressIncomeDrop);
  const stressedMaxEMI = Math.max(0, stressIncome * foir - existingEMI);
  const stressedDebtBurden = existingEMI + recommendedMaxEMI;
  const stressedBurdenUnderIncomeDrop = existingEMI + Math.max(0, Math.min(recommendedMaxEMI, stressedMaxEMI));
  const stressWarning = stressedBurdenUnderIncomeDrop > annualIncome * 0.45 ? 'At risk' : 'Within tolerance';

  const tradeoffs = buildTenureTradeoff(Math.min(normalised.desiredAmount, safeRange.max || normalised.desiredAmount), safeRate);

  return {
    valid: true,
    recommendation: recommendationDecision.recommendation,
    explanation: recommendationDecision.explanation,
    lenderSanction: {
      min: Math.max(0, lenderRange.min),
      max: Math.max(0, lenderRange.max),
      label: 'Likely lender sanction'
    },
    safeAmount: {
      min: Math.max(0, safeRange.min),
      max: Math.max(0, safeRange.max),
      label: 'Safe amount'
    },
    fairRate: {
      min: fairMin,
      max: fairMax,
      explanation: `This range reflects the ${product.label.toLowerCase()} assumptions, credit profile and debt burden. Unknown scores widen the range because the risk is not fully observable.`
    },
    apr: {
      min: aprMin,
      max: aprMax,
      explanation: 'Estimated effective annual cost including the assumed processing fee.'
    },
    processingFee: product.processingFeePct,
    recommendedMaxEMI: Math.max(0, recommendedMaxEMI),
    recommendedMaxEMIWhy: `Based on a monthly income of ${formatINR(annualIncome)}, existing EMI of ${formatINR(existingEMI)}, and a FOIR-style affordability threshold of ${((foir * 100)).toFixed(1)}%, the recommended additional EMI is ${formatINR(Math.max(0, recommendedMaxEMI))}.`,
    safeAmountWhy: 'The safe amount is lower than the lender sanction because lender eligibility is not the same as affordable monthly cash flow after living costs and existing obligations.',
    stressTest: {
      incomeDrop: rules.bankingAssumptions.stressIncomeDrop * 100,
      currentDebtBurden: existingEMI + recommendedMaxEMI,
      stressedDebtBurden: stressedBurdenUnderIncomeDrop,
      status: stressWarning,
      narrative: `Under a ${rules.bankingAssumptions.stressIncomeDrop * 100}% income reduction, the debt burden would move from ${formatINR(existingEMI + recommendedMaxEMI)} to ${formatINR(stressedBurdenUnderIncomeDrop)}. ${stressWarning === 'At risk' ? 'This exceeds the recommended affordability band and suggests caution.' : 'The borrower remains within the affordability threshold under stress.'}`
    },
    confidence: confidence,
    riskFlags,
    product,
    tradeoffs,
    keyReasons: [
      `Income type: ${incomeType}`,
      `Credit score: ${normalised.creditScore === null ? 'Unknown' : normalised.creditScore}`,
      `Existing EMI: ${formatINR(existingEMI)}`,
      `Household expenses: ${formatINR(averageLivingCost)}`
    ],
    productReason: `The selected ${product.label} product is being assessed using a ${product.secured ? 'secured' : 'unsecured'} risk lens with a ${product.defaultTenureMonths}-month tenure assumption.`
  };
}

export function buildNegotiationCard(assessment) {
  if (!assessment || !assessment.valid) return null;

  const negotiation = {
    loanType: assessment.product.label,
    requestedAmount: assessment.product.label === 'Loan Against Property' && assessment.safeAmount.max > 0 ? Math.min(assessment.safeAmount.max * 1.2, assessment.lenderSanction.max) : assessment.lenderSanction.max,
    borrowerRange: assessment.safeAmount,
    sanctionRange: assessment.lenderSanction,
    fairRate: assessment.fairRate,
    apr: assessment.apr,
    recommendedEMI: assessment.recommendedMaxEMI,
    reasons: assessment.keyReasons,
    statement: `Your fair rate estimate is ${assessment.fairRate.min.toFixed(1)}%–${assessment.fairRate.max.toFixed(1)}%. If a lender quotes above this range, ask what risk or pricing factor justifies the additional spread.`
  };

  return negotiation;
}
