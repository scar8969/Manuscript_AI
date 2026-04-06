import pytest
from main import detect_site


class TestDetectSite:
    def test_detects_linkedin(self):
        assert detect_site('https://www.linkedin.com/jobs/view/123') == 'linkedin'

    def test_detects_indeed(self):
        assert detect_site('https://www.indeed.com/viewjob?jk=abc') == 'indeed'

    def test_detects_greenhouse(self):
        assert detect_site('https://boards.greenhouse.io/company/job/123') == 'greenhouse'

    def test_detects_lever(self):
        assert detect_site('https://jobs.lever.co/company/abc') == 'lever'

    def test_detects_workday(self):
        assert detect_site('https://workday.com/job/123') == 'workday'

    def test_falls_back_to_generic(self):
        assert detect_site('https://example.com/careers/job') == 'generic'

    def test_linkedin_non_job_page_is_generic(self):
        assert detect_site('https://www.linkedin.com/in/someone') == 'generic'

    def test_case_insensitive_domain(self):
        assert detect_site('https://INDEED.com/job') == 'indeed'
        assert detect_site('https://GreenHouse.io/board/job') == 'greenhouse'
