import random
import time
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager


@dataclass
class ClubPost:
    platform: str
    venue_name: str
    username: str
    timestamp: datetime
    content: str
    likes: int
    location_tag: Optional[str] = None
    hashtags: List[str] = None
    media_url: Optional[str] = None
    post_url: Optional[str] = None


class BaseScraper:
    def __init__(self, headless: bool = True, proxy: Optional[str] = None):
        self.options = Options()
        
        # Stealth settings
        self.options.add_argument("--no-sandbox")
        self.options.add_argument("--disable-dev-shm-usage")
        self.options.add_argument("--disable-blink-features=AutomationControlled")
        self.options.add_experimental_option("excludeSwitches", ["enable-automation"])
        self.options.add_experimental_option('useAutomationExtension', False)
        
        # Random user agent rotation
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.0",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.0",
        ]
        self.options.add_argument(f"--user-agent={random.choice(self.user_agents)}")
        
        # Window size to avoid headless detection
        self.options.add_argument("--window-size=1920,1080")
        
        if headless:
            self.options.add_argument("--headless=new")  # New headless mode is less detectable
        
        if proxy:
            self.options.add_argument(f"--proxy-server={proxy}")
        
        # Disable images to speed up loading
        prefs = {
            "profile.managed_default_content_settings.images": 2,
            "profile.default_content_setting_values.notifications": 2
        }
        self.options.add_experimental_option("prefs", prefs)
        
        self.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=self.options
        )
        
        # Execute CDP commands to hide webdriver
        self.driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': '''
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5]
                });
                window.chrome = { runtime: {} };
            '''
        })
        
        self.wait = WebDriverWait(self.driver, 15)
        self.posts: List[ClubPost] = []
    
    def human_like_scroll(self, scrolls: int = 3, min_delay: float = 1.5, max_delay: float = 3.5):
        """Scroll with random delays and varying distances to mimic human behavior"""
        for i in range(scrolls):
            scroll_amount = random.randint(300, 800)
            self.driver.execute_script(f"window.scrollBy(0, {scroll_amount});")
            time.sleep(random.uniform(min_delay, max_delay))
            
            # Occasionally scroll back up a bit (human behavior)
            if random.random() < 0.2:
                self.driver.execute_script(f"window.scrollBy(0, -{random.randint(100, 250)});")
                time.sleep(random.uniform(0.5, 1.2))
    
    def random_delay(self, min_sec: float = 2.0, max_sec: float = 5.0):
        """Random delay between actions"""
        time.sleep(random.uniform(min_sec, max_sec))
    
    def save_posts(self, filename: str = None):
        """Save scraped posts to JSON"""
        if not filename:
            filename = f"data/{self.__class__.__name__}_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
        
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        data = [{
            "platform": p.platform,
            "venue_name": p.venue_name,
            "username": p.username,
            "timestamp": p.timestamp.isoformat(),
            "content": p.content,
            "likes": p.likes,
            "location_tag": p.location_tag,
            "hashtags": p.hashtags,
            "media_url": p.media_url,
            "post_url": p.post_url
        } for p in self.posts]
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Saved {len(self.posts)} posts to {filename}")
        return filename
    
    def close(self):
        self.driver.quit()