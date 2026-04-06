from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict
from typing import Optional
import requests
from bs4 import BeautifulSoup
from datetime import datetime

@dataclass
class JobData:
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    salary: Optional[str] = None
    job_type: Optional[str] = None
    posted_date: Optional[str] = None
    application_url: Optional[str] = None

@dataclass
class CompanyData:
    name: Optional[str] = None
    description: Optional[str] = None
    size: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    logo_url: Optional[str] = None
    headquarters: Optional[str] = None

class BaseScraper(ABC):
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
    
    @abstractmethod
    def scrape(self, url: str) -> dict:
        pass
    
    def fetch_page(self, url: str, timeout: int = 30) -> BeautifulSoup:
        response = self.session.get(url, timeout=timeout)
        response.raise_for_status()
        return BeautifulSoup(response.text, 'lxml')
    
    def clean_text(self, text: str) -> str:
        if not text:
            return ''
        return ' '.join(text.split()).strip()
    
    def build_result(self, job: JobData, company: CompanyData, url: str) -> dict:
        return {
            'job': asdict(job),
            'company': asdict(company),
            'source_website': url,
            'scraped_at': datetime.utcnow().isoformat()
        }