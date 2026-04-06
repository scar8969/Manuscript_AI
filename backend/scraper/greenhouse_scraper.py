from base_scraper import BaseScraper, JobData, CompanyData

class GreenhouseScraper(BaseScraper):
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
        elem = soup.select_one('#content .app-title')
        if elem:
            return self.clean_text(elem.get_text())
        elem = soup.select_one('h1')
        if elem:
            return self.clean_text(elem.get_text())
        return None
    
    def _extract_company(self, soup):
        elem = soup.select_one('.company-name')
        if elem:
            return self.clean_text(elem.get_text())
        return None
    
    def _extract_location(self, soup):
        elem = soup.select_one('.location')
        if elem:
            return self.clean_text(elem.get_text())
        return None
    
    def _extract_description(self, soup):
        elem = soup.select_one('#content')
        if elem:
            return self.clean_text(elem.get_text())
        return None