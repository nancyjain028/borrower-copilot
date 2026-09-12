# Borrower Copilot Rules Reference

This document explains the rule assumptions used by the Borrower Copilot assessment. Where a value is not directly sourced from the assignment, it is marked as "my judgement".

| Rule | Value | Why | Source |
|---|---:|---|---|
| FOIR threshold for salaried | 48% | Standard guidance for a conservative affordability ceiling for salaried borrowers in India. | my judgement |
| FOIR threshold for self-employed | 42% | Slightly lower than salaried because income is less predictable. | my judgement |
| FOIR threshold for informal / variable income | 35% | More conservative because income volatility is higher. | my judgement |
| Minimum monthly surplus ratio | 15% | Keeps a cushion after living costs and debt obligations. | my judgement |
| Emergency savings floor | 3 months | Rough minimum cash buffer before adding new EMI stress. | my judgement |
| Income stress scenario | 20% drop | Common conservative scenario used for affordability stress testing. | Assignment requirement |
| Interest rate increase stress scenario | +2 percentage points | Explicitly requested in the challenge description. | Assignment requirement |
| Credit score Unknown handling | Do not replace with zero; represent as null/unknown | Explicit requirement from the assignment. | Assignment requirement |
| Credit score band: Excellent | 750–900 | High-quality credit bucket used to tighten rate range. | my judgement |
| Credit score band: Good | 700–749 | Solid profile, normal pricing zone. | my judgement |
| Credit score band: Fair | 650–699 | Moderate risk, rate band widens. | my judgement |
| Credit score band: Weak | 550–649 | Riskier profile, higher pricing. | my judgement |
| Credit score band: Poor | 300–549 | Elevated risk; very wide and expensive pricing range. | my judgement |
| Personal loan rate band | 11.5%–17.5% | Typical unsecured risk band for India. | my judgement |
| Home loan rate band | 8.4%–10.8% | Reasonable housing-credit market range. | my judgement |
| LAP rate band | 9.2%–12.5% | Secured property loan range with moderate risk. | my judgement |
| Gold loan rate band | 7.2%–10.4% | Secured but shorter-tenor range. | my judgement |
| Two-wheeler loan rate band | 9.8%–15.4% | Vehicle financing with moderate risk. | my judgement |
| Business loan rate band | 12.5%–18.5% | Higher risk, particularly for smaller businesses. | my judgement |
| Processing fee assumption: personal loan | 1.8% | Typical upfront fee model for unsecured credit. | my judgement |
| Processing fee assumption: home loan | 0.5% | Lower retail fee for secured home loan. | my judgement |
| Processing fee assumption: LAP | 1.2% | Moderate secured loan fee. | my judgement |
| Processing fee assumption: gold | 0.8% | Low logistics-heavy secured fee. | my judgement |
| Processing fee assumption: two-wheeler | 1.3% | Typical vehicle finance fee. | my judgement |
| Processing fee assumption: business | 1.9% | Absorbs complexity and unsecured risk. | my judgement |
| LTV / collateral assumption | Secured loans get a comfort boost when collateral is unencumbered and sufficient | Helps explain why a secured loan can be more appropriate and safer than an unsecured loan in some cases. | my judgement |
| Income stability adjustment: stable | 1.0 | No penalty. | my judgement |
| Income stability adjustment: moderate | 0.88 | Slight reduction in FOIR comfort. | my judgement |
| Income stability adjustment: volatile | 0.75 | More conservative risk treatment. | my judgement |
| Confidence rule: unknown credit score | -18 points | Missing critical credit input lowers confidence materially. | my judgement |
| Confidence rule: incomplete data | -12 points | Missing key inputs reduce precision. | my judgement |
| Confidence rule: vulnerable income pattern | -12 points | Variable income makes the estimate less reliable. | my judgement |
| Confidence rule: strong data and stable savings | +10 to +18 points | Data completeness and savings improve confidence. | my judgement |
| Decision threshold: borrow less | 80% of safe amount | Encourages a smaller than requested ask if the borrower is near comfort limit. | my judgement |
| Decision threshold: do not borrow if stress ratio | 65% of requested amount | Captures cases where requested loan is materially above the safe range. | my judgement |
| High-existing-debt band | >52% of monthly income | Debt burden is considered elevated. | my judgement |
| Recent EMI bounce | Material penalty applied | The challenge specifically requires this to affect urgency and risk. | Assignment requirement |
| Maximum tenure assumptions | Vary by product, e.g., 72 months personal, 240 months home loan | Product-specific duration logic to match borrowing type. | my judgement |
| No data storage | Browser memory only, no local storage, cookies or backend | Explicit requirement of the task. | Assignment requirement |
| Not a sanction | Output is educational and for self-assessment only | Explicit requirement to make the tool transparent and non-binding. | Assignment requirement |

## Exact affordability formula used

The application uses a deliberately transparent and explainable affordability style calculation:

- Monthly net income is treated as the base cash-flow input.
- Applicable FOIR is chosen by income type: salaried, self-employed, or informal.
- Existing EMI is deducted from the affordability ceiling.
- Household expenses and a minimum surplus buffer are checked before a new EMI is considered acceptable.
- The "safe new EMI" is the lower of:
  1. max total EMI capacity = monthly income × applicable FOIR
  2. monthly income after living costs and debt obligations
  3. conservative stress-adjusted value

This is intentionally not a lender approval model; it is a borrower decision-support estimate.

## Why the rules are in JSON

The rules are stored in data/rules.json so thresholds can be reviewed, adjusted and tested without changing the UI logic. This supports the key Lokta requirement that a rule change should flow through the calculation automatically.
