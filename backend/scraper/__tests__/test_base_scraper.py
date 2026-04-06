import pytest
from base_scraper import JobData, CompanyData, BaseScraper


# Concrete subclass for testing non-abstract methods
class ConcreteScraper(BaseScraper):
    def scrape(self, url):
        return {}


class TestJobData:
    def test_default_values_are_none(self):
        job = JobData()
        assert job.title is None
        assert job.company is None
        assert job.location is None
        assert job.description is None
        assert job.salary is None
        assert job.job_type is None
        assert job.posted_date is None
        assert job.application_url is None

    def test_sets_values(self):
        job = JobData(title='Engineer', company='Acme')
        assert job.title == 'Engineer'
        assert job.company == 'Acme'

    def test_asdict(self):
        job = JobData(title='Dev')
        d = job.__dict__
        assert d['title'] == 'Dev'


class TestCompanyData:
    def test_default_values_are_none(self):
        company = CompanyData()
        assert company.name is None
        assert company.description is None
        assert company.website is None

    def test_sets_values(self):
        company = CompanyData(name='Acme', industry='Tech')
        assert company.name == 'Acme'
        assert company.industry == 'Tech'


class TestBaseScraper:
    def test_clean_text_strips_whitespace(self):
        scraper = ConcreteScraper()
        assert scraper.clean_text('  hello   world  ') == 'hello world'

    def test_clean_text_empty_string(self):
        scraper = ConcreteScraper()
        assert scraper.clean_text('') == ''

    def test_clean_text_none(self):
        scraper = ConcreteScraper()
        assert scraper.clean_text(None) == ''

    def test_clean_text_preserves_single_spaces(self):
        scraper = ConcreteScraper()
        assert scraper.clean_text('hello world') == 'hello world'

    def test_clean_text_newlines(self):
        scraper = ConcreteScraper()
        assert scraper.clean_text('line1\nline2\nline3') == 'line1 line2 line3'

    def test_clean_text_tabs(self):
        scraper = ConcreteScraper()
        assert scraper.clean_text('\t\tindented\ttext') == 'indented text'

    def test_build_result_structure(self):
        scraper = ConcreteScraper()
        job = JobData(title='Dev', company='Acme')
        company = CompanyData(name='Acme')

        result = scraper.build_result(job, company, 'https://example.com')

        assert 'job' in result
        assert 'company' in result
        assert result['source_website'] == 'https://example.com'
        assert 'scraped_at' in result
        assert result['job']['title'] == 'Dev'
        assert result['job']['company'] == 'Acme'
        assert result['company']['name'] == 'Acme'
