#!/usr/bin/env python3
"""
Claude Ideation Engine - Generates 30 content concepts in seconds
Used by: Campaign managers to kick off 30-day content calendar
Output: CSV file ready to import into Notion
"""

import anthropic
import csv
import json
from datetime import datetime, timedelta
import sys
import os

def generate_30_day_concepts(
    client_name: str,
    niche: str,
    business_type: str,
    goal: str = "Grow followers + Drive sales",
    start_date: str = None,
    competitor_insights: str = None,
    audience_data: str = None,
    budget: float = 5.0
) -> list:
    """
    Generate 30 unique content concepts using Claude Opus

    Args:
        client_name: Name of client/business (e.g., "Golf Cafe Bangkok")
        niche: Business niche (e.g., "Golf Simulator Cafe")
        business_type: Type of content (e.g., "Sports/Entertainment/F&B")
        goal: Campaign goal
        start_date: Start date for calendar (format: YYYY-MM-DD, defaults to today)
        competitor_insights: Optional competitor analysis data
        audience_data: Optional audience demographics
        budget: Daily boost budget in USD

    Returns:
        List of 30 content concepts with metadata
    """

    # Initialize Claude client
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    # Set start date
    if not start_date:
        start_date = datetime.now().strftime("%Y-%m-%d")

    # Build the prompt
    prompt = f"""You are a world-class social media strategist specializing in {niche}.

Your task: Generate 30 UNIQUE content concepts for a 30-day calendar for {client_name}.

BUSINESS CONTEXT:
- Business: {client_name}
- Niche: {niche}
- Type: {business_type}
- Goal: {goal}
- Daily Boost Budget: ${budget}
- Start Date: {start_date}

CONTENT MIX REQUIRED:
- 70% Value Bombs (educational, entertaining, build authority)
- 30% Godfather Offers (limited-time, sales-driven, urgency)
- Include 3 collaborative posts (with influencers/complementary brands)
- Include 2 UGC/testimonial posts
- Include 2 trending/community posts

COMPETITIVE CONTEXT:
{competitor_insights if competitor_insights else "Top competitors typically use problem-solution hooks, short-form video format, and time-based urgency CTAs."}

AUDIENCE INSIGHTS:
{audience_data if audience_data else "Audience is primarily young professionals aged 25-45, mobile-first, responsive to exclusive offers."}

OUTPUT FORMAT (EXACTLY):
For each day, provide ONLY this JSON format (no extra text):

{{
  "day": 1,
  "date": "2025-01-10",
  "content_type": "Value Bomb",
  "hook": "3 mistakes costing you [benefit]",
  "problem": "What pain point does this solve?",
  "solution": "Quick 3-step fix or hack",
  "cta": "Call to action (follow, comment, link)",
  "platform": "Reel/TikTok/Carousel",
  "tone": "casual/professional/playful",
  "predicted_engagement_percent": 2.5,
  "estimated_roas": null,
  "notes": "Why this concept works"
}}

Generate all 30 days. Each concept must be:
1. Unique (no repeating hooks or themes)
2. Specific to {niche} (use exact terminology)
3. Data-driven (leverage what works in this niche)
4. Actionable (creators know exactly what to build)
5. Balanced (mix value + sales throughout)

Start generating now. Output ONLY the JSON objects, one per line, no markdown, no extra text."""

    # Call Claude Opus (most intelligent model)
    print(f"🚀 Generating 30-day calendar for {client_name}...")
    print(f"   Niche: {niche}")
    print(f"   Goal: {goal}")
    print("\n⏳ Calling Claude Opus... (this takes ~30 seconds)")

    message = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=4000,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    # Parse response
    response_text = message.content[0].text
    concepts = []

    # Parse JSON objects from response
    lines = response_text.strip().split('\n')
    for line in lines:
        if line.strip().startswith('{'):
            try:
                concept = json.loads(line)
                # Calculate actual date based on day number
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                concept_date = (start_dt + timedelta(days=concept['day']-1)).strftime("%Y-%m-%d")
                concept['date'] = concept_date
                concepts.append(concept)
            except json.JSONDecodeError:
                continue

    print(f"\n✅ Generated {len(concepts)} concepts successfully!")
    return concepts


def save_to_csv(concepts: list, client_name: str, output_dir: str = "/Users/hemachandirank/Desktop") -> str:
    """Save concepts to CSV file"""

    filename = f"{output_dir}/{client_name.replace(' ', '_')}_30_Day_Concepts.csv"

    fieldnames = [
        'Day', 'Date', 'Content Type', 'Hook', 'Problem', 'Solution', 'CTA',
        'Platform', 'Tone', 'Predicted Engagement %', 'Est. ROAS', 'Notes'
    ]

    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for concept in concepts:
            writer.writerow({
                'Day': concept['day'],
                'Date': concept['date'],
                'Content Type': concept['content_type'],
                'Hook': concept['hook'],
                'Problem': concept['problem'],
                'Solution': concept['solution'],
                'CTA': concept['cta'],
                'Platform': concept['platform'],
                'Tone': concept['tone'],
                'Predicted Engagement %': concept.get('predicted_engagement_percent', ''),
                'Est. ROAS': concept.get('estimated_roas', ''),
                'Notes': concept.get('notes', '')
            })

    print(f"\n💾 Saved to: {filename}")
    return filename


def print_concepts_table(concepts: list, show_count: int = 5):
    """Print first N concepts in readable table format"""

    print("\n" + "="*100)
    print(f"📋 FIRST {show_count} CONCEPTS (Day 1-{show_count})")
    print("="*100)

    for concept in concepts[:show_count]:
        print(f"\n📌 DAY {concept['day']} ({concept['date']}) - {concept['content_type']}")
        print(f"   Hook: {concept['hook']}")
        print(f"   Problem: {concept['problem']}")
        print(f"   Solution: {concept['solution']}")
        print(f"   CTA: {concept['cta']}")
        print(f"   Platform: {concept['platform']} | Predicted Engagement: {concept.get('predicted_engagement_percent')}%")
        print(f"   Notes: {concept.get('notes')}")

    print("\n" + "="*100)
    print(f"✅ All {len(concepts)} concepts saved to CSV file above\n")


# USAGE EXAMPLE
if __name__ == "__main__":

    # Example 1: Golf Cafe (used in MVP testing)
    concepts = generate_30_day_concepts(
        client_name="Golf Cafe Bangkok",
        niche="Golf Simulator Cafe",
        business_type="Entertainment/F&B",
        goal="Grow followers (target: 5-15% monthly growth) + Drive sales via limited-time offers",
        start_date="2025-01-10",
        competitor_insights="""
        Top competitors use:
        - Golf tip/hack format (3-5 tips per reel, 15-45 sec)
        - 'Before & After' drive distance videos
        - Limited-time promotion hooks (Buy X, get Y free)
        - 7 PM - 9 PM posting times (evening prime time)
        - Engagement rate: 2.1-3.8%
        """,
        audience_data="""
        Followers primarily:
        - Ages 25-50
        - Amateur golfers seeking quick tips
        - High disposable income
        - Motivated by exclusive deals
        - Active on TikTok & Instagram Reels
        """,
        budget=5.0
    )

    # Save to CSV
    csv_file = save_to_csv(concepts, "Golf_Cafe_Bangkok")

    # Print preview
    print_concepts_table(concepts, show_count=5)

    print("\n" + "="*100)
    print("NEXT STEPS:")
    print("1. Download the CSV file from Desktop")
    print("2. Open your Notion calendar")
    print("3. Copy-paste the concepts into the 'Hook' column")
    print("4. Assign to team members")
    print("5. Run approval workflow")
    print("="*100)
