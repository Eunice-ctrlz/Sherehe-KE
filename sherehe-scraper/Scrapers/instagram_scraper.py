"""
Instagram scraper placeholder.
For now, Twitter/Nitter provides sufficient data for heat maps.
Instagram can be added later with undetected-chromedriver.
"""

from typing import List
from Scrapers.models import ClubPost


class InstagramScraper:
    """Placeholder - returns empty list for now."""
    
    def __init__(self, headless: bool = True):
        pass
    
    def scrape_hashtags(self, hashtag_map: dict, max_per_tag: int = 20) -> List[ClubPost]:
        print("📸 Instagram scraper not yet implemented. Using Twitter data only.")
        return []
    
    def close(self):
        pass