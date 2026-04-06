from base_scraper import BaseScraper, JobData, CompanyData

class LeverScraper(BaseScraper):
    def scrape(self, url: str) -> dict:
        soup = self.fetch_page(url)
        
        title = self._extract_title(soup)
        company = self._extract_company(soup)
        location = self._extract_location(soup)
        description = self._extract_description(soup)
        
        job = JobData(
            title=title,
            company=company,
            location=location,
            description=description,
            application_url=url
        )
        
        company_data = CompanyData(name=company)
        return self.build_result(job, company_data, url)
    
    def _extract_title(self, soup):
        elem = soup.select_one('.posting-headline')
        if elem:
            h1 = elem.select_one('h1')
            if h1:
                return self.clean_text(h1.get_text())
        return None
    
    def _extract_company(self, soup):
        elem = soup.select_one('.posting-header-secondary')
        if elem:
            return self.clean_text(elem.get_text())
        return None
    
    def _extract_location(self, soup):
        elem = soup.select_one('.posting-location')
        if elem:
            return self.clean_text(elem.get_text())
        return None
    
    def _extract_description(self, soup):
        sections = soup.select('.section-wrapper')
        text_parts = []
        for section in sections:
            text_parts.append(section.get_text(separator='\n', strip=True))
        if text_parts:
            return '\n\n'.join(text_parts)
        return None