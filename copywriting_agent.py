#!/usr/bin/env python3
"""
Claude Copywriting Agent - Generates captions, hashtags, and CTAs
Used by: Creators to get caption options before recording
Input: Content concept (hook, problem, solution)
Output: 5 caption variations + 15 hashtags + alt-text
"""

import anthropic
import json
import csv
import os
from typing import Dict, List

def generate_captions_and_hashtags(
    hook: str,
    problem: str,
    solution: str,
    cta: str,
    content_type: str,
    platform: str,
    niche: str,
    tone: str = "casual",
    brand_name: str = "Your Brand"
) -> Dict:
    """
    Generate 5 caption variations + hashtags using Claude Sonnet

    Args:
        hook: Content hook (main angle)
        problem: Problem being solved
        solution: The solution/hack
        cta: Call to action
        content_type: "Value Bomb" or "Godfather Offer"
        platform: "Reel", "TikTok", "Carousel"
        niche: Business niche
        tone: casual/professional/playful
        brand_name: Brand/business name

    Returns:
        Dict with captions, hashtags, alt-text
    """

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    prompt = f"""You are an expert Instagram/TikTok copywriter for {niche}.

CONTENT BRIEF:
- Hook: {hook}
- Problem: {problem}
- Solution: {solution}
- CTA: {cta}
- Type: {content_type}
- Platform: {platform}
- Tone: {tone}
- Brand: {brand_name}

TASK 1: Generate 5 Caption Variations (Best to Worst)

Each caption should:
- Be 150-200 characters max (fits mobile screens)
- Use strategic emojis (2-4 per caption)
- Match the brand tone ({tone})
- Include the CTA naturally
- Be unique (different angles/hooks)

Variation 1 (BEST - Direct Hook): Hook first, benefit second
Variation 2 (Story-Driven): Tell a micro-story that leads to CTA
Variation 3 (Question Format): Ask a question that hooks engagement
Variation 4 (Emotional Appeal): Appeal to emotion (desire, fear, curiosity)
Variation 5 (Direct Benefit): Lead with the outcome/benefit

TASK 2: Generate 15 Optimal Hashtags

Requirements:
- 5 High-volume hashtags (10K-500K posts, popular)
- 5 Mid-volume hashtags (1K-10K posts, targeted)
- 5 Niche-specific hashtags (100-1K posts, laser-targeted)
- Mix: Trending + evergreen + brand-specific
- Include location hashtags if applicable (e.g., #Bangkok, #Thailand)
- All lowercase

TASK 3: Generate Alt-Text (for accessibility)

Requirements:
- 50-100 words
- Describe: What's shown, what's happening, key text overlays
- Include emoji descriptions
- Be clear for screen readers
- Help context for blind/low-vision users

OUTPUT FORMAT (JSON only, no markdown):

{{
  "captions": [
    {{"number": 1, "text": "Caption 1"}},
    {{"number": 2, "text": "Caption 2"}},
    {{"number": 3, "text": "Caption 3"}},
    {{"number": 4, "text": "Caption 4"}},
    {{"number": 5, "text": "Caption 5"}}
  ],
  "hashtags": {{
    "high_volume": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
    "mid_volume": ["#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10"],
    "niche_specific": ["#hashtag11", "#hashtag12", "#hashtag13", "#hashtag14", "#hashtag15"]
  }},
  "all_hashtags": "#hashtag1 #hashtag2 #hashtag3...",
  "alt_text": "Detailed description for accessibility..."
}}

Generate now."""

    print(f"✍️ Generating captions for: {hook}")
    print(f"   Platform: {platform} | Type: {content_type}\n")

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    # Parse response
    response_text = message.content[0].text

    try:
        # Extract JSON from response
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        json_str = response_text[start_idx:end_idx]
        result = json.loads(json_str)
        return result
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Error parsing response: {e}")
        return None


def batch_generate_captions(concepts_csv: str) -> List[Dict]:
    """
    Generate captions for multiple concepts from CSV file

    Args:
        concepts_csv: Path to CSV with concepts from Ideation Engine

    Returns:
        List of concepts with captions added
    """

    results = []

    with open(concepts_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, 1):
            print(f"\n[{idx}/30] Processing: {row['Hook'][:50]}...")

            caption_data = generate_captions_and_hashtags(
                hook=row['Hook'],
                problem=row['Problem'],
                solution=row['Solution'],
                cta=row['CTA'],
                content_type=row['Content Type'],
                platform=row['Platform'],
                niche="Golf Simulator Cafe",  # Update based on your niche
                tone=row.get('Tone', 'casual'),
                brand_name="Golf Cafe Bangkok"  # Update based on your brand
            )

            if caption_data:
                results.append({
                    'day': row['Day'],
                    'hook': row['Hook'],
                    'platform': row['Platform'],
                    'content_type': row['Content Type'],
                    'captions': caption_data.get('captions', []),
                    'hashtags': caption_data.get('all_hashtags', ''),
                    'alt_text': caption_data.get('alt_text', '')
                })

    return results


def save_captions_to_csv(caption_results: List[Dict], output_file: str = "/Users/hemachandirank/Desktop/Captions_and_Hashtags.csv"):
    """Save caption results to CSV"""

    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['Day', 'Hook', 'Platform', 'Type', 'Caption_1', 'Caption_2', 'Caption_3', 'Caption_4', 'Caption_5', 'Hashtags', 'Alt_Text']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for result in caption_results:
            captions = result.get('captions', [])
            writer.writerow({
                'Day': result['day'],
                'Hook': result['hook'],
                'Platform': result['platform'],
                'Type': result['content_type'],
                'Caption_1': captions[0]['text'] if len(captions) > 0 else '',
                'Caption_2': captions[1]['text'] if len(captions) > 1 else '',
                'Caption_3': captions[2]['text'] if len(captions) > 2 else '',
                'Caption_4': captions[3]['text'] if len(captions) > 3 else '',
                'Caption_5': captions[4]['text'] if len(captions) > 4 else '',
                'Hashtags': result['hashtags'],
                'Alt_Text': result['alt_text']
            })

    print(f"\n💾 Saved captions to: {output_file}")


def print_sample_output(caption_data: Dict):
    """Print sample caption output in readable format"""

    if not caption_data:
        return

    print("\n" + "="*80)
    print("📝 CAPTION VARIATIONS")
    print("="*80)

    for i, caption in enumerate(caption_data.get('captions', []), 1):
        print(f"\nVariation {i}:")
        print(f"  {caption['text']}")

    print("\n" + "="*80)
    print("#️⃣ HASHTAGS")
    print("="*80)

    hashtags = caption_data.get('hashtags', {})
    print(f"\n🔥 High-Volume (Popular):")
    for tag in hashtags.get('high_volume', []):
        print(f"  {tag}")

    print(f"\n📊 Mid-Volume (Targeted):")
    for tag in hashtags.get('mid_volume', []):
        print(f"  {tag}")

    print(f"\n🎯 Niche-Specific (Laser):")
    for tag in hashtags.get('niche_specific', []):
        print(f"  {tag}")

    print(f"\n📋 All Hashtags (Copy-Paste Ready):")
    print(f"  {caption_data.get('all_hashtags', '')}")

    print("\n" + "="*80)
    print("♿ ALT-TEXT (Accessibility)")
    print("="*80)
    print(f"\n{caption_data.get('alt_text', '')}")


# USAGE EXAMPLE
if __name__ == "__main__":

    print("\n" + "="*80)
    print("CLAUDE COPYWRITING AGENT - MVP TEST")
    print("="*80)

    # Example: Generate captions for a single concept
    sample_caption_data = generate_captions_and_hashtags(
        hook="3 swing mistakes costing you distance",
        problem="Amateur golfers lose 20+ yards due to poor technique",
        solution="Fix your stance, grip, and follow-through in 2 minutes",
        cta="Comment your current distance below 👇",
        content_type="Value Bomb",
        platform="Reel",
        niche="Golf Simulator Cafe",
        tone="casual",
        brand_name="Golf Cafe Bangkok"
    )

    print_sample_output(sample_caption_data)

    print("\n" + "="*80)
    print("✅ NEXT STEPS:")
    print("="*80)
    print("""
1. Use this script to generate captions for all 30 concepts
2. Creators pick their favorite caption variation
3. Copy hashtags directly to post
4. All captions ready before video recording
5. Speeds up content production by 50%
    """)
