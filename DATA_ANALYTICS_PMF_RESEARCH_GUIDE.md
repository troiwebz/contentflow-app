# 📊 PMF (Product-Market Fit) Research Methodology Guide
## Complete Data Analytics Workflow for Market Entry & Business Validation

---

## Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [11-Module Structure](#11-module-structure)
4. [Detailed Module Instructions](#detailed-module-instructions)
5. [Data Sources & Verification](#data-sources--verification)
6. [Analysis Framework](#analysis-framework)
7. [Deliverables & File Format](#deliverables--file-format)
8. [QA Checklist](#qa-checklist)
9. [Examples & Case Studies](#examples--case-studies)
10. [Common Pitfalls & Solutions](#common-pitfalls--solutions)

---

## Overview

### What is PMF Research?
Product-Market Fit (PMF) research validates whether a new business concept has viable demand, manageable competition, suitable location, target audience willingness-to-pay, and achievable revenue targets. Rather than guessing, PMF research provides **data-backed confidence scores** to decide GO / SELECTIVE-GO / NO-GO.

### Why This Methodology?
- **Comprehensive**: Covers demand, competition, location, audience, and revenue in one integrated model
- **Quantified**: Every pillar scored on 0-10 scale with clear rationale
- **Replicable**: Same process works for restaurants, retail, services, e-commerce
- **Client-Ready**: Outputs are professional PDFs, Excel workbooks, and presentations
- **Risk-Mitigation**: Catches market gaps, oversupply, and demographic mismatches before launch

### Typical Timeline
- Small project (3-5 competitors): 3-5 days
- Medium project (10-20 competitors, multiple cities): 1-2 weeks
- Large project (30+ competitors, 3+ cities, advanced financials): 2-4 weeks

---

## Core Concepts

### The 5-Pillar PMF Score Model
```
PMF Score = (Demand × 0.25) + (Competition × 0.25) + (Location × 0.20) + (Audience × 0.15) + (Revenue × 0.15)
```

| Pillar | Weight | Definition | Example Metric |
|--------|--------|-----------|-----------------|
| **Demand** | 25% | Search volume, growth rate, trend direction | "Fine Dining Sukhumvit: 1,650/month, +14% YoY" |
| **Competition** | 25% | Competitor count, quality, saturation | "6 established competitors, 4.5★ avg, 18 months market" |
| **Location** | 20% | Foot traffic, demographics, accessibility | "BTS station 300m, 85% European expat zone" |
| **Audience** | 15% | Target demographic size, willingness-to-pay | "45,000 European expats in 5km, avg spend 1,500 THB" |
| **Revenue** | 15% | Unit economics, margin, scale potential | "12-month break-even, 18-22% IRR, 1.5M-2.1M THB/month" |

### GO / NO-GO Decision Matrix
```
FULL GO:        8.5 - 10.0  → Launch immediately, high confidence
SELECTIVE GO:   5.5 - 8.4   → Launch with operational excellence & differentiation
NO-GO:          < 5.5       → Pause, pivot concept, or target different market
```

### 3-Pillar Business Positioning (Restaurant Example)
```
Primary Pillar:    European Fine Dining (validated, largest audience)
Secondary Pillar:  Wine Bar (growth segment, +22% YoY, high margin)
Opportunity Pillar: Spanish Cuisine (only 3 competitors vs 6+ French, market gap)
```

---

## 11-Module Structure

### Quick Reference Table

| # | Module | Output File | Purpose | Data Source |
|---|--------|-------------|---------|-------------|
| 0 | Business Angle Definition | Dashboard Tab | Finalize positioning (3-pillar framework) | Industry analysis + client input |
| 1 | Competitor Analysis | 4_Competitors_Data.csv/xlsx | Identify direct & indirect competitors within 5km radius | Google Maps + Apify scraper |
| 2 | Keyword Research | 5_Keywords_Data.csv/xlsx | Quantify demand by search volume & growth rates | Google Trends + keyword planner |
| 3 | Review Sentiment Analysis | 6_Review_Mentions_Data.csv/xlsx | Extract customer pain points & desires | Google Reviews + Apify scraper |
| 4 | Market Research Synthesis | 3_Market_Research_Workbook.xlsx | Integrate all data into 8-tab analysis workbook | All sources (1-3) synthesized |
| 5 | PMF Scoring | 2_Final_Verdict.pdf | Calculate weighted PMF score, determine GO/NO-GO | Market research synthesis |
| 6 | Location Deep-Dive | 8_Location_Analysis.pdf | Property-specific analysis (foot traffic, demographics, zoning) | Google Maps, local data, demographics API |
| 7 | Business Simulation | 9_Business_Simulation.pdf | Year 1 financial projections (revenue, COGS, P&L, break-even) | Unit economics + industry benchmarks |
| 8 | Venue Design | 10_Venue_Design_Guide.pdf | Physical space recommendations (layout, capacity, equipment) | Property measurements + best practices |
| 9 | Investor Pitch | 1_Presentation.pptx | Executive summary (9 slides, 10-min talk) | PMF score + key findings |
| 10 | Real Estate Scouting | 11_Real_Estate_Agents.xlsx | 20 agents with priority ranking + cold-call script | Local business directories |

---

## Detailed Module Instructions

### MODULE 0: Business Angle Definition
**Goal**: Finalize the business concept into 1 primary pillar + 2 secondary pillars

#### Step 1: Gather Client Brief
```
Client Input Template:
- Business type: [e.g., "Fine Dining Restaurant"]
- Target city: [e.g., "Bangkok, Thailand"]
- Target audience: [e.g., "European expats, age 28-55"]
- Property address (optional): [e.g., "6th Avenue, Sukhumvit, Bangkok"]
- Unique angle/positioning: [e.g., "Spanish + Wine Bar fusion"]
- Budget (optional): [e.g., "3-5M THB investment"]
```

#### Step 2: Industry Context Research
Use Google Trends + competitor intel to answer:
- What similar concepts exist in the target market?
- Which are thriving, which are struggling, and why?
- What's the growth trajectory? (Declining, flat, growing, hot?)
- What niches are underserved? (Market gaps)

**Example - Bangkok Fine Dining:**
```
Concept Analysis:
- French: 6+ competitors, mature, +4-8% YoY (SATURATED)
- Italian: 4-5 competitors, stable, +6% YoY (MODERATE)
- Spanish: 3 competitors, emerging, +22% YoY (OPPORTUNITY) ← Pillar 3
- Wine Bar: 2 dedicated wine bars, growth, +22% YoY (GROWTH) ← Pillar 2
```

#### Step 3: Define 3-Pillar Framework
```
PILLAR 1 (Primary):    [Largest audience, highest demand, proven market]
PILLAR 2 (Secondary):  [Growth segment, differentiation, margin play]
PILLAR 3 (Opportunity):[Market gap, underserved niche, high growth rate]
```

**Destin Bangkok Example:**
```
PILLAR 1: European Fine Dining (1,850 searches/mo, +14% YoY, base positioning)
PILLAR 2: Wine Bar (780 searches/mo, +22% YoY, growth segment, avg check +22%)
PILLAR 3: Spanish Cuisine (420 searches/mo, only 3 competitors, market gap)
BENCHMARK: French positioning (why NOT to pursue this pillar)
```

#### Deliverable: Dashboard Tab
- 3-pillar positioning summary with search volumes & YoY growth
- Competitive landscape brief per pillar
- Market opportunity scoring (which pillar has highest upside?)
- Initial PMF hypothesis

---

### MODULE 1: Competitor Analysis (5km Radius)
**Goal**: Identify all direct & indirect competitors within 5km, rank by relevance to your concept

#### Step 1: Define Search Radius & Geography
```
Standard: 5km radius from your property address
Geographic Division: Split into 4 quadrants (N, S, E, W) to avoid clustering bias

Example - Destin Bangkok (6th Avenue, Sukhumvit):
- North:    5km toward Phrom Phong (BTS area, expat zone)
- South:    5km toward Thonglor (premium zone)
- East:     5km toward On Nut (suburban, less relevant)
- West:     5km toward Lumpini (business district)
```

#### Step 2: Scrape Competitor Data (Apify Google Maps Actor)
**Tool**: Apify → "Google Maps Scraper" Actor
**Input Parameters**:
```json
{
  "searchStrings": [
    "fine dining restaurant Bangkok",
    "Spanish restaurant Bangkok",
    "wine bar Bangkok",
    "European cuisine Sukhumvit"
  ],
  "startUrls": ["https://www.google.com/maps"],
  "lat": 13.7425,        // Destin Bangkok latitude
  "lng": 100.5738,       // Destin Bangkok longitude
  "radius": 5000,        // 5km in meters
  "maxCrawledPlaces": 100 // Limit to top 100 by relevance
}
```

**Output Fields** (standardize these):
```
Rank | Name | Address | Distance (km) | Rating | Reviews | Category | Pillar | Relevance Score
```

#### Step 3: Filter & Categorize by Pillar
```
Relevance Scoring (0-10):
10 = Direct competitor (same concept)
8-9 = Very similar (minor cuisine difference)
6-7 = Indirect competitor (similar price point, audience)
4-5 = Tangential (different concept, same area)
0-3 = Noise (wrong category, too far)

Keep scores 6+, discard <6
```

**Example - Destin Bangkok Competitors:**
```
Rank | Name           | Rating | Distance | Pillar              | Relevance | Notes
1    | Bisou          | 4.7    | 0.3km    | European Fine Din   | 10        | Direct competitor, premium positioning
2    | Cyrano         | 4.6    | 0.8km    | European Fine Din   | 9         | Same cuisine, slightly lower rating
3    | Chenin         | 4.6    | 1.2km    | Wine Bar + French   | 9         | Wine program standout, small portions complaint
4    | Fuego          | 4.8    | 1.5km    | Spanish + Fusion    | 8         | Theatrical open kitchen, fusion not pure
5    | El Tapeo       | 4.5    | 1.8km    | Spanish + Wine      | 8         | Casual tapas, not premium enough
6    | Locanda Blu     | 4.4    | 2.1km    | Italian Fine Din    | 7         | Premium, wrong cuisine
```

#### Step 4: Competitive Positioning Analysis
Answer these questions per competitor:
```
Strength Points:    What are they doing well? (Rating, reviews, word-of-mouth)
Weakness Points:    What complaints appear in reviews? (Portions, service, pricing)
Positioning Gap:    How could you differentiate? (Generous portions + premium service + wine)
Price Point:        Estimated average bill per person
Kitchen Style:      Open, closed, semi-open?
Service Model:      Fine dining, casual, hybrid?
Wine Program:       Extensive, basic, none?
```

#### Deliverable: 4_Competitors_Data.xlsx
```
Tabs:
- Raw Data (15 competitors, all fields from Apify)
- Analysis (positioning gaps, strength/weakness comparison)
- Color-Coded Pillar Chart (fine dining in blue, wine bar in gold, Spanish in red)
- Distance Distribution (shows which zone has most competitors)
```

**Example Entry:**
```
Name:           Chenin
Rating:         4.6 ⭐ (157 reviews)
Distance:       1.2 km (North)
Average Check:  1,200-1,500 THB
Strengths:      Excellent wine program, premium ambiance, French cuisine expertise
Weaknesses:     Small portions (27% of reviews mention), language barriers in service
Opportunity:    Generous portions + English-fluent European service staff
Pillar:         Wine Bar + French (Secondary concept, not Spanish)
Relevance:      9/10 (Direct competitor - must differentiate or lose customers)
```

---

### MODULE 2: Keyword Research & Demand Quantification
**Goal**: Measure search volume per concept to validate demand exists

#### Step 1: Define Keyword Tiers
```
TIER 1 (Primary Keywords):
- "Fine Dining Sukhumvit" (highest volume, broadest intent)
- "Spanish Restaurant Bangkok" (concept-specific)
- "Wine Bar Bangkok" (pillar-specific)
- "Tapas Restaurant Sukhumvit" (variant)

TIER 2 (Secondary Keywords):
- "European Restaurant Bangkok"
- "Open Kitchen Restaurant Bangkok"
- "Wine Pairing Dinner Bangkok"
- "Premium Spanish Cuisine"

TIER 3 (Long-Tail, Niche):
- "Romantic Dinner Sukhumvit"
- "Spanish Wine Selection Bangkok"
- "Fine Dining Group Party Bangkok"
```

#### Step 2: Collect Monthly Search Volume
**Tool**: Google Trends / Google Keyword Planner
```
Keyword                       | Monthly Searches | YoY Growth | Competition | Pillar
Fine Dining Sukhumvit         | 1,650            | +14%       | HIGH        | Fine Dining
Spanish Restaurant Bangkok    | 420              | +22%       | LOW         | Spanish
Wine Bar Bangkok              | 780              | +22%       | MEDIUM      | Wine Bar
Tapas Restaurant Bangkok      | 280              | +18%       | LOW         | Spanish
European Restaurant Bangkok   | 890              | +12%       | HIGH        | Fine Dining
Open Kitchen Restaurant       | 340              | +16%       | LOW         | Positioning
```

#### Step 3: Growth Analysis (YoY)
```
Classification:
DECLINING:  < 0% YoY    → Market is shrinking
FLAT:       0-5% YoY    → Mature market, limited growth potential
GROWING:    5-15% YoY   → Healthy demand, proven concept
HOT:        15%+ YoY    → Emerging opportunity, early-mover advantage
```

**Interpretation Example:**
```
Spanish Restaurant: 420/mo, +22% YoY → HOT market, early-mover opportunity
Wine Bar: 780/mo, +22% YoY → HOT market, strong tailwind
Fine Dining: 1,650/mo, +14% YoY → GROWING, stable demand
French Restaurant: (implied from lower growth, +4-8%) → FLAT/MATURE
```

#### Step 4: Calculate Addressable Market
```
Formula:
Addressable Market = (Monthly Searches × 12 months) × (Avg Annual Spend per Customer)

Example (Destin Bangkok):
Fine Dining: 1,650 searches/mo × 12 = 19,800 annual searches
  × 25 visits/customer/year = ~792 annual visits potential
  × 1,200 THB avg = 950K THB annual addressable market for "fine dining" keyword
```

#### Deliverable: 5_Keywords_Data.xlsx
```
Tabs:
- Raw Keywords (50+ keywords with search volume, growth, competition)
- Pillar Analysis (aggregate volume per pillar)
- Growth Ranking (sorted by YoY %, shows hottest keywords)
- Competitor Keyword Comparison (how much search volume goes to Spanish vs French?)
```

**Visual Example:**
```
📊 Monthly Search Volume by Pillar:

PILLAR 1 - FINE DINING:  1,650 + 890 + 340 = 2,880 searches/month (61%)
PILLAR 2 - WINE BAR:     780 searches/month (17%)
PILLAR 3 - SPANISH:      420 + 280 = 700 searches/month (15%)
BENCHMARK - FRENCH:      (absorbed in "Fine Dining", +4-8% growth = declining share)

Total Addressable Market: ~4,360 searches/month
Your capture target: 2-3% of fine dining searches = 30-50 customers/month
```

---

### MODULE 3: Review Sentiment & Customer Desires Analysis
**Goal**: Extract customer pain points and desires from competitor reviews

#### Step 1: Scrape Reviews (Apify Google Maps Actor)
**Tool**: Apify → "Google Maps Scraper" with `includeReviews: true`
```
Input:
{
  "searchStrings": ["Bisou Bangkok", "Cyrano Bangkok", "Chenin Bangkok", ...],
  "includeReviews": true,
  "maxReviews": 50 per competitor  // Get top 50 reviews
}
```

**Review Fields**:
```
Reviewer Name | Rating | Date | Text | Sentiment (Positive/Negative/Mixed)
```

#### Step 2: Extract Pain Points (Negative Sentiment)
**Methodology**: Read 30-50 reviews per major competitor, note recurring complaints

```
Pain Point Analysis Template:

COMPETITOR: Chenin (4.6★, 157 reviews)

Positive Themes:
- Wine program (mentioned in 45% of 5★ reviews)
- Ambiance (mentioned in 38%)
- Service professionalism (mentioned in 42%)

Negative Themes:
- Portion size too small (27% of 3-4★ reviews) ← KEY OPPORTUNITY
- Language barriers (18% mention staff English problems)
- Parking difficulty (12%)
- Steep pricing without generosity (9%)

Customer Quote:
"Excellent wine list, professional service, but the portions are tiny for the price. 
Paid 1,400 THB and left hungry."
```

#### Step 3: Extract Desires (Positive Sentiment)
**What customers praise most** = what they value

```
Desire Analysis (from 5★ reviews):

What Drives 5-Star Ratings:
1. Wine expertise + recommendations (63% mention this)
2. Generous portions / good value (58%)
3. Attentive European service (54%)
4. Open kitchen / theater (45%)
5. Authentic cuisine (42%)
6. Romantic ambiance (38%)
7. Instagram-worthy presentation (35%)
8. Local ingredient stories (28%)
9. Wine by the glass program (22%)
10. Small plates for sharing (18%)
```

#### Step 4: Hot Items & Trending Desires
Combine review data + Google Trends to identify emerging trends

```
HOT ITEMS (appearing in 40%+ of recent reviews + positive Google Trends):

1. Wine Program Expertise
   Reviews: 63% praise wine recommendations
   Trends: "Wine Bar Bangkok" +22% YoY growth
   Action: Hire sommelier, curate 150+ wines, offer wine pairings

2. Generous Portions
   Reviews: 58% praise portion sizes vs Chenin complaint (portions too small)
   Trends: "Generous portions" mentioned in 45% of positive reviews
   Action: Plate design showing abundance, 120% std portion sizes

3. Open Kitchen Design
   Reviews: Fuego 4.8★ driven by theatrical cooking
   Trends: "Open kitchen restaurant" +16% YoY
   Action: Design visible kitchen, chef greeting, tableside finishing

4. European Service Standard
   Reviews: Chenin language barrier, Bisou French staff
   Trends: "European service Bangkok" mentioned in premium restaurant reviews
   Action: Hire European staff trained in fine dining protocols

5. Spanish + Wine Authenticity
   Reviews: Diners praise "real" Spanish food vs fusion attempts
   Trends: "Authentic Spanish" +18% YoY
   Action: Executive chef from Spain, non-fusion menu
```

#### Deliverable: 6_Review_Mentions_Data.xlsx
```
Tabs:
- Raw Reviews (competitor name, rating, text, extracted theme)
- Pain Points (ranked by frequency, competitor breakdown)
- Desires (ranked by frequency, customer quotes)
- Hot Items (10 validated desires for your menu/service design)
- Competitor Sentiment (avg rating by pillar: Fine Dining 4.5★, Spanish 4.3★, Wine Bar 4.6★)
```

---

### MODULE 4: Market Research Synthesis Workbook
**Goal**: Integrate modules 1-3 into one cohesive 8-tab analysis workbook

#### The 8-Tab Structure

**Tab 1: DASHBOARD**
```
Key Metrics at a Glance:
- 3 Pillar Overview (search volume, YoY growth, competitor count per pillar)
- PMF Score Hypothesis (draft score before module 5)
- Competitive Positioning Summary (strengths vs Bisou, Cyrano, Chenin)
- Next Steps Checklist
```

**Tab 2: PILLAR 1 - FINE DINING**
```
Search Volume:       1,650/month (+14% YoY)
Competitors:         6 (Bisou, Cyrano, Locanda Blu, etc.)
Avg Rating:          4.5★
Market Maturity:     GROWING (proven concept, established audience)
Differentiation:     [Your angle: Generous portions, wine focus, Spanish accent]
```

**Tab 3: PILLAR 2 - WINE BAR**
```
Search Volume:       780/month (+22% YoY) ← HOTTEST growth
Competitors:         2 dedicated, 5 with wine focus
Avg Rating:          4.6★
Market Maturity:     HOT (emerging segment, high growth)
Margin Potential:    +22% vs fine dining (wine markups 300-400%)
Customer Desire:     "Wine expertise", "wine pairing", "wine by glass"
```

**Tab 4: PILLAR 3 - SPANISH**
```
Search Volume:       420/month (+22% YoY)
Competitors:         3 (Fuego, El Tapeo, Barcelona-style)
Avg Rating:          4.3★ (lowest, but most underserved)
Market Maturity:     OPPORTUNITY (early-stage, high growth, low supply)
Differentiation:     Premium Spanish (not casual tapas), authentic chef, regional focus
Customer Desire:     "Authentic Spanish", "regional specialties", "Spanish wine"
```

**Tab 5: BENCHMARK - FRENCH (Why NOT?)**
```
Search Volume:       (included in "Fine Dining" keyword)
Competitors:         6+ (highest saturation)
Avg Rating:          4.5★ (not higher than Spanish or Wine Bar)
Growth Rate:         +4-8% YoY (SLOWEST growth)
Market Status:       SATURATED (mature market, limited differentiation)
Conclusion:          French positioning offers no growth advantage vs Spanish+Wine
```

**Tab 6: COMPETITIVE POSITIONING**
```
Competitor Name | Rating | Distance | Strengths | Weaknesses | Your Advantage
Bisou           | 4.7    | 0.3km    | Premium   | Expensive  | Wine + generosity
Cyrano          | 4.6    | 0.8km    | Classic   | Conservative | Spanish angle
Chenin          | 4.6    | 1.2km    | Wine      | Portions   | ← Huge opportunity
Fuego           | 4.8    | 1.5km    | Theatrical| Fusion     | Authentic Spanish
```

**Tab 7: HOT ITEMS & CUSTOMER DESIRES**
```
Rank | Item                        | Review Frequency | Trend Growth | Implementation
1    | Wine Expertise              | 63%             | +22% YoY     | Sommelier, 150+ wines
2    | Generous Portions           | 58%             | +18%         | 120% portion sizes
3    | Open Kitchen               | 45%             | +16%         | Visible kitchen
4    | European Service           | 54%             | Stable       | European staff
5    | Authentic Spanish Cuisine  | 42%             | +22%         | Spanish chef
6    | Wine Pairing Program       | 35%             | +20%         | Pairing menu
7    | Romantic Ambiance          | 38%             | Stable       | Lighting, music
8    | Instagram Appeal           | 35%             | +15%         | Plating, decor
9    | Small Plates for Sharing   | 18%             | +14%         | Tapas section
10   | Ingredient Stories         | 28%             | +12%         | Menu narratives
```

**Tab 8: LOCATION ANALYSIS PREVIEW**
```
Address:         6th Avenue, Sukhumvit, Bangkok
Zone:            Premium European expat area
Distance to BTS: 300m (Thonglor station)
Foot Traffic:    85% European/expat demographic
Area Growth:     +14% YoY (emerging zone)
Rent Range:      200-400k THB/month (premium)
Competition:     High quality, low quantity (gap for premium Spanish)
```

#### Deliverable: 3_Market_Research_Workbook.xlsx
- All 8 tabs with professional formatting (color-coded by pillar, frozen headers, borders)
- No Apify/tool references (use "Google Maps Data" instead)
- Summary charts (competitor positioning plot, demand by pillar, growth rates)
- Export-ready for client presentation

---

### MODULE 5: PMF Scoring & Final Verdict
**Goal**: Calculate weighted PMF score and determine GO / NO-GO decision

#### Step 1: Score Each Pillar (0-10 scale)

**DEMAND SCORE (25% weight)**
```
Criteria:
- Monthly search volume
- YoY growth rate
- Trend direction (increasing/flat/declining)
- Market saturation (how many competitors per search volume)

Scoring:
10: 1,000+ searches/month, +20%+ YoY, hot emerging market
8-9: 500-1,000 searches/month, +10-20% YoY, growing market
6-7: 200-500 searches/month, +5-10% YoY, stable market
4-5: 100-200 searches/month, 0-5% YoY, mature market
0-3: <100 searches/month, declining, saturated market

Destin Bangkok Calculation:
- Fine Dining: 1,650/mo + Wine Bar 780/mo + Spanish 420/mo = 2,850/mo combined demand
- Growth: +14-22% YoY (weighted average +17%)
- Saturation: 15 competitors ÷ 2,850 searches = 1 competitor per 190 searches (healthy ratio)
→ DEMAND SCORE: 8.5/10 (strong demand, proven keywords, good growth-to-saturation ratio)
```

**COMPETITION SCORE (25% weight)**
```
Criteria:
- Competitor count within 5km radius
- Average competitor rating
- Time in market (established vs emerging)
- Quality vs quantity (are they thriving or struggling?)

Scoring:
10: 0-2 competitors, <4.0★ avg, immature/unprofitable market
8-9: 3-5 competitors, 4.0-4.3★ avg, small market with room
6-7: 6-10 competitors, 4.3-4.5★ avg, moderate competition
4-5: 11-20 competitors, 4.5-4.7★ avg, crowded but viable
0-3: 20+ competitors, 4.7★+ avg, saturated/commoditized

Destin Bangkok Calculation:
- Total competitors within 5km: 15
- Rating distribution: 4.8★ (Fuego), 4.7★ (Bisou), 4.5-4.6★ (most others)
- Time in market: Bisou & Cyrano established (2+ years), newer entries 6-12 months
- Profitability signals: High ratings, busy periods, reviews indicate thriving business
→ COMPETITION SCORE: 7/10 (moderate competition, but healthy for market; room for differentiation)
```

**LOCATION SCORE (20% weight)**
```
Criteria:
- Foot traffic volume
- Target demographic concentration
- BTS/transport accessibility
- Rent vs revenue potential
- Area growth trajectory

Scoring:
10: High foot traffic (10k+/day), 95%+ target demo, BTS <200m, affordable rent, +15%+ area growth
8-9: Good foot traffic (5-10k/day), 85-95% target demo, BTS <500m, moderate rent, +10-15% growth
6-7: Moderate foot traffic (2-5k/day), 70-85% target demo, BTS <1km, higher rent, +5-10% growth
4-5: Low foot traffic (<2k/day), 50-70% target demo, BTS >1km, expensive rent, flat growth
0-3: Very low traffic, <50% target demo, poor transport, unaffordable rent, declining

Destin Bangkok Calculation:
- Location: 6th Avenue, Sukhumvit (premium zone, high expat concentration)
- Foot traffic: 85% European/expat demographic (estimated 6-8k/day potential)
- BTS: 300m from Thonglor station (excellent)
- Rent: 250-350k THB/month (high but justified by income potential in fine dining)
- Area Growth: +14% YoY (strong trajectory)
→ LOCATION SCORE: 8.5/10 (premium location, perfect demographic alignment, strong growth)
```

**AUDIENCE SCORE (15% weight)**
```
Criteria:
- Target audience size within 5km
- Purchasing power (avg spend per visit)
- Willingness-to-pay premium pricing
- Frequency of visits (weekly, monthly, quarterly)

Scoring:
10: 50,000+ target people, 2,000+ THB avg spend, 80%+ willing to pay premium, 1x/week+ visit frequency
8-9: 30-50k people, 1,500-2,000 THB avg spend, 70-80% premium willing, 2-4x/month visit frequency
6-7: 15-30k people, 1,000-1,500 THB avg spend, 50-70% premium willing, 1x/month visit frequency
4-5: 5-15k people, 500-1,000 THB avg spend, 30-50% willing, quarterly visits
0-3: <5k people, <500 THB avg spend, <30% willing, rare visits

Destin Bangkok Calculation:
- European expats in 5km radius: ~45,000 (demographics data)
- Avg fine dining spend: 1,200-1,500 THB/person
- Premium willingness: High (expats accustomed to fine dining, expense accounts)
- Visit frequency: 1-3x per month for established fine dining venue
→ AUDIENCE SCORE: 8/10 (large affluent audience, proven spend patterns, high premium willingness)
```

**REVENUE SCORE (15% weight)**
```
Criteria:
- Unit economics (margin per customer)
- Monthly revenue potential
- Break-even timeline
- Scale potential (kitchen capacity, staffing)
- IRR/ROI targets

Scoring:
10: >3M THB/month potential, <6 month break-even, 20%+ IRR, scalable, 40%+ margins
8-9: 2-3M THB/month, 6-9 month break-even, 15-20% IRR, scalable, 35-40% margins
6-7: 1-2M THB/month, 9-12 month break-even, 10-15% IRR, moderate scaling, 30-35% margins
4-5: 500k-1M THB/month, 12-18 month break-even, 5-10% IRR, limited scaling, 25-30% margins
0-3: <500k THB/month, >18 month break-even, <5% IRR, not scalable, <25% margins

Destin Bangkok Calculation:
Conservative Model:
- Monthly revenue: 1M THB (25 seats × 12 covers/day × 25 days × 1,300 THB avg)
- COGS: 30% = 300k
- Labor: 25% = 250k
- Rent: 300k
- Other: 50k
- Net: 100k/month (12% margin)
- Break-even: Month 12
- IRR: 12-15%

Optimistic Model (with wine program + wine bar segment):
- Monthly revenue: 2.1M THB (wine markups 300-400%, increased covers via wine traffic)
- COGS: 28% = 588k
- Labor: 23% = 483k
- Rent: 300k
- Other: 50k
- Net: 580k/month (27% margin, professional level)
- Break-even: Month 6
- IRR: 18-22%

→ REVENUE SCORE: 7.5/10 (Solid financials with upside; wine bar integration crucial)
```

#### Step 2: Calculate Weighted PMF Score
```
PMF Score = (8.5 × 0.25) + (7.0 × 0.25) + (8.5 × 0.20) + (8.0 × 0.15) + (7.5 × 0.15)
          = 2.125 + 1.75 + 1.7 + 1.2 + 1.125
          = 8.1 / 10.0
```

#### Step 3: Determine GO / NO-GO Decision
```
PMF Score: 8.1/10
Decision: FULL GO ✅

Rationale:
- Score above 7.5 threshold indicates strong market fit
- Strong demand across all 3 pillars (fine dining, wine bar, Spanish)
- Differentiation opportunity vs Chenin (generous portions + wine expertise)
- Premium location with 85% target demographic
- Solid unit economics with 18-22% IRR upside potential
- Spanish pillar offers market gap (only 3 competitors, +22% growth)

Critical Success Factors:
1. Wine program expertise (sommelier hire, 150+ curated wines)
2. Generous portions vs competitors (addressing Chenin complaint)
3. European service standards (hiring European staff)
4. Authentic Spanish + wine-forward menu (not fusion)
5. Open kitchen design (visible cooking, theater)
```

#### Deliverable: 2_Final_Verdict.pdf
- 1-page executive summary with:
  - PMF score breakdown (each pillar with rationale)
  - GO/NO-GO decision with confidence level
  - Top 3 success factors
  - Risk mitigation summary
  - Next steps (location scouting, staff hiring, menu development)

---

### MODULE 6: Location Deep-Dive Analysis
**Goal**: Property-specific analysis of foot traffic, zoning, layout feasibility

#### Analysis Categories

**1. Demographic Analysis**
```
- Target population within 5km radius: [Count]
- Age distribution of target demo: [Breakdown by age bracket]
- Purchasing power (avg household income): [THB/year]
- Expat concentration: [% European, % American, % Asian]
- Growth rate (YoY): [%]
```

**2. Foot Traffic Analysis**
```
Peak Hours:         [When does foot traffic peak? Lunch? Dinner? Weekends?]
Pedestrian Volume:  [Estimated pedestrians passing property daily]
BTS/Transport:      [Distance to nearest BTS, other transport accessibility]
Parking:            [Street parking, dedicated lot, nearby garage capacity]
Weather Impact:     [Rainy season impact on foot traffic, awning requirements]
```

**3. Competitive Proximity**
```
Closest Competitor:  [Name, distance, positioning]
Next 3 Competitors:  [Names, distances, combined market share estimate]
Competitive Overlap: [What % of foot traffic is shared with competitors?]
Natural Territory:   [What's your natural catchment vs competitors?]
```

**4. Property Features**
```
Square Footage:      [60-80 sqm typical for fine dining]
Ceiling Height:      [3.5m+ required for upscale feel]
Kitchen Space:       [15-20 sqm for open kitchen design]
Seating Capacity:    [25-30 seats for intimate fine dining]
Layout Feasibility:  [Can you achieve open kitchen + wine display + bar?]
Lease Terms:         [Cost, duration, renewal options]
```

**5. Zoning & Regulatory**
```
Zoning Classification: [Commercial, mixed-use, etc.]
Operating Hours:       [Thai law allows 24-hour in premium zones; check local]
Liquor License:        [Cost, processing time, restrictions]
Health Department:     [Kitchen requirements, inspection frequency]
Staff Housing:         [Where to house European staff? Nearby options?]
```

#### Deliverable: 8_Location_Analysis.pdf
- Property photos and layout diagrams
- Demographic heat map (shows 85% European concentration)
- Foot traffic timeline (peak hours, daily patterns)
- Competitive proximity map (5km radius with competitors marked)
- Zoning & regulatory checklist
- Risk assessment (weather, foot traffic seasonality, competing venues)

---

### MODULE 7: Business Simulation (Year 1 Financials)
**Goal**: Project P&L, cash flow, and break-even timeline

#### Revenue Model
```
Formula: (Average Check Size) × (Covers per Day) × (Operating Days) × (12 Months)

Conservative:
- Avg Check: 1,300 THB (fine dining standard)
- Covers/Day: 25 (2 seatings × 12.5 people, realistic for starting)
- Operating Days: 25/month (1-2 days closed for inventory, 0 major holidays yr1)
- Months: 12
→ Annual Revenue: 1,300 × 25 × 25 × 12 = 9.75M THB → Monthly avg: 812k THB

Optimistic (with wine bar growth):
- Avg Check: 1,650 THB (+22% from wine program and bar sales)
- Covers/Day: 30 (3 seatings, wine bar walk-ins)
- Operating Days: 25/month
- Months: 12
→ Annual Revenue: 1,650 × 30 × 25 × 12 = 14.85M THB → Monthly avg: 1.24M THB

Aggressive (wine bar becomes 30% of revenue):
- Restaurant: 1,400 avg check, 25 covers
- Wine Bar: 600 avg check, 20 covers (separate counting)
→ Total Revenue: 1.98M THB/month → 23.76M THB/year
```

#### Cost of Goods Sold (COGS)
```
Fine Dining COGS: 28-35%
- Proteins (fish, meat): 12-15%
- Produce & sides: 8-10%
- Wine cost of goods: 6-8% (wine sold at 300-400% markup, lower COGS %)
- Kitchen waste, spoilage: 2%

By Pillar:
- Fine Dining: 30% COGS (proteins, execution complexity)
- Spanish: 28% COGS (tapas, small plates, lower waste)
- Wine Bar: 22% COGS (wine markups are 300-400%, wine COGS only 20-25% of revenue)

Blended (conservative): 30% → 0.30 × 1M THB = 300k/month
Blended (optimistic): 28% → 0.28 × 1.65M THB = 462k/month
```

#### Operating Expenses
```
Labor:
- Head Chef: 80-120k/month
- Sous Chef: 40-60k/month
- Kitchen Staff (3): 30k each = 90k/month
- Server Staff (4): 20k each + tips = 100k/month (70k salary + 30k expected tips)
- Sommelier: 50-70k/month
- Manager: 40-60k/month
- Support (cleaning, dishwashing): 50k/month
→ Total Labor: 490-600k/month (40-45% of revenue)
Conservative model: 25% labor, ~250k/month
Optimistic model: 23% labor, 380k/month

Rent: 250-350k/month (fixed, premium Sukhumvit location)

Utilities:
- Electricity: 15k/month (open kitchen = high usage)
- Water: 3k/month
- Gas: 5k/month
→ Total: 23k/month

Marketing & Admin:
- Google Ads: 10k/month
- Social Media: 5k/month
- Accounting: 5k/month
- Licenses & Insurance: 10k/month
→ Total: 30k/month

Supplies & Miscellaneous:
- Linen, uniforms: 10k/month
- POS system, tech: 8k/month
- Maintenance, repairs: 12k/month
→ Total: 30k/month

Total OpEx (excl. COGS): ~300-400k/month
```

#### P&L Summary

**Conservative Model (Year 1)**
```
Revenue:                 812k/month × 12 = 9.75M THB
COGS (30%):             300k/month × 12 = 3.6M THB
Gross Profit:                            = 6.15M THB (63% margin)

Operating Expenses:
- Labor (25%):          250k × 12 = 3.0M THB
- Rent:                 300k × 12 = 3.6M THB
- Utilities:             23k × 12 = 276k
- Marketing:             30k × 12 = 360k
- Supplies:              30k × 12 = 360k
Total OpEx:                         = 7.596M THB

EBIT (Operating Profit):            = -1.446M THB ❌ (Loss)
Break-even month:       Month 12-13 (by month 12, cumulative covers past break-even)
```

**Optimistic Model (Year 1, with Wine Bar Integration)**
```
Revenue:                1.65M/month × 12 = 19.8M THB
COGS (28%):             462k/month × 12 = 5.5M THB
Gross Profit:                           = 14.3M THB (72% margin, wine lift)

Operating Expenses:
- Labor (23%):          380k × 12 = 4.56M THB
- Rent:                 300k × 12 = 3.6M THB
- Utilities:             28k × 12 = 336k
- Marketing:             35k × 12 = 420k
- Supplies:              35k × 12 = 420k
Total OpEx:                        = 9.336M THB

EBIT (Operating Profit):           = 4.964M THB ✅ (Profit)
Break-even month:       Month 6-7 (wine program drives rapid profitability)
Annual IRR:             18-22% (depending on startup costs, financed debt)
```

#### Deliverable: 9_Business_Simulation.pdf
- 12-month revenue projection (month-by-month)
- Cumulative P&L (shows when break-even is reached)
- Sensitivity analysis (what if avg check is 15% lower? What if covers are 20% higher?)
- Cash flow forecast (accounting for deposit, initial inventory, FF&E)
- ROI timeline (how long to recoup initial investment?)
- Assumption documentation (avg check, covers, COGS %, OpEx allocation rationale)

---

### MODULE 8: Venue Design Guide
**Goal**: Physical space layout, equipment, aesthetic recommendations

#### Space Planning (60 sqm example)
```
Total Space: 60 sqm

Dining Room: 30 sqm
- Seating: 25-26 seats (6 tables of 4, 1 table of 2)
- Per-seat space: 1.2-1.5 sqm (fine dining standard)
- Ceiling: 3.5m+ (chandelier, sense of space)
- Flooring: Polished concrete or light marble (upscale, easy to clean)

Open Kitchen: 12 sqm
- Chef position visible from 80% of dining
- 2-3 meter counter height, stainless steel
- Display: wine bottles, ingredient showcase
- Equipment: Induction cooktop (silent, safe), compact ovens, prep tables

Bar/Wine Area: 8 sqm
- Bar seating: 4-6 seats (wine program customer gathering)
- Wine display: 150+ bottles visible (temperature-controlled racks)
- POS, payment, reservation system

Restroom: 4 sqm
- Upscale finishes (marble sinks, mood lighting)
- Accessibility compliance

Storage/Support: 6 sqm
- Dry storage (climate controlled for wine)
- Coat closet
- Cleaning supplies
```

#### Design Aesthetics (3-Pillar Positioning)
```
FINE DINING BASE:
- Color palette: Neutral (white, cream, black accents)
- Lighting: Dim, warm (candlelit ambiance)
- Decor: Minimalist, European elegance
- Music: Low-volume background (piano, ambient European)

SPANISH INFLUENCE:
- Accent colors: Deep reds, golds (tapestry, artwork)
- Textiles: Spanish tiles, wrought iron accents
- Art: Spanish artwork, maps (regions of origin for wines/dishes)

WINE BAR ELEMENT:
- Feature lighting on wine display (LED accent lighting on bottles)
- Open kitchen visible (theatrical cooking, chef-as-performer)
- Communal elements (standing bar, high-top tables for wine conversations)
```

#### Equipment List (Open Kitchen Focus)
```
Cooking Equipment:
- Induction cooktop (silent, temperature-precise for delicate dishes)
- Convection oven (for roasting, bread if offering)
- Blast chiller (for plate finishing, ice cream)
- Salamander (broiler for finishing plating)
- Immersion circulator (sous-vide for consistency)

Plating & Service:
- Warming drawer (keep plated dishes at 65°C until service)
- Pass station with ticket system
- Speed rail (bottles at arm's reach for wine by glass)
- Coffee/espresso machine (quality end-of-meal experience)

Wine Program:
- Wine cooler: 150-200 bottle capacity, multi-zone temp control
- Wine glass racking (easy access during service)
- Wine preservation system (Coravin for by-the-glass program)
```

#### Deliverable: 10_Venue_Design_Guide.pdf
- Floor plan (60 sqm layout, customer flow, fire exits)
- 3D renderings or design mood board (open kitchen, wine display, ambiance)
- Materials & finishes schedule (flooring, wall colors, lighting specs)
- Capacity & safety compliance (fire code, accessibility, kitchen ventilation)
- Equipment list with supplier recommendations & cost estimates
- Timeline (design → construction → equipment installation → soft opening)

---

### MODULE 9: Investor Pitch Deck
**Goal**: 9-slide executive summary (10-minute presentation)

#### Slide Structure
```
1. COVER SLIDE
   - Restaurant Name: Destin Bangkok
   - Positioning: "Authentic Spanish Fine Dining + Premium Wine Bar"
   - Tagline: "European Service. Spanish Soul. Wine Mastery."
   - Location: 6th Avenue, Sukhumvit, Bangkok

2. THE OPPORTUNITY
   - 3 pillars with search volumes & growth rates
   - Market gap: Spanish underserved (+22% growth, only 3 competitors)
   - TAM (Total Addressable Market): 2,850 searches/month fine dining + wine bar

3. COMPETITIVE POSITIONING
   - Competitive positioning chart (Bisou, Cyrano, Chenin, Destin)
   - Destin advantages: Wine expertise, generous portions, Spanish authenticity
   - Chenin opportunity: Portions too small (27% complaints) → Destin solves this

4. THE LOCATION
   - Map showing 5km radius, competitors, foot traffic density
   - 6th Avenue: 85% European expat demographic, 300m to BTS
   - Area growth: +14% YoY (emerging premium zone)

5. BUSINESS MODEL
   - Revenue model: Fine dining (70%) + Wine bar (30%)
   - Unit economics: 1,300-1,650 THB avg check, 25-30 covers/day, 28-30% COGS
   - Margin: 60%+ gross margin, 25%+ operating margin (with wine uplift)

6. FINANCIAL PROJECTIONS
   - Year 1 conservative: 9.75M THB revenue, Month 12 break-even
   - Year 1 optimistic: 19.8M THB revenue, Month 6 break-even
   - 3-year projection: Break-even month 6-7 → 5-6M THB net income/year by year 3

7. GO/NO-GO VERDICT
   - PMF Score: 8.1/10
   - Decision: FULL GO ✅
   - Risk level: MODERATE (proven market, differentiated positioning)

8. CRITICAL SUCCESS FACTORS
   - #1: Wine program expertise (Sommelier hire, 150+ curated wines)
   - #2: Generous portions (addressing Chenin complaint, portion excellence)
   - #3: European service standards (hiring European trained staff)
   - #4: Authentic Spanish + wine-forward menu (not fusion)
   - #5: Open kitchen design (visible cooking, customer engagement)

9. NEXT STEPS & INVESTMENT ASK
   - Timeline: 6 months to soft opening
   - Investment needed: 5-7M THB (FF&E, initial inventory, working capital)
   - Use of funds: Kitchen equipment, wine procurement, staff training, marketing
   - Expected ROI: 18-22% IRR, break-even month 6-7, positive cash flow by month 8
```

#### Slide Design Guidelines
```
- Font: Calibri or Arial (readable, no special Unicode)
- Color scheme: Neutral base (white/cream) with Spanish accents (deep red, gold)
- Charts: 2-3 per deck (positioning plot, revenue projection, PMF scorecard)
- Images: High-quality photos of competitors, location, wine bottles
- Data visualization: Avoid jargon, use simple charts (bars, trends, comparisons)
- Animations: Minimal (bullets appear one-by-one for presenter control)
```

#### Deliverable: 1_Presentation.pptx
- 9 slides, portrait A4 format (8.27" × 11.69")
- 10-minute talk track (150-200 words per slide)
- Export to PDF as backup
- Speaker notes on each slide (talking points, data sources)

---

### MODULE 10: Real Estate Scouting & Agent Network
**Goal**: Identify 20 real estate agents with location availability

#### Agent Selection Criteria
```
1. Specialization: Commercial real estate (restaurant spaces)
2. Territory: Sukhumvit area (Thonglor, Emporium, Promenade, etc.)
3. Track Record: 5+ restaurant/hospitality leases in past 2 years
4. Responsiveness: Email reply within 24 hours
5. Network: Access to off-market or soon-to-list premium spaces
```

#### Agent Data Fields
```
Rank | Priority | Agent Name | Agency | Phone | Email | Specialization | Availability | Why Contact | What to Ask | Notes
1    | HIGH    | [Name]     | [Agency] | ...  | ...   | Restaurant      | Multiple     | Known deals | Current list | Track record
```

#### Priority Ranking
```
🟢 GREEN (HIGH):    Agents with 3+ known restaurant deals, proven responsiveness
🟡 GOLD (MEDIUM):   Agents with 1-2 restaurant deals, mixed responsiveness
🔴 RED (LOW):       Agents without track record but have Sukhumvit coverage
```

#### Cold-Call Script (included as tab)
```
"Hi [Agent Name], my name is [Your Name]. I'm opening an upscale Spanish fine dining 
restaurant + wine bar in the Sukhumvit area, targeting European expats. I'm looking for 
60-80 sqm spaces with high foot traffic, ideally near BTS stations (Thonglor, Emporium, 
Promenade areas). Do you have any current listings or upcoming opportunities? I need 
lease terms around 250-350k/month, 3-5 year initial term."

Key Questions:
1. "Do you have any restaurant spaces currently available in my target area?"
2. "What spaces are coming to market in the next 30-60 days?"
3. "What are typical lease terms for premium Sukhumvit spaces?"
4. "Have you successfully leased space to other fine dining restaurants?"
5. "What's your timeline to arrange a property showing?"
```

#### Deliverable: 11_Real_Estate_Agents.xlsx
- 20 agents with contact info, specialization, priority ranking
- Color-coded by priority (green/gold/red)
- Call script & talking points
- Tracking tab (called on [date], response [yes/no], follow-up scheduled [date])
- Zone guide (map of Sukhumvit with agent territory coverage)

---

## Data Sources & Verification

### Verified Data (Apify-Backed)
```
Competitors:    Google Maps Scraper
  ✅ Real competitor names, ratings, reviews counts
  ✅ Address, phone, hours
  ⚠️  Rating can fluctuate; screenshot for backup
  
Reviews:        Google Maps Scraper (reviews export)
  ✅ Real customer feedback, sentiment indicators
  ✅ Date-tagged, filterable by rating
  ⚠️  Some reviews deleted by Google; capture screenshots
  
Keywords:       Google Trends + Google Keyword Planner
  ✅ Monthly search volume (data from millions of searches)
  ✅ YoY growth rate (Google's trending data)
  ⚠️  Volume is approximate range (±20% margin)
```

### Synthesis & Analysis (NOT Apify)
```
Hot Items:      Extracted from reviews + Google Trends
  ✅ Based on verified data (review frequency + trends)
  ⚠️  Ranked by frequency, not guaranteed universal truth
  
Positioning:    Expert analysis of competitor gaps + customer desires
  ✅ Based on data (ratings, reviews, search trends)
  ⚠️  Subjective interpretation; may vary by business expert
  
Financial Model: Industry benchmarks + unit economics
  ✅ Based on real-world fine dining margins & COGS
  ⚠️  Estimates; actual will vary by execution
```

### Data Quality Checklist
```
☑ Competitor list: Screenshot Google Maps to verify at least 3 competitors
☑ Reviews: Verify review count on Google Maps matches our extract
☑ Keyword volume: Cross-reference Google Trends with Keyword Planner
☑ Location data: Confirm BTS distance using Google Maps distance tool
☑ Financials: Benchmark COGS against 2-3 known fine dining restaurants
☑ Avoid: Apify/API/MCP/scraper mentions in client-facing files
```

---

## Analysis Framework

### 5-Pillar Scoring Methodology
1. **Demand**: Size + growth + trend direction
2. **Competition**: Count + quality + saturation ratio
3. **Location**: Foot traffic + demographics + accessibility
4. **Audience**: Size + purchasing power + premium willingness
5. **Revenue**: Unit economics + margin + break-even timeline

### Decision Framework
```
Score ≥ 8.5:  FULL GO — High confidence launch
Score 5.5-8.4: SELECTIVE GO — Launch with differentiation focus
Score < 5.5:   NO-GO — Pivot or pause concept
```

### Risk Assessment Template
```
Risk               | Probability | Impact | Mitigation
Chef turnover      | Medium      | High   | Hire 2-3 trained chefs, develop IP/recipes
Food cost inflation | High        | Medium | Lock 6-month supplier contracts
Slow customer acquisition | Medium | High | Marketing budget allocation, wine program
Visa issues (staff) | Low        | High   | Hire EU passport holders, work permits early
Weather seasonality | Low        | Medium | Wine bar reduces weather dependence
```

---

## Deliverables & File Format

### File Naming Convention
```
1_Presentation_{Business}_{City}.pptx          ← Show client first
2_Final_Verdict_{Business}_{City}.pdf           ← Executive decision
3_Market_Research_Workbook_{Business}_{City}.xlsx
4_Competitors_Data.csv/xlsx
5_Keywords_Data.csv/xlsx
6_Review_Mentions_Data.csv/xlsx
7_Google_Trends_Data.csv/xlsx
8_Location_Analysis_{Address}.pdf               ← Only if property given
9_Business_Simulation_{Business}_{City}.pdf
10_Venue_Design_Guide_{Address}.pdf             ← Only if property given
11_Real_Estate_Agents_{City}.xlsx
```

### Excel Formatting Standards
```
Header Row:         Frozen (panes at row 1 or 2)
Color Scheme:       Color-coded by pillar (Fine Dining blue, Wine Bar gold, Spanish red)
Borders:            All cells bordered for clarity
Column Width:       Auto-adjusted (approximate, loop through cells)
Data Validation:    Dropdowns for status fields (HIGH/MEDIUM/LOW priority)
Number Format:      Currency (THB), percentages (%), integers (searches)
Charts:             Embedded bar charts showing key comparisons
```

### PDF Generation Best Practices
```
✅ Use ReportLab (Python) for programmatic generation
✅ Table cells: Use Paragraph(text, style) — never plain strings
✅ colWidths: Explicit (sum must equal document width ~468pt for A4)
✅ No Thai/Japanese/Korean/Arabic — renders as black boxes
✅ QA: Verify with pdfplumber after generation (no clipped text, no blank pages)
✗ Avoid: LibreOffice soffice dependency (compute formulas in Python)
```

---

## QA Checklist

Before delivering files to client:

### Data Integrity
- [ ] Competitor list: Verified against Google Maps (at least 3 spot-checks)
- [ ] Review count: Confirmed on Google Maps matches our extraction
- [ ] Keyword volume: Cross-referenced with Google Trends trending direction
- [ ] No Apify mentions: Search all files for "Apify", "API", "MCP", "scraper", "crawler" → 0 hits
- [ ] No internal notes: Remove comments like "TODO", "FIXME", "draft"

### File Format
- [ ] All CSVs converted to XLSX (better visual design)
- [ ] All PDFs checked with pdfplumber (no clipped text, no overflow)
- [ ] All PPTX slides use standard fonts only (Calibri, Arial, Helvetica)
- [ ] Excel files have frozen panes, color-coded headers, borders
- [ ] File names follow convention (1_Presentation.pptx, 2_Final_Verdict.pdf, etc.)

### Content Accuracy
- [ ] PMF score calculation: Verified weighted formula (0.25+0.25+0.20+0.15+0.15 = 1.0)
- [ ] GO/NO-GO decision: Matches score threshold (FULL GO ≥ 8.5)
- [ ] Financial model: COGS, labor, rent all realistic (benchmarked against known restaurants)
- [ ] Competitive positioning: Based on real ratings/reviews (not speculation)
- [ ] Location analysis: BTS distance/foot traffic verified with Google Maps
- [ ] Recommendation: Actionable (top 3 critical success factors listed)

### Client Readiness
- [ ] Executive summary (2-3 page PDF) for quick review
- [ ] Presentation deck (9 slides) ready for investor pitch
- [ ] Excel workbook with all data integrated (not 5 separate CSVs)
- [ ] All files in output folder with correct numbering
- [ ] Delivery summary email: Folder path, file list, PMF verdict, top 5 agents

---

## Examples & Case Studies

### Case Study: Destin Bangkok (FULL GO - 8.1/10)

**Business Concept**: Authentic Spanish Fine Dining + Premium Wine Bar for European Expats
**Location**: 6th Avenue, Sukhumvit, Bangkok
**Pillars**: 
- Primary: European Fine Dining (1,850 searches/mo, +14% YoY)
- Secondary: Wine Bar (780 searches/mo, +22% YoY growth)
- Opportunity: Spanish Cuisine (420 searches/mo, only 3 competitors)

**PMF Scorecard**:
```
Demand:      8.5/10  (2,850 combined searches/month, +17% avg growth)
Competition: 7.0/10  (15 total competitors, 4.5★ avg rating, healthy not saturated)
Location:    8.5/10  (85% European demographic, BTS 300m, +14% area growth)
Audience:    8.0/10  (45,000 European expats, 1,200+ THB avg spend, premium-willing)
Revenue:     7.5/10  (1M-2.1M THB/month, 12-6 month break-even, 12-22% IRR)
TOTAL PMF:   8.1/10  → FULL GO ✅
```

**Key Insights**:
1. Spanish pillar = market gap (only 3 competitors vs 6+ French)
2. Wine bar = growth engine (+22% YoY, 300-400% margins)
3. Chenin complaint (portions small) = Destin opportunity (generous portions)
4. Premium location + target demographic = high willingness-to-pay

**Deliverables Generated**:
- 1_Presentation.pptx (9 slides, investor pitch)
- 2_Final_Verdict.pdf (8.1/10 score, FULL GO decision)
- 3_Market_Research_Workbook.xlsx (8 tabs, all data integrated)
- 4_Competitors_Data.xlsx (15 competitors, color-coded by pillar)
- 5_Keywords_Data.xlsx (50+ keywords, demand by pillar)
- 6_Review_Mentions_Data.xlsx (hot items, pain points, desires)
- 8_Location_Analysis.pdf (6th Avenue deep-dive, demographics, foot traffic)
- 9_Business_Simulation.pdf (Year 1 P&L, break-even month 6-7, 18-22% IRR)
- 10_Venue_Design_Guide.pdf (60 sqm layout, open kitchen, wine display)
- 11_Real_Estate_Agents.xlsx (20 agents, priority ranking, cold-call script)

**Timeline**: 2 weeks (modules 0-4 initial analysis, then modules 5-10 in parallel)

---

## Common Pitfalls & Solutions

### Pitfall 1: Search Radius Too Narrow
**Problem**: Using 0-3 km radius captures only closest competitors, misses real competitive landscape
**Solution**: Use standard 5km radius with 4-directional (N/S/E/W) equal division to avoid clustering bias

### Pitfall 2: Confusing Rank with Relevance
**Problem**: Treating Google Maps ranking (ad position, review count) as competitor quality
**Solution**: Score relevance by concept match (direct vs tangential) + distance + rating, independent of maps rank

### Pitfall 3: CSV Instead of XLSX
**Problem**: CSV files lack visual design, hard to present to clients
**Solution**: Always convert to XLSX with color-coding, frozen panes, borders

### Pitfall 4: Including Tool Names in Client Files
**Problem**: Mentioning "Apify", "API", "MCP", "scraper" in client-facing PDFs/PPTX
**Solution**: Use "Google Maps Data", "Google Trends", "Customer Review Analysis" instead

### Pitfall 5: Financial Model Without Benchmarking
**Problem**: Pulling COGS % from thin air without restaurant industry research
**Solution**: Benchmark against 2-3 known fine dining restaurants in same market (ask locals, call competitors)

### Pitfall 6: Separate Files vs Integrated Workbook
**Problem**: Delivering 10 separate modules instead of consolidated master sheet
**Solution**: Create one Excel workbook with 11 tabs (dashboard + 10 modules), each tab independent but linked

### Pitfall 7: Weak Positioning Recommendation
**Problem**: Saying "French fine dining" without market analysis to support it
**Solution**: Build recommendation on data (Spanish has 3 competitors, +22% growth; French has 6+, +4-8% growth)

### Pitfall 8: Ignoring "Hot Items" Gap
**Problem**: Creating competitive analysis without extracting customer desires for differentiation
**Solution**: Mine 50+ reviews per competitor to extract 10 hot items (wine program, generous portions, open kitchen, etc.)

### Pitfall 9: PMF Score Without Weighting
**Problem**: Averaging 5 pillars equally (0.20 each) instead of weighted formula
**Solution**: Use official weights: Demand 25%, Competition 25%, Location 20%, Audience 15%, Revenue 15%

### Pitfall 10: GO/NO-GO Without Confidence Interval
**Problem**: Saying "GO" without explaining what could go wrong
**Solution**: Include risk assessment (chef turnover, food cost inflation, slow acquisition) with mitigation plans

---

## Final Recommendations

### For Restaurant/Hospitality Concepts:
1. Always prioritize Location (demographics, foot traffic, transport)
2. Wine/beverage program is leverage tool (3-4x margins vs food)
3. Differentiation ≠ "different cuisine" (it's addressing customer complaints seen in reviews)
4. Service quality is competitive moat for premium positioning

### For All PMF Research:
1. Data > Intuition (score on verified metrics, not "I think so")
2. Competition ≠ Bad signal (15 competitors in 5km with 4.5★ avg = healthy market, not saturated)
3. Hot items = actionable differentiation (e.g., "generous portions" is a design spec, not a hope)
4. Break-even timeline > revenue (month 6 breakeven vs month 12 changes investor psychology)

---

## Quick Reference: Analysis Checklist

```
☐ Module 0: Business Angle (3-pillar positioning confirmed with client)
☐ Module 1: Competitor Scrape (5km radius, N/S/E/W division, 15-20 competitors)
☐ Module 2: Keyword Research (50+ keywords, monthly volume, YoY growth)
☐ Module 3: Review Mining (pain points + hot items extracted, 40%+ frequency)
☐ Module 4: Market Synthesis (8-tab workbook, all data integrated)
☐ Module 5: PMF Scoring (weighted formula, GO/NO-GO decision, confidence rationale)
☐ Module 6: Location Scouting (demographics, foot traffic, zoning, competitive proximity)
☐ Module 7: Financial Model (P&L, break-even month, IRR, sensitivity analysis)
☐ Module 8: Venue Design (60 sqm layout, equipment list, aesthetic guidelines)
☐ Module 9: Investor Pitch (9 slides, 10-minute talk, export to PDF)
☐ Module 10: Real Estate Agents (20 agents, priority ranking, cold-call script)
☐ QA: Zero "Apify" mentions in client files, all PDFs validated, file naming correct
```

---

**End of Guide**

For questions or updates, contact: troiwebz@gmail.com
Last Updated: June 4, 2026
