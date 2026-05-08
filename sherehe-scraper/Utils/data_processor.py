import json
import math
from datetime import datetime, timedelta
from typing import List, Dict
from collections import defaultdict

from dataclasses import asdict


class HeatMapProcessor:
    """
    Processes scraped social media posts into heat map data
    for Sherehe-KE's "Heat" algorithm.
    """
    
    def __init__(self, decay_hours: float = 3.0):
        self.decay_hours = decay_hours
        self.venues = defaultdict(lambda: {
            "pulse_count": 0,
            "total_likes": 0,
            "recent_posts": [],
            "last_activity": None,
            "tags": set(),
            "usernames": set()
        })
    
    def process_posts(self, posts: List) -> Dict:
        """
        Convert raw posts into venue heat data.
        """
        now = datetime.now()
        
        for post in posts:
            venue = post.venue_name
            
            # Calculate decay weight (0 to 1)
            age_hours = (now - post.timestamp).total_seconds() / 3600
            if age_hours > self.decay_hours:
                continue  # Skip expired posts
            
            decay_weight = 1 - (age_hours / self.decay_hours)
            
            self.venues[venue]["pulse_count"] += 1 * decay_weight
            self.venues[venue]["total_likes"] += post.likes * decay_weight
            self.venues[venue]["recent_posts"].append({
                "username": post.username,
                "content": post.content[:100],
                "time": post.timestamp.isoformat(),
                "likes": post.likes
            })
            self.venues[venue]["last_activity"] = post.timestamp.isoformat()
            
            if post.hashtags:
                self.venues[venue]["tags"].update(post.hashtags)
            self.venues[venue]["usernames"].add(post.username)
        
        return self._format_output()
    
    def _format_output(self) -> Dict:
        """Format into Sherehe-KE API-ready JSON"""
        output = {"venues": {}, "generated_at": datetime.now().isoformat()}
        
        for venue_name, data in self.venues.items():
            pulse_count = round(data["pulse_count"])
            
            # Determine heat level per your spec
            if pulse_count >= 50:
                heat_level = 2  # "Raging"
                heat_label = "Raging"
            elif pulse_count >= 10:
                heat_level = 1  # "Hot Zone"
                heat_label = "Hot Zone"
            elif pulse_count >= 1:
                heat_level = 0  # "Active"
                heat_label = "Active"
            else:
                continue
            
            output["venues"][venue_name] = {
                "venue_name": venue_name,
                "pulse_count": pulse_count,
                "total_likes": round(data["total_likes"]),
                "heat_level": heat_level,
                "heat_label": heat_label,
                "last_activity": data["last_activity"],
                "unique_users": len(data["usernames"]),
                "tags": list(data["tags"])[:10],  # Top 10 tags
                "recent_posts": data["recent_posts"][:5]  # Last 5 posts
            }
        
        return output
    
    def save_heat_map(self, filename: str = "data/heat_map.json"):
        """Save processed heat map to file"""
        import os
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self._format_output(), f, ensure_ascii=False, indent=2)
        
        print(f"Heat map saved to {filename}")