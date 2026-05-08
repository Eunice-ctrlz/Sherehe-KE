#!/usr/bin/env python3
"""
Sherehe-KE Social Media Scraper
Async Twitter/X via Nitter + Heat Map Processor
"""

import asyncio
from datetime import datetime

from Scrapers.twitter_scraper import NitterScraper
from Scrapers.instagram_scraper import InstagramScraper
from Utils.data_processor import HeatMapProcessor
from config import TWITTER_HASHTAGS, TWITTER_KEYWORDS, SETTINGS


async def scrape_twitter():
    """Scrape Twitter/X via Nitter."""
    print(f"\n{'='*60}")
    print("🐦 Twitter/X: Starting async scrape...")
    print(f"{'='*60}")
    
    async with NitterScraper() as scraper:
        # Health check
        working = await scraper.health_check()
        
        if not working:
            print("⚠️  No working Nitter instances. Skipping Twitter.")
            return []
        
        # Search hashtags in parallel (async)
        print(f"\n{'='*60}")
        print("🔍 Searching hashtags (parallel)...")
        print(f"{'='*60}")
        
        hashtag_tweets = await scraper.search_hashtags_parallel(
            TWITTER_HASHTAGS, 
            max_tweets=SETTINGS["max_tweets_per_hashtag"]
        )
        
        # Search keywords sequentially
        print(f"\n{'='*60}")
        print("🔍 Searching keywords...")
        print(f"{'='*60}")
        
        keyword_tweets = await scraper.search_keywords(
            TWITTER_KEYWORDS,
            max_per_keyword=10
        )
        
        # Save raw data
        scraper.save("data/twitter_posts.json")
        scraper.print_summary()
        
        # Convert to ClubPost for heat map
        return scraper.get_club_posts()


def scrape_instagram():
    """Scrape Instagram (placeholder)."""
    print(f"\n{'='*60}")
    print("📸 Instagram: Placeholder")
    print(f"{'='*60}")
    
    ig = InstagramScraper(headless=SETTINGS["headless"])
    posts = ig.scrape_hashtags({}, max_per_tag=0)
    ig.close()
    return posts


def build_heat_map(all_posts):
    """Process all posts into heat map."""
    print(f"\n{'='*60}")
    print("🔥 Building Heat Map")
    print(f"{'='*60}")
    
    processor = HeatMapProcessor(decay_hours=SETTINGS["decay_hours"])
    heat_data = processor.process_posts(all_posts)
    processor.save_heat_map("data/heat_map.json")
    
    # Summary
    print(f"\n📊 RESULTS:")
    print(f"   Total posts: {len(all_posts)}")
    print(f"   Active venues: {len(heat_data['venues'])}")
    
    for venue, data in sorted(heat_data['venues'].items(), 
                              key=lambda x: x[1]['pulse_count'], 
                              reverse=True)[:10]:
        print(f"   • {venue}: {data['heat_label']} ({data['pulse_count']} pulses, {data['unique_users']} users)")
    
    return heat_data


async def main():
    """Main orchestrator."""
    print(f"\n{'='*60}")
    print(f"🚀 Sherehe-KE Scraper | {datetime.now()}")
    print(f"   Async Twitter via Nitter + Heat Map")
    print(f"{'='*60}")
    
    all_posts = []
    
    # Twitter (async)
    twitter_posts = await scrape_twitter()
    all_posts.extend(twitter_posts)
    
    # Instagram (sync placeholder)
    instagram_posts = scrape_instagram()
    all_posts.extend(instagram_posts)
    
    # Build heat map
    if all_posts:
        heat_map = build_heat_map(all_posts)
    else:
        print("\n⚠️  No posts scraped. Heat map empty.")
    
    print(f"\n{'='*60}")
    print("✅ Scrape complete!")
    print(f"{'='*60}")


if __name__ == "__main__":
    asyncio.run(main())