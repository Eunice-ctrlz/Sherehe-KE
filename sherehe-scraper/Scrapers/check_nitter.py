#!/usr/bin/env python3
"""
Quick check: Which Nitter instances are working?
"""

import asyncio
import aiohttp
from bs4 import BeautifulSoup

INSTANCES = [
    "https://nitter.net",
    "https://nitter.it",
    "https://nitter.cz",
    "https://nitter.privacydev.net",
    "https://nitter.poast.org",
    "https://nitter.1d4.us",
    "https://nitter.kavin.rocks",
]

async def check_instance(session, instance):
    try:
        url = f"{instance}/search?f=tweets&q=test"
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            if resp.status == 200:
                text = await resp.text()
                soup = BeautifulSoup(text, 'html.parser')
                tweets = soup.select('.timeline-item')
                return len(tweets) if tweets else 0
            return None
    except Exception as e:
        return None

async def main():
    print("🔍 Checking Nitter instances...\n")
    
    async with aiohttp.ClientSession() as session:
        tasks = [check_instance(session, inst) for inst in INSTANCES]
        results = await asyncio.gather(*tasks)
        
        for instance, result in zip(INSTANCES, results):
            if result is None:
                print(f"❌ {instance:35} - Down")
            elif result > 0:
                print(f"✅ {instance:35} - Working ({result} tweets)")
            else:
                print(f"⚠️  {instance:35} - No tweets")
    
    print("\n💡 Use working instances in your scraper")

if __name__ == "__main__":
    asyncio.run(main())