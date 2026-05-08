import asyncio
import aiohttp
import re
import time
import random
import json
import os
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from urllib.parse import quote
from collections import Counter

from bs4 import BeautifulSoup

from Scrapers.models import Tweet, ClubPost


class NitterScraper:
    """
    Async Twitter/X scraper via Nitter + BeautifulSoup.
    Pipes directly to heat map processor.
    """
    
    def __init__(self):
        self.nitter_instances = [
            "https://nitter.net",
            "https://nitter.it",
            "https://nitter.cz",
            "https://nitter.privacydev.net",
            "https://nitter.poast.org",
            "https://nitter.1d4.us",
            "https://nitter.kavin.rocks",
        ]
        self.working_instances = []
        self.current_instance = 0
        self.failed_instances = set()
        
        self.tweets: List[Tweet] = []
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            },
            timeout=aiohttp.ClientTimeout(total=15)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def health_check(self, timeout: int = 10) -> List[str]:
        """Test which Nitter instances are alive."""
        print("🔍 Health-checking Nitter instances...\n")
        
        working = []
        tasks = [self._check_instance(inst) for inst in self.nitter_instances]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for instance, result in zip(self.nitter_instances, results):
            if isinstance(result, Exception):
                print(f"  ❌ {instance:35} - Error: {str(result)[:50]}")
                self.failed_instances.add(instance)
            elif result:
                working.append(instance)
                print(f"  ✅ {instance:35} - Working ({result} tweets)")
            else:
                print(f"  ⚠️  {instance:35} - No tweets")
        
        self.working_instances = working
        print(f"\n📊 Working instances: {len(working)}/{len(self.nitter_instances)}")
        
        if not working:
            print("⚠️  WARNING: No working Nitter instances!")
        
        return working
    
    async def _check_instance(self, instance: str) -> Optional[int]:
        """Check single instance. Returns tweet count or None."""
        try:
            url = f"{instance}/search?f=tweets&q=test"
            async with self.session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status == 200:
                    text = await resp.text()
                    soup = BeautifulSoup(text, 'html.parser')
                    tweets = soup.select('.timeline-item')
                    return len(tweets) if tweets else None
                return None
        except Exception as e:
            raise e
    
    def _get_instance(self) -> str:
        """Get next working instance."""
        if not self.working_instances:
            raise RuntimeError("No working Nitter instances available")
        
        instance = self.working_instances[self.current_instance % len(self.working_instances)]
        self.current_instance += 1
        return instance
    
    def _parse_time(self, time_text: str) -> datetime:
        """Parse Nitter's relative time."""
        now = datetime.now()
        time_text = time_text.lower().strip()
        
        try:
            if "h" in time_text and "hour" not in time_text:
                hours = int(re.search(r'(\d+)h', time_text).group(1))
                return now - timedelta(hours=hours)
            elif "m" in time_text and "min" not in time_text:
                mins = int(re.search(r'(\d+)m', time_text).group(1))
                return now - timedelta(minutes=mins)
            elif "d" in time_text and "day" not in time_text:
                days = int(re.search(r'(\d+)d', time_text).group(1))
                return now - timedelta(days=days)
            elif "hour" in time_text:
                hours = int(re.search(r'(\d+)', time_text).group(1))
                return now - timedelta(hours=hours)
            elif "minute" in time_text:
                mins = int(re.search(r'(\d+)', time_text).group(1))
                return now - timedelta(minutes=mins)
            elif "day" in time_text:
                days = int(re.search(r'(\d+)', time_text).group(1))
                return now - timedelta(days=days)
        except (AttributeError, ValueError):
            pass
        
        return now - timedelta(hours=1)
    
    def _extract_hashtags(self, text: str) -> List[str]:
        if not text:
            return []
        return re.findall(r'#(\w+)', text)
    
    def _extract_mentions(self, text: str) -> List[str]:
        if not text:
            return []
        return re.findall(r'@(\w+)', text)
    
    async def _fetch(self, url: str, retries: int = 3) -> Optional[str]:
        """Fetch URL with retry logic."""
        for attempt in range(retries):
            try:
                async with self.session.get(url) as resp:
                    if resp.status == 200:
                        return await resp.text()
                    elif resp.status == 429:
                        await asyncio.sleep(5 * (attempt + 1))
                    else:
                        print(f"  ⚠️  Status {resp.status}")
            except Exception as e:
                print(f"  ⚠️  Attempt {attempt + 1}/{retries} failed: {str(e)[:50]}")
                await asyncio.sleep(3 * (attempt + 1))
        
        return None
    
    async def search_hashtag(self, hashtag: str, venue_name: str, max_tweets: int = 15) -> List[Tweet]:
        """Search tweets by hashtag."""
        clean_tag = hashtag.lstrip('#').lower()
        since_date = (datetime.now() - timedelta(hours=3)).strftime("%Y-%m-%d")
        
        instance = self._get_instance()
        url = f"{instance}/search?f=tweets&q=%23{quote(clean_tag)}&since={since_date}"
        
        print(f"🐦  #{clean_tag} → '{venue_name}'")
        
        html = await self._fetch(url)
        if not html:
            print(f"   ✗ Failed to fetch")
            return []
        
        soup = BeautifulSoup(html, 'html.parser')
        tweet_elements = soup.select('.timeline-item')
        
        tweets = []
        for elem in tweet_elements[:max_tweets * 2]:
            try:
                if "promoted" in elem.get("class", []):
                    continue
                
                username_elem = elem.select_one('.username')
                if not username_elem:
                    continue
                username = username_elem.get_text(strip=True)
                
                content_elem = elem.select_one('.tweet-content')
                if not content_elem:
                    continue
                content = content_elem.get_text(strip=True)
                
                time_elem = elem.select_one('a.tweet-date')
                timestamp = self._parse_time(time_elem.get_text(strip=True)) if time_elem else datetime.now()
                
                # Time filter
                age_hours = (datetime.now() - timestamp).total_seconds() / 3600
                if age_hours > 3:
                    continue
                
                # Engagement
                likes = 0
                retweets = 0
                stats = elem.select('.tweet-stat')
                for stat in stats:
                    stat_text = stat.get_text(strip=True)
                    stat_html = str(stat)
                    
                    if 'icon-heart' in stat_html or 'favorite' in stat_html:
                        match = re.search(r'([\d,]+)', stat_text)
                        if match:
                            likes = int(match.group(1).replace(',', ''))
                    elif 'icon-retweet' in stat_html:
                        match = re.search(r'([\d,]+)', stat_text)
                        if match:
                            retweets = int(match.group(1).replace(',', ''))
                
                post_url = ""
                if time_elem and time_elem.get('href'):
                    href = time_elem['href']
                    post_url = instance + href if href.startswith('/') else href
                
                has_media = bool(elem.select_one('.attachments, .tweet-media, .gallery'))
                
                tweet = Tweet(
                    venue_name=venue_name,
                    username=username,
                    timestamp=timestamp,
                    content=content,
                    likes=likes,
                    retweets=retweets,
                    hashtags=self._extract_hashtags(content),
                    mentions=self._extract_mentions(content),
                    post_url=post_url,
                    has_media=has_media
                )
                
                tweets.append(tweet)
                
                if len(tweets) >= max_tweets:
                    break
                    
            except Exception:
                continue
        
        self.tweets.extend(tweets)
        print(f"   → {len(tweets)} fresh tweets")
        return tweets
    
    async def search_keywords(self, keywords: List[str], max_per_keyword: int = 10) -> List[Tweet]:
        """Search by keywords."""
        all_tweets = []
        
        for keyword in keywords:
            since_date = (datetime.now() - timedelta(hours=3)).strftime("%Y-%m-%d")
            instance = self._get_instance()
            
            url = f"{instance}/search?f=tweets&q={quote(keyword)}&since={since_date}"
            
            print(f"🐦  '{keyword}' (keyword)")
            
            html = await self._fetch(url)
            if not html:
                continue
            
            soup = BeautifulSoup(html, 'html.parser')
            elements = soup.select('.timeline-item')
            
            keyword_tweets = []
            for elem in elements[:max_per_keyword * 2]:
                try:
                    username = elem.select_one('.username')
                    content = elem.select_one('.tweet-content')
                    time_elem = elem.select_one('a.tweet-date')
                    
                    if not all([username, content]):
                        continue
                    
                    timestamp = self._parse_time(time_elem.get_text(strip=True)) if time_elem else datetime.now()
                    
                    if datetime.now() - timestamp > timedelta(hours=3):
                        continue
                    
                    tweet = Tweet(
                        venue_name=keyword,
                        username=username.get_text(strip=True),
                        timestamp=timestamp,
                        content=content.get_text(strip=True),
                        hashtags=self._extract_hashtags(content.get_text()),
                        mentions=self._extract_mentions(content.get_text()),
                        post_url=instance + time_elem['href'] if time_elem and time_elem.get('href') else ""
                    )
                    keyword_tweets.append(tweet)
                    
                    if len(keyword_tweets) >= max_per_keyword:
                        break
                        
                except Exception:
                    continue
            
            all_tweets.extend(keyword_tweets)
            print(f"   → {len(keyword_tweets)} tweets")
            await asyncio.sleep(random.uniform(1, 3))
        
        self.tweets.extend(all_tweets)
        return all_tweets
    
    async def search_hashtags_parallel(self, hashtag_map: Dict[str, str], max_tweets: int = 10) -> List[Tweet]:
        """Search multiple hashtags in parallel (async)."""
        tasks = [
            self.search_hashtag(tag, venue, max_tweets)
            for tag, venue in hashtag_map.items()
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_tweets = []
        for result in results:
            if isinstance(result, list):
                all_tweets.extend(result)
        
        return all_tweets
    
    def get_club_posts(self) -> List[ClubPost]:
        """Convert all tweets to unified ClubPost format for heat map."""
        return [t.to_club_post() for t in self.tweets]
    
    def save(self, filename: str = "data/twitter_posts.json"):
        """Save tweets to JSON."""
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        data = [{
            "platform": t.platform,
            "venue_name": t.venue_name,
            "username": t.username,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            "content": t.content,
            "likes": t.likes,
            "retweets": t.retweets,
            "hashtags": t.hashtags,
            "mentions": t.mentions,
            "post_url": t.post_url,
            "has_media": t.has_media
        } for t in self.tweets]
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 Saved {len(self.tweets)} tweets to {filename}")
    
    def print_summary(self):
        """Print summary of scraped tweets."""
        print(f"\n{'='*60}")
        print("📊 TWITTER SUMMARY")
        print(f"{'='*60}")
        print(f"Total tweets: {len(self.tweets)}")
        
        venue_counts = Counter(t.venue_name for t in self.tweets)
        for venue, count in venue_counts.most_common(10):
            print(f"  • {venue}: {count} tweets")