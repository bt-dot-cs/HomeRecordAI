# AUDIENCE SCHEMAS — Layer 2 Reporting Agent
**Property:** 2847 Fernwood Drive, Philadelphia, PA 19103
**Purpose:** Define data fields, framing, tone, and output format for each specialist agent.

---

## AUDIENCE 1: APPRAISER

### Who They Are
Licensed real estate appraiser determining fair market value for mortgage underwriting, refinancing, estate, or sale purposes.

### What They Want
- Verified facts, not opinions
- Permit history — closed and open
- Structural condition with specificity (materials, age, condition ratings)
- Mechanical system ages and remaining useful life
- Known deficiencies that affect value
- Comparable improvement history (what was done, when, cost)
- Zoning, lot size, square footage, assessed vs market value
- Certificate of Occupancy status
- Open violations — especially anything that would trigger lender flags

### What They Don't Need
- Appliance brand names or serial numbers
- Emotional framing ("great opportunity", "well-loved home")
- Contractor opinions or warranty marketing language
- Insurance premium details

### Tone & Framing
Clinical, factual, structured. No narrative. Data should be scannable.

### Output Format
Structured report with labeled sections. Tables preferred. Dollar figures where available. Condition ratings (Good / Fair / Poor). Flag open permits and violations explicitly at top of report.

### Key Fields to Populate
```json
{
  "property": {
    "address": "",
    "year_built": "",
    "square_footage": "",
    "lot_size": "",
    "zoning": "",
    "assessed_value": "",
    "market_value_estimate": "",
    "certificate_of_occupancy": ""
  },
  "structural_condition": {
    "foundation": { "condition": "", "notes": "" },
    "roof": { "condition": "", "material": "", "estimated_remaining_life": "", "notes": "" },
    "exterior_walls": { "condition": "", "material": "", "notes": "" }
  },
  "mechanical_systems": {
    "hvac": { "age": "", "condition": "", "estimated_remaining_life": "" },
    "plumbing": { "supply_material": "", "drain_material": "", "condition": "" },
    "electrical": { "panel_type": "", "amperage": "", "condition": "", "safety_flags": [] },
    "water_heater": { "age": "", "condition": "", "estimated_remaining_life": "" }
  },
  "permits": {
    "open": [],
    "closed": [],
    "pending": []
  },
  "open_violations": [],
  "recent_improvements": [],
  "value_affecting_deficiencies": []
}
```

---

## AUDIENCE 2: INSURANCE INSPECTOR

### Who They Are
Inspector or underwriter for a homeowner's insurance carrier assessing insurability, risk level, and premium justification.

### What They Want
- Safety hazards — electrical, structural, fire, water
- Known code violations and remediation status
- Roof condition and age (major claims driver)
- Presence of high-risk components (Stab-Lok panels, knob-and-tube wiring, cast iron drains)
- Permit status for recent work — unpermitted work is a liability
- Flood zone classification
- Existing policy details if available
- Prior claims or damage history
- Appliance ages only where relevant to risk (water heater age = water damage risk)

### What They Don't Need
- Market value or investment framing
- Appliance purchase receipts or extended warranty details
- Contractor payment history
- Buyer-facing narrative

### Tone & Framing
Risk-focused. Flag anything that increases claims probability. Use direct language. Highlight remediated vs. outstanding issues clearly.

### Output Format
Risk summary at top (High / Medium / Low per category). Itemized findings with remediation status. Open items flagged in red language. Closed/resolved items noted as mitigants.

### Key Fields to Populate
```json
{
  "property": {
    "address": "",
    "year_built": "",
    "flood_zone": "",
    "existing_policy": ""
  },
  "risk_summary": {
    "electrical": { "risk_level": "", "findings": [], "remediation_status": "" },
    "roof": { "risk_level": "", "findings": [], "remediation_status": "" },
    "plumbing": { "risk_level": "", "findings": [], "remediation_status": "" },
    "structural": { "risk_level": "", "findings": [], "remediation_status": "" },
    "code_compliance": { "risk_level": "", "open_violations": [], "closed_violations": [] }
  },
  "high_risk_components": [],
  "recent_remediation": [],
  "outstanding_hazards": [],
  "water_damage_risk_factors": [],
  "fire_risk_factors": []
}
```

---

## AUDIENCE 3: POTENTIAL BUYER

### Who They Are
Individual or family considering purchasing the property. May be first-time buyer or experienced. Likely working with a real estate agent. Needs to understand what they're getting into — financially and practically.

### What They Want
- Plain language summary of property condition
- What needs to be fixed now vs. later
- Realistic cost estimates for needed repairs
- Appliance ages and replacement timelines
- What's been recently improved (roof, electrical, etc.)
- Any red flags that could affect financing (open permits, violations, panel issues)
- Maintenance budget they should expect annually
- Honest framing — not a sales pitch

### What They Don't Need
- Technical jargon (IRC code references, material specifications)
- Permit numbers or inspector license numbers
- Insurance surcharge details (unless directly relevant)
- Raw JSON or tabular data

### Tone & Framing
Conversational, honest, helpful. Like advice from a knowledgeable friend. Acknowledge positives but don't minimize real issues. Empower the buyer to make an informed decision.

### Output Format
Narrative report with clear sections. Use plain English. Bullet points for action items. A "What to Know Before You Buy" summary at the top. Cost estimates in plain ranges.

### Key Fields to Populate
```json
{
  "summary": {
    "overall_condition": "",
    "immediate_action_items": [],
    "near_term_action_items": [],
    "things_already_fixed": []
  },
  "financials": {
    "estimated_immediate_costs": "",
    "estimated_1_2_year_costs": "",
    "estimated_annual_maintenance_budget": "",
    "appliance_replacement_timeline": []
  },
  "red_flags": [],
  "positive_notes": [],
  "financing_risk_items": [],
  "appliances": {
    "included": [],
    "ages": {},
    "replacement_needed_within_3_years": []
  }
}
```

---

## AUDIENCE 4: CONTRACTOR (REPAIR/RENOVATION)

### Who They Are
Licensed contractor — could be general contractor, electrician, roofer, plumber — scoping work or preparing a bid. Needs precise technical detail to estimate labor, materials, and sequencing.

### What They Want
- Exact scope of known issues by trade (electrical, roofing, plumbing, HVAC, masonry)
- Materials already identified (EPDM, slate, copper supply lines, cast iron drains)
- Work already completed — avoid duplicating
- Open permit status — they need to know if they're inheriting someone else's permit or pulling new ones
- Measurements where available (linear feet, square footage, tonnage)
- Prior contractor names and work scope (so they're not undoing good work)
- Code violations that must be remediated
- Access notes (basement, attic, rear addition)

### What They Don't Need
- Market value or financial framing
- Buyer or appraiser narrative
- Appliance warranty registration details (unless appliance repair is in scope)
- Insurance policy information

### Tone & Framing
Technical, precise, trade-specific. Organized by system/trade. No filler language. Measurements and material specs wherever available.

### Output Format
Work order style. Organized by trade. Each item includes: description, location, materials noted, permit status, priority level, and estimated cost range from inspection report where available. Flag sequencing dependencies (e.g. "electrical panel must be resolved before insulation work in attic").

### Key Fields to Populate
```json
{
  "property": {
    "address": "",
    "year_built": "",
    "square_footage": "",
    "access_notes": ""
  },
  "work_items": {
    "electrical": [
      {
        "description": "",
        "location": "",
        "materials": [],
        "permit_required": true,
        "permit_status": "",
        "priority": "",
        "estimated_cost_range": "",
        "sequencing_dependency": ""
      }
    ],
    "roofing": [],
    "plumbing": [],
    "hvac": [],
    "masonry": [],
    "mechanical_ventilation": []
  },
  "completed_work_on_record": [],
  "open_permits_to_inherit_or_reference": [],
  "code_violations_requiring_remediation": []
}
```

---

## CROSS-AUDIENCE EXCLUSION RULES
*(For Responsible AI / data governance layer)*

| Data Field | Appraiser | Inspector | Buyer | Contractor |
|------------|-----------|-----------|-------|------------|
| Owner full name | ✓ | ✓ | ✗ | ✗ |
| Insurance policy number | ✗ | ✓ | ✗ | ✗ |
| Insurance premium amount | ✗ | ✓ | ✗ | ✗ |
| Appliance serial numbers | ✗ | ✗ | ✗ | ✓ (if in scope) |
| Contractor payment amounts | ✗ | ✗ | ✗ | ✗ |
| Check numbers / payment refs | ✗ | ✗ | ✗ | ✗ |
| Market value estimate | ✓ | ✗ | ✓ | ✗ |
| Permit numbers | ✓ | ✓ | ✗ | ✓ |
| Inspector license number | ✓ | ✓ | ✗ | ✗ |

---

*This schema file serves as the instruction set for Layer 2 specialist agents. Each agent receives only the fields marked for its audience type, plus the structured home record output from Layer 1.*
