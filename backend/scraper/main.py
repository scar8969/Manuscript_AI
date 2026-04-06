import sys
import json
from urllib.parse import urlparse

from generic_scraper import GenericScraper
from linkedin_scraper import LinkedInScraper
from indeed_scraper import IndeedScraper
from greenhouse_scraper import GreenhouseScraper
from lever_scraper import LeverScraper
from workday_scraper import WorkdayScraper

def detect_site(url):
    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    
    if 'linkedin.com' in domain and '/jobs/' in url:
        return 'linkedin'
    elif 'indeed.com' in domain:
        return 'indeed'
    elif 'greenhouse.io' in domain:
        return 'greenhouse'
    elif 'lever.co' in domain:
        return 'lever'
    elif 'workday.com' in domain:
        return 'workday'
    else:
        return 'generic'

def scrape(url):
    site = detect_site(url)
    
    scrapers = {
        'linkedin': LinkedInScraper,
        'indeed': IndeedScraper,
        'greenhouse': GreenhouseScraper,
        'lever': LeverScraper,
        'workday': WorkdayScraper,
        'generic': GenericScraper
    }
    
    scraper_class = scrapers.get(site, GenericScraper)
    scraper = scraper_class()
    
    return scraper.scrape(url)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No URL provided'}))
        sys.exit(1)
    
    url = sys.argv[1]
    
    try:
        result = scrape(url)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)