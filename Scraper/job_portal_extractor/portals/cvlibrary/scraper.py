import re
import time
import json
import asyncio
from datetime import datetime
from urllib.parse import urlparse

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from rapidfuzz import process

from Scraper.job_portal_extractor.utils.config import Settings
from Scraper.job_portal_extractor.utils.notification import notify_failure
from Scraper.job_portal_extractor.utils.logger import logger
from Scraper.job_portal_extractor.utils.match_company import is_company_match_above_70


BASE_URL = "https://www.cv-library.co.uk/permanent-jobs?distance=750&page={page_num}&perpage=100&posted=7&salary_annual=4&salary_annual=7&salary_annual=3&salary_annual=8&salary_annual=6&salary_annual=5"

class CVLibraryScraper:
    def __init__(self, company_list=None, max_workers=15, max_pages=None):
        self.company_list = company_list or []
        self.max_workers = max_workers
        self.max_pages = max_pages
        self.settings = Settings()
        self.browser = None
        self.context = None
        self.page = None

    async def init_browser(self):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=True)
        self.context = await self.browser.new_context(user_agent=self.settings.USER_AGENT)
        self.page = await self.context.new_page()

    async def close_browser(self):
        # Only call at the very end
        if self.page:
            await self.page.close()
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def get_total_jobs(self):
        try:
            await self.page.goto(BASE_URL.replace("&page={page_num}", ""), wait_until="domcontentloaded")
            # await self.page.wait_for_selector("div.search-nav-actions__left p", timeout=20000)
            content = await self.page.content()

            soup = BeautifulSoup(content, 'html.parser')
            total_jobs_text = soup.select_one(".search-header__results").get_text()
            match = re.search(r"of ([\d,]+) jobs", total_jobs_text)
            if match:
                total_jobs = int(match.group(1).replace(",", ""))
                print("Total Jobs Found :", total_jobs)
                return total_jobs
            return 0
        except Exception as e:
            print(f"Failed to get total jobs: {str(e)}", "get_total_jobs")
            return 0

    async def extract_description_async(self, url):
        if not url:
            return None
        try:
            await self.page.goto(url, timeout=30000)
            content = await self.page.content()
            soup = BeautifulSoup(content, 'html.parser')
            scripts = soup.find_all('script', type='application/ld+json')
            for script in scripts:
                try:
                    data = json.loads(script.string)
                    if data.get('@type') == 'JobPosting':
                        return data.get('description', None)
                except json.JSONDecodeError:
                    continue
            return None
        except Exception as e:
            logger.error(f"Failed to extract description from {url}: {e}")
            return None

    async def scrape_page_async(self, page_num):
        jobs_on_page = []
        try:
            url = BASE_URL.format(page_num=page_num)
            logger.info(f"Scraping page {page_num}...")
            await self.page.goto(url, wait_until="domcontentloaded")
            content = await self.page.content()
            soup = BeautifulSoup(content, "html.parser")
            job_cards = soup.select("ol#searchResults li.results__item")

            for job in job_cards:
                try:
                    section_element = job.find("article")
                    if not section_element:
                        continue

                    title = section_element.get("data-job-title", "")
                    company = section_element.get("data-company-name", "")
                    location = section_element.get("data-job-location", "")
                    salary = section_element.get("data-job-salary", "")
                    job_type = section_element.get("data-job-type", "")
                    date_posted = section_element.get("data-job-posted", "")
                    job_id = section_element.get("data-job-id", "")
                    industry = section_element.get("data-job-industry", "")

                    if not job_id:
                        job_id = f"{title}_{company}_{int(time.time())}"

                    job_url = f'https://www.cv-library.co.uk/job/{job_id}' if job_id else ""
                    logo_tag = job.select_one("img.job__logo")
                    company_logo = logo_tag.get("data-src", "") if logo_tag else ""

                    apply_tag = job.select_one('a.cvl-btn[href*="/apply"]')
                    base_url = "https://www.cv-library.co.uk"
                    if apply_tag and 'href' in apply_tag.attrs:
                        apply_link = apply_tag['href']
                        if apply_link.startswith('/'):
                            apply_link = base_url + apply_link

                        parsed_url = urlparse(apply_link)
                        path_parts = parsed_url.path.split('/')
                        if 'apply' in path_parts:
                            apply_index = path_parts.index('apply')
                            new_path = '/'.join(path_parts[:apply_index]) + '/'
                        else:
                            new_path = parsed_url.path
                        apply_link = f"{parsed_url.scheme}://{parsed_url.netloc}{new_path}"
                    else:
                        apply_link = job_url

                    ingestion_time = datetime.utcnow().isoformat()
                    description = None
                    if company in self.company_list:
                        description = await self.extract_description_async(apply_link)

                    posted_date_obj = self.parse_date(date_posted)

                    if not title:
                        title = "Untitled Position"
                    if not company:
                        company = "Unknown Company"
                    if '/hour' in salary.lower() or 'day' in salary.lower():
                        continue
                    if description is None:
                        continue

                    if is_company_match_above_70(company,self.company_list):
                        jobs_on_page.append({
                            "job_title": title,
                            "experience": "",
                            "salary": salary or "Not specified",
                            "location": location or "Not specified",
                            "job_type": job_type or "Not specified",
                            "url": job_url,
                            "company_name": company,
                            "description": description,
                            "posted_date": posted_date_obj,
                            "company_logo": company_logo,
                            "apply_link": apply_link,
                            "country": "UK",
                            "data_source": "cv_library",
                            "ingestion_timestamp": ingestion_time,
                            "external_job_id": job_id
                        })

                except Exception as e:
                    logger.error(f"Error parsing job on page {page_num}: {e}")

        except Exception as e:
            logger.error(f"Error scraping page {page_num}: {e}")
        return jobs_on_page

    async def get_job_listings_async(self):
        job_list = []
        start_time = time.time()
        try:
            await self.init_browser()
            total_jobs = await self.get_total_jobs()
            if total_jobs == 0:
                logger.warning("No jobs found.")
                return []

            total_pages = (total_jobs // 100) + (1 if total_jobs % 100 != 0 else 0)
            if self.max_pages and self.max_pages < total_pages:
                total_pages = self.max_pages

            for page_num in range(1, total_pages + 1):
                jobs = await self.scrape_page_async(page_num)
                if jobs:
                    job_list.extend(jobs)
                    logger.info(f"Added {len(jobs)} jobs from page {page_num}")

            logger.info(f"Scraped {len(job_list)} jobs in {time.time() - start_time:.2f} seconds")
            return job_list
        except Exception as e:
            logger.error(f"Failed in get_job_listings_async: {e}")
            notify_failure(str(e), "get_job_listings_async")
            return []
        finally:
            await self.close_browser()

    def parse_date(self, date_str):
        if not date_str or date_str.strip() == '':
            return datetime.now().date()
        formats = [
            "%d/%m/%Y",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S.%fZ",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d"
        ]
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt).date()
            except:
                continue
        logger.warning(f"Unrecognized date format: {date_str}")
        return datetime.now().date()