export function getProductRules(productKey, rules) {
  return rules.products[productKey] || rules.products.personal_loan;
}

export function getCreditBand(score, rules) {
  if (score === null || score === undefined) {
    return { label: 'Unknown', rateAdjustment: 0.9 };
  }

  const band = rules.creditBands.find((item) => score >= item.min && score <= item.max);
  return band || { label: 'Unknown', rateAdjustment: 1.0 };
}

export function getIncomeTypeMultiplier(profile, rules) {
  if (!profile.incomeType) return rules.incomeStability.stable;
  return rules.incomeStability[profile.incomeType === 'salaried' ? 'stable' : profile.incomeType === 'selfEmployed' ? 'moderate' : 'volatile'] || rules.incomeStability.stable;
}

export function determineFoir(profile, rules) {
  const base = rules.foir[profile.incomeType] || rules.foir.base;
  const multiplier = getIncomeTypeMultiplier(profile, rules);
  return base * multiplier;
}

export function getRiskFlags(profile, rules) {
  const flags = [];

  if (profile.recentEMIBounce) flags.push('recentEMIBounce');
  if (Number(profile.existingEMI || 0) > 0 && Number(profile.netIncome || 0) > 0 && (Number(profile.existingEMI) / Number(profile.netIncome)) > rules.decisionThresholds.highDebtRatio) {
    flags.push('highDebtRatio');
  }
  if (profile.incomeStability === 'volatile' || profile.monthsLowIncome > 3) {
    flags.push('incomeVolatility');
  }
  if (profile.creditScore === null) {
    flags.push('unknownCreditScore');
  }
  if ((profile.emergencySavingsMonths || 0) < 3) {
    flags.push('lowEmergencySavings');
  }
  if (profile.upcomingLargeExpenses) {
    flags.push('largeUpcomingExpense');
  }

  return flags;
}

export function calculateConfidence(profile, rules) {
  let score = rules.confidence.base;

  if (profile.creditScore === null) {
    score -= rules.confidence.noCreditScorePenalty;
  } else {
    score += 8;
  }

  if (profile.incomeType === 'informal' || profile.incomeStability === 'volatile') {
    score -= rules.confidence.highVolatilityPenalty;
  }

  if (profile.existingEMI > 0 || profile.existingLoanCount) {
    score += rules.confidence.knownDebtBonus;
  }

  if (profile.emergencySavingsMonths >= 3) {
    score += rules.confidence.stableIncomeBonus;
  }

  if (!profile.loanType || !profile.netIncome || !profile.desiredAmount || !profile.householdExpenses) {
    score -= rules.confidence.incompleteDataPenalty;
  }

  if (score >= 75) return { level: 'HIGH', reason: 'The profile is fairly complete and the key risk inputs are known.' };
  if (score >= 55) return { level: 'MEDIUM', reason: 'Some information is missing or variable, so the estimate is directionally useful but not precise.' };
  return { level: 'LOW', reason: 'Critical financial inputs are incomplete or unstable, so confidence is limited.' };
}

export function decideRecommendation(safeRange, requestedAmount, riskFlags, rules) {
  const requested = Number(requestedAmount || 0);
  const safeMax = Number(safeRange && safeRange.max ? safeRange.max : 0);

  if (riskFlags.includes('recentEMIBounce') && riskFlags.includes('highDebtRatio')) {
    return {
      recommendation: 'DON\'T BORROW',
      explanation: 'Recent EMI stress and already-high debt obligations indicate repayment pressure. A new loan would likely increase the risk of further distress.'
    };
  }

  if (safeMax <= 0 || (requested > 0 && safeMax < requested * rules.decisionThresholds.doNotBorrowStressRatio)) {
    return {
      recommendation: 'DON\'T BORROW',
      explanation: 'The borrower\'s current monthly cash flow and debt obligations do not support a safe new loan without creating repayment stress.'
    };
  }

  if (requested > safeMax * rules.decisionThresholds.borrowLessRatio) {
    return {
      recommendation: 'BORROW LESS',
      explanation: 'The requested amount sits above the comfort range, so a smaller loan is more consistent with the borrower\'s affordability capacity.'
    };
  }

  return {
    recommendation: 'BORROW',
    explanation: 'Borrowing appears reasonable because income, debt and household obligations remain within the affordability range for the requested loan.'
  };
}
