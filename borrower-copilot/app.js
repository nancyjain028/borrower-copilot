import { calculateAssessment, formatINR, buildNegotiationCard } from './js/calculator.js';

let rules = null;

const ui = {
  landingScreen: document.getElementById('landing-screen'),
  formScreen: document.getElementById('form-screen'),
  resultsScreen: document.getElementById('results-screen'),
  borrowerForm: document.getElementById('borrower-form'),
  startButton: document.getElementById('start-assessment'),
  backButton: document.getElementById('back-button'),
  printButton: document.getElementById('print-card'),
  creditScoreKnown: document.getElementById('creditScoreKnown'),
  creditScoreField: document.getElementById('creditScoreField'),
  adaptiveQuestions: document.getElementById('adaptive-questions'),
  questionCards: [...document.querySelectorAll('.adaptive-card')]
};

function showScreen(name) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach((screen) => {
    screen.classList.toggle('active', screen.id === name || screen.id === 'landing-screen' && name === 'landing');
    screen.classList.toggle('hidden', screen.id !== name && !(screen.id === 'landing-screen' && name === 'landing'));
  });

  if (name === 'landing') {
    ui.landingScreen.classList.remove('hidden');
    ui.formScreen.classList.add('hidden');
    ui.resultsScreen.classList.add('hidden');
  } else if (name === 'form') {
    ui.landingScreen.classList.add('hidden');
    ui.formScreen.classList.remove('hidden');
    ui.resultsScreen.classList.add('hidden');
  } else if (name === 'results') {
    ui.landingScreen.classList.add('hidden');
    ui.formScreen.classList.add('hidden');
    ui.resultsScreen.classList.remove('hidden');
  }
}

function toggleCreditScoreField() {
  const selected = ui.creditScoreKnown.value;
  ui.creditScoreField.classList.toggle('hidden', selected !== 'known');
  const scoreInput = document.getElementById('creditScore');
  if (selected !== 'known') {
    scoreInput.value = '';
  }
}

function conditionalQuestions() {
  const incomeType = document.getElementById('incomeType').value;
  const loanType = document.getElementById('loanType').value;
  const existingEMI = Number(document.getElementById('existingEMI').value || 0);
  const collateralAvailable = document.getElementById('collateralAvailable') ? document.getElementById('collateralAvailable').value : 'no';

  ui.questionCards.forEach((card) => {
    const depends = card.dataset.dependsOn || '';
    let shouldShow = false;

    if (depends === 'general:always') {
      shouldShow = true;
    } else if (depends.startsWith('incomeType:')) {
      const targetIncomeType = depends.split(':')[1];
      shouldShow = incomeType === targetIncomeType;
    } else if (depends === 'existingLoans:true') {
      shouldShow = existingEMI > 0 || Number(document.getElementById('activeLoanCount')?.value || 0) > 0;
    } else if (depends === 'collateralAvailable:yes') {
      shouldShow = collateralAvailable === 'yes';
    } else if (depends === 'productiveLoan:true') {
      shouldShow = document.getElementById('productiveLoan')?.value === 'yes' || loanType === 'business_loan';
    }

    card.classList.toggle('hidden', !shouldShow);
  });

  ui.adaptiveQuestions.classList.toggle('hidden', !shouldShowAnyQuestion());
}

function shouldShowAnyQuestion() {
  return ui.questionCards.some((card) => !card.classList.contains('hidden'));
}

function formatMoney(value) {
  return formatINR(value);
}

function renderTradeoff(tradeoffs) {
  const container = document.getElementById('tenure-tradeoff');
  if (!tradeoffs || !tradeoffs.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = tradeoffs
    .map(
      (item) => `
        <div class="tradeoff-item">
          <strong>${item.years.toFixed(0)} years</strong>
          <div>${formatMoney(item.emi)}/month</div>
          <small>${formatMoney(item.totalInterest)} interest</small>
        </div>
      `
    )
    .join('');
}

function renderResults(assessment) {
  const recommendation = document.getElementById('primary-recommendation');
  const explanation = document.getElementById('recommendation-explanation');
  const lenderRange = document.getElementById('lender-range');
  const safeRange = document.getElementById('safe-range');
  const fairRate = document.getElementById('fair-rate-range');
  const aprRange = document.getElementById('apr-range');
  const emi = document.getElementById('recommended-emi');
  const stressStatus = document.getElementById('stress-status');
  const stressCopy = document.getElementById('stress-copy');
  const emiWhy = document.getElementById('emi-why');
  const confidenceBadge = document.getElementById('confidence-badge');
  const keyReasons = document.getElementById('key-reasons');

  recommendation.textContent = assessment.recommendation;
  explanation.textContent = assessment.explanation;
  lenderRange.textContent = `${formatMoney(assessment.lenderSanction.min)} – ${formatMoney(assessment.lenderSanction.max)}`;
  document.getElementById('lender-note').textContent = 'Lender eligibility is generally higher than the safe level because it does not fully account for household costs and repayment stress.';
  safeRange.textContent = `${formatMoney(assessment.safeAmount.min)} – ${formatMoney(assessment.safeAmount.max)}`;
  document.getElementById('safe-note').textContent = `${assessment.safeAmountWhy} Use the safe amount as your borrowing target.`;
  fairRate.textContent = `${assessment.fairRate.min.toFixed(1)}% – ${assessment.fairRate.max.toFixed(1)}%`;
  document.getElementById('fair-rate-note').textContent = assessment.fairRate.explanation;
  aprRange.textContent = `${assessment.apr.min.toFixed(1)}% – ${assessment.apr.max.toFixed(1)}%`;
  document.getElementById('apr-note').textContent = assessment.apr.explanation;
  emi.textContent = formatMoney(assessment.recommendedMaxEMI);
  emiWhy.textContent = assessment.recommendedMaxEMIWhy;
  stressStatus.textContent = assessment.stressTest.status;
  stressCopy.textContent = assessment.stressTest.narrative;
  confidenceBadge.textContent = `Confidence: ${assessment.confidence.level}`;
  confidenceBadge.className = `confidence-badge ${assessment.confidence.level.toLowerCase()}`;
  keyReasons.innerHTML = assessment.keyReasons.map((item) => `<li>${item}</li>`).join('');
  renderTradeoff(assessment.tradeoffs);

  const negotiation = buildNegotiationCard(assessment);
  if (negotiation) {
    document.getElementById('card-loan-type').textContent = negotiation.loanType;
    document.getElementById('card-requested-amount').textContent = formatMoney(assessment.lenderSanction.max);
    document.getElementById('card-safe-range').textContent = `${formatMoney(negotiation.borrowerRange.min)} – ${formatMoney(negotiation.borrowerRange.max)}`;
    document.getElementById('card-sanction-range').textContent = `${formatMoney(negotiation.sanctionRange.min)} – ${formatMoney(negotiation.sanctionRange.max)}`;
    document.getElementById('card-rate-range').textContent = `${assessment.fairRate.min.toFixed(1)}% – ${assessment.fairRate.max.toFixed(1)}%`;
    document.getElementById('card-apr-range').textContent = `${assessment.apr.min.toFixed(1)}% – ${assessment.apr.max.toFixed(1)}%`;
    document.getElementById('card-emi').textContent = formatMoney(assessment.recommendedMaxEMI);
    document.getElementById('card-reasons').textContent = assessment.keyReasons.join(' | ');
    document.getElementById('card-negotiation-statement').textContent = negotiation.statement;
  }
}

function collectProfile() {
  const fd = new FormData(ui.borrowerForm);
  const knownCredit = ui.creditScoreKnown.value;

  const profile = {
    age: Number(fd.get('age') || 0),
    loanPurpose: fd.get('loanPurpose') || 'Other',
    loanType: fd.get('loanType') || 'personal_loan',
    desiredAmount: Number(fd.get('desiredAmount') || 0),
    netIncome: Number(fd.get('netIncome') || 0),
    incomeType: fd.get('incomeType') || 'salaried',
    existingEMI: Number(fd.get('existingEMI') || 0),
    householdExpenses: Number(fd.get('householdExpenses') || 0),
    creditScore: knownCredit === 'known' ? Number(fd.get('creditScore') || 0) : null,
    employmentTenure: Number(fd.get('employmentTenure') || 0),
    incomeStability: fd.get('incomeStability') || 'stable',
    variableIncomePercent: Number(fd.get('variableIncomePercent') || 0),
    businessVintage: Number(fd.get('businessVintage') || 0),
    itrIncome: Number(fd.get('itrIncome') || 0),
    businessIncomeStability: fd.get('businessIncomeStability') || 'stable',
    businessProfit: Number(fd.get('businessProfit') || 0),
    collateralAvailable: fd.get('collateralAvailable') === 'yes',
    coApplicantIncome: Number(fd.get('coApplicantIncome') || 0),
    incomeRangeLow: Number(fd.get('incomeRangeLow') || 0),
    incomeRangeHigh: Number(fd.get('incomeRangeHigh') || 0),
    informalIncomeStability: fd.get('informalIncomeStability') || 'stable',
    monthsLowIncome: Number(fd.get('monthsLowIncome') || 0),
    activeLoanCount: Number(fd.get('activeLoanCount') || 0),
    outstandingDebt: Number(fd.get('outstandingDebt') || 0),
    recentEMIBounce: fd.get('recentEMIBounce') === 'yes',
    existingDebtRate: Number(fd.get('existingDebtRate') || 0),
    collateralType: fd.get('collateralType') || 'property',
    collateralValue: Number(fd.get('collateralValue') || 0),
    encumbered: fd.get('encumbered') === 'yes',
    emergencySavingsMonths: Number(fd.get('emergencySavingsMonths') || fd.get('emergencySavings') || 0),
    upcomingLargeExpenses: fd.get('upcomingLargeExpenses') === 'yes',
    existingLenderOffers: fd.get('existingLenderOffers') === 'yes',
    expectedMonthlyIncome: Number(fd.get('expectedMonthlyIncome') || 0),
    productiveLoan: fd.get('productiveLoan') === 'yes',
    monthsLowIncome: Number(fd.get('monthsLowIncome') || 0),
    existingLoanCount: Number(fd.get('activeLoanCount') || 0),
    loanTypeMatch: fd.get('loanType') || 'personal_loan'
  };

  return profile;
}

async function loadRules() {
  const response = await fetch('./data/rules.json');
  rules = await response.json();
}

ui.startButton.addEventListener('click', () => {
  showScreen('form');
});

ui.backButton.addEventListener('click', () => {
  showScreen('landing');
});

ui.creditScoreKnown.addEventListener('change', toggleCreditScoreField);

document.getElementById('loanType').addEventListener('change', conditionalQuestions);
document.getElementById('incomeType').addEventListener('change', conditionalQuestions);
document.getElementById('existingEMI').addEventListener('input', conditionalQuestions);
document.getElementById('collateralAvailable').addEventListener('change', conditionalQuestions);
document.getElementById('productiveLoan').addEventListener('change', conditionalQuestions);

ui.borrowerForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const profile = collectProfile();
  const assessment = calculateAssessment(profile, rules);

  if (!assessment.valid) {
    alert(assessment.errors.join('\n'));
    return;
  }

  renderResults(assessment);
  showScreen('results');
});

ui.printButton.addEventListener('click', () => {
  window.print();
});

async function init() {
  await loadRules();
  toggleCreditScoreField();
  conditionalQuestions();
}

init();
