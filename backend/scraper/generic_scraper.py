from base_scraper import BaseScraper, JobData, CompanyData

class GenericScraper(BaseScraper):
    def scrape(self, url: str) -> dict:
        soup = self.fetch_page(url)
        
        title = self._extract_title(soup)
        company = self._extract_company(soup)
        location = self._extract_location(soup)
        description = self._extract_description(soup)
        salary = self._extract_salary(soup)
        
        job = JobData(
            title=title,
            company=company,
            location=location,
            description=description,
            salary=salary,
            application_url=url
        )
        
        company_data = CompanyData(name=company)
        
        return self.build_result(job, company_data, url)
    
    def _extract_title(self, soup):
        selectors = [
            'h1.job-title',
            'h1.title',
            'h1[data-testid="job-title"]',
            '.job-header h1',
            'h1'
        ]
        return self._extract_by_selectors(soup, selectors)
    
    def _extract_company(self, soup):
        selectors = [
            '.company-name',
            '.employer',
            '[data-testid="company-name"]',
            '.company',
            '.company-name a'
        ]
        return self._extract_by_selectors(soup, selectors)
    
    def _extract_location(self, soup):
        selectors = [
            '.location',
            '.job-location',
            '[data-testid="job-location"]',
            '.location-text'
        ]
        return self._extract_by_selectors(soup, selectors)
    
    def _extract_description(self, soup):
        selectors = [
            '.job-description',
            '.description',
            '#job-description',
            '.job-details',
            '[data-testid="job-description"]',
            'article',
            '.content'
        ]
        
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                text = elem.get_text(separator='\n', strip=True)
                if len(text) > 100:
                    return text
        
        return self._extract_largest_text_block(soup)
    
    def _extract_salary(self, soup):
        selectors = [
            '.salary',
            '.salary-range',
            '.compensation',
            '[data-testid="salary"]'
        ]
        return self._extract_by_selectors(soup, selectors)
    
    def _extract_by_selectors(self, soup, selectors):
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                text = self.clean_text(elem.get_text())
                if text:
                    return text
        return None
    
    def _extract_largest_text_block(self, soup):
        paragraphs = soup.find_all('p')
        if not paragraphs:
            divs = soup.find_all('div')
            paragraphs = [d for d in divs if len(d.get_text(strip=True)) > 50]
        
        if paragraphs:
            largest = max(paragraphs, key=lambda p: len(p.get_text(strip=True)))
            return self.clean_text(largest.get_text())
        
        return None