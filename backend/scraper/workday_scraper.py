from base_scraper import BaseScraper, JobData, CompanyData

class WorkdayScraper(BaseScraper):
    def scrape(self, url: str) -> dict:
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(url, wait_until='networkidle', timeout=30000)
                
                title = self._extract_title(page)
                company = self._extract_company(page)
                location = self._extract_location(page)
                description = self._extract_description(page)
                
                browser.close()
                
                job = JobData(
                    title=title,
                    company=company,
                    location=location,
                    description=description,
                    application_url=url
                )
                
                company_data = CompanyData(name=company)
                return self.build_result(job, company_data, url)
        except Exception as e:
            from generic_scraper import GenericScraper
            generic = GenericScraper()
            return generic.scrape(url)
    
    def _extract_title(self, page):
        try:
            return page.locator('h1').first.inner_text()
        except:
            return None
    
    def _extract_company(self, page):
        try:
            return page.locator('.company-name').first.inner_text()
        except:
            return None
    
    def _extract_location(self, page):
        try:
            return page.locator('.location').first.inner_text()
        except:
            return None
    
    def _extract_description(self, page):
        try:
            return page.locator('.job-description').inner_text()
        except:
            try:
                return page.locator('[data-automation-id="jobDescription"]').inner_text()
            except:
                return None