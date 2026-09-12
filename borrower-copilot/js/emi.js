export function calculateEMI(principal, annualRatePercent, months) {
  if (!Number.isFinite(principal) || principal <= 0) return 0;
  if (!Number.isFinite(months) || months <= 0) return 0;

  const monthlyRate = annualRatePercent / 12 / 100;

  if (monthlyRate === 0) {
    return principal / months;
  }

  const rateFactor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * rateFactor) / (rateFactor - 1);
}

export function calculateTotalRepayment(principal, annualRatePercent, months) {
  const emi = calculateEMI(principal, annualRatePercent, months);
  return emi * months;
}

export function calculateTotalInterest(principal, annualRatePercent, months) {
  return calculateTotalRepayment(principal, annualRatePercent, months) - principal;
}

export function calculateLoanAmountForEMI(emi, annualRatePercent, months) {
  if (!Number.isFinite(emi) || emi <= 0) return 0;
  if (!Number.isFinite(months) || months <= 0) return 0;

  const monthlyRate = annualRatePercent / 12 / 100;

  if (monthlyRate === 0) {
    return emi * months;
  }

  const discountFactor = 1 - Math.pow(1 + monthlyRate, -months);
  return emi * (discountFactor / monthlyRate);
}

export function buildTenureTradeoff(loanAmount, annualRatePercent) {
  const terms = [36, 60, 84];

  return terms.map((months) => {
    const emi = calculateEMI(loanAmount, annualRatePercent, months);
    const totalRepayment = calculateTotalRepayment(loanAmount, annualRatePercent, months);
    const totalInterest = totalRepayment - loanAmount;

    return {
      months,
      years: months / 12,
      emi,
      totalRepayment,
      totalInterest
    };
  });
}
