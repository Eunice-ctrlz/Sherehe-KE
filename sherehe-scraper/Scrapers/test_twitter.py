#!/usr/bin/env python3
"""
Standalone Twitter/X scraper test.
"""

import asyncio
from scrapers.twitter_nitter import NitterScraper


async def test():
    print("=" * 60)
    print("🐦 Twitter/X Async Scraper Test")
    print("=" * 60)
    
    async with NitterScraper() as scraper:
        # Health check
        working = await scraper.health_check()
        
        if not working:
            print("\n❌ No working instances. Exiting.")
            return
        
        # Test hashtags
        test_tags = {
            "nairobinightlife": "General Nairobi",
            "sherehe": "General Nairobi",
        }
        
        print(f"\n{'='*60}")
        print("Testing hashtag search...")
        print(f"{'='*60}")
        
        for tag, venue in test_tags.items():
            tweets = await scraper.search_hashtag(tag, venue, max_tweets=5)
            if tweets:
                print(f"\n✅ #{tag}: {len(tweets)} tweets")
                for t in tweets[:2]:
                    print(f"   @{t.username}: {t.content[:60]}...")
            else:
                print(f"\n⚠️  #{tag}: No tweets")
        
        # Save
        scraper.save("data/twitter_test.json")
        scraper.print_summary()


if __name__ == "__main__":
    asyncio.run(test())