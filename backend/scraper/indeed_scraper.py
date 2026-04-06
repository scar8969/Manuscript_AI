from base_scraper import BaseScraper, JobData, CompanyData

class IndeedScraper(BaseScraper):
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
        elem = soup.select_one('#jobDescriptionText')
        if elem:
            return None
        title_elem = soup.select_one('.jobsearch-JobInfoHeader-title')
        if title_elem:
            return self.clean_text(title_elem.get_text())
        return None
    
    def _extract_company(self, soup):
        elem = soup.select_one('[data-testid="company-name"]')
        if elem:
            return self.clean_text(elem.get_text())
        elem = soup.select_one('.jobsearch-CompanyInfoContainer a')
        if elem:
            return self.clean_text(elem.get_text())
        return None
    
    def _extract_location(self, soup):
        elem = soup.select_one('[data-testid="job-location"]')
        if elem:
            return self.clean_text(elem.get_text())
        elem = soup.select_one('.jobsearch-CompanyInfoContainer > div:nth-child(2)')
        if elem:
            return self.clean_text(elem.get_text())
        return None
    
    def _extract_description(self, soup):
        elem = soup.select_one('#jobDescriptionText')
        if elem:
            return self.clean_text(elem.get_text())
        return None
    
    def _extract_salary(self, soup):
        elem = soup.select_one('[data-testid="salary-snippet"]')
        if elem:
            return self.clean_text(elem.get_text())
        elem = soup.select_one('.salary-snippet')
        if elem:
            return self.clean_text(elem.get_text())
        return None