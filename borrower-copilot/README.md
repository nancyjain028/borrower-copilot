# Borrower Copilot

Borrower Copilot is a browser-based self-assessment tool for an Indian borrower. It helps the user estimate whether they should borrow, how much a lender may approve, how much is safe to borrow, and what interest rate and EMI range is fair to negotiate.

## Product objective

The tool is intentionally transparent and rule-based. It does not use any bureau data, machine learning, APIs, or backend logic. It is designed to help a borrower understand their affordability and risk before visiting a lender.

## Technology stack

- HTML5
- CSS3
- Vanilla JavaScript
- JSON
- Browser-only execution

## Folder structure

```text
borrower-copilot/
├── index.html
├── styles.css
├── app.js
├── package.json
├── RULES.md
├── README.md
├── data/
│   └── rules.json
├── js/
│   ├── calculator.js
│   ├── emi.js
│   ├── ruleEngine.js
│   └── validation.js
├── tests/
│   └── test-cases.js
└── .
```

## How to run locally

From the project folder, run:

```bash
cd borrower-copilot
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

If Python is not available, any static file server will work. A simple local server is required because the browser fetches rules.json and JavaScript modules.

## How the rules engine works

The app loads assumptions from data/rules.json and uses them in the calculation flow instead of embedding thresholds directly in the UI. The flow is:

1. User answers a short form.
2. The form is validated.
3. The profile is normalised.
4. Rules are loaded from rules.json.
5. The rule engine calculates affordability, lender range, rate band, and confidence.
6. Results are rendered in the UI.

This means changing a threshold in rules.json changes the calculation automatically without a code change in the HTML or UI logic.

## How calculations work

### Affordability and FOIR

The system estimates a maximum EMI capacity using a FOIR-like affordability model:

- Monthly income forms the base.
- Applicable FOIR is chosen from the borrower income type.
- Existing EMI is subtracted.
- Household expenses and minimum monthly surplus are checked.
- Stress assumptions such as a 20% income fall are applied.

### Loan amount and lender range

The lender range is a practical rule-of-thumb based on income, debt burden, and loan type. It is intentionally different from the safe amount because lender eligibility and borrower affordability are not same.

### Fair rate range

The app returns a rate band rather than an exact rate. It widens the range when credit is unknown or debt stress is elevated, and narrows it when the profile is stronger and more complete.

### APR and all-in cost

The system calculates an estimated effective annual cost using a basic EMI model plus the assumed processing fee. This is not an official APR calculation under regulation, but a transparent estimate based on assumptions.

### EMI ceiling

The EMI is calculated using the standard reducing-balance formula implemented in js/emi.js. The tool shows the recommended maximum EMI and a small range of tenure trade-offs.

## How to modify rules

Edit values in data/rules.json. Example changes include:

- FOIR thresholds
- credit-score bands
- product-specific rate assumptions
- stress test factors
- confidence settings

Because the UI pulls values dynamically, no HTML edits are required.

## How to test Priya / Ravi / Anita

Run:

```bash
cd borrower-copilot
node tests/test-cases.js
```

This prints the outputs for the three required scenarios plus a few stress and rule-variation examples.

## Known limitations

- This is not a lender approval (and does not pretend to be).
- It does not access credit bureau data.
- It does not store personal information.
- APR and rate estimates are assumptions, not actual lender pricing.
- It is designed for a self-assessment walkthrough rather than production underwriting.

## Assumptions

The product makes reasonable India-focused assumptions with a conservative bias. Where official references were not available, the values are labelled as my judgement in RULES.md.

## What would be built next in a production version

- lender-specific pricing feeds
- document collection checks
- better segmentation for secured vs unsecured products
- richer explanation and PDF export improvements
- more robust borrower journey and onboarding flows

## Five-minute walkthrough

1. Explain that the tool is a decision-support estimate, not a lender approval.
2. Run Priya and show the recommendation, lender range, safe range, fair rate and EMI.
3. Show the Negotiation Card and the print button.
4. Run Ravi and explain why a secured product such as LAP may be more appropriate.
5. Run Anita and explain how high-cost debt, recent EMI bounce and income volatility push the recommendation lower.
6. Change a value in rules.json such as a FOIR threshold and re-run the assessment to show the output shift.
7. Explain the rule data file, limitations and future improvements.

## Important disclaimer

This tool is for borrower education and negotiation support only. It is not a lender sanction, bureau check or automated credit decision.
