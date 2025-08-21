import requests
import time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support import expected_conditions as ec

from Scraper.job_portal_extractor.utils.common_utils import html_to_text_with_breaks

API_KEY = "e46182fc-639e-432a-9a9b-60fb9ab6bd7b"
BASE_SEARCH_URL = "https://www.reed.co.uk/api/1.0/search"
BASE_JOB_URL = "https://www.reed.co.uk/api/1.0/jobs"

MAX_JOBS = 50  # Set how many jobs you want to collect
# MAX_JOBS = 5  # For Testing

from utils.notification import notify_success
from utils.supaDb import insert_jobs

from utils.config import load_company_list
from utils.match_company import is_company_match_above_70

HEADERS = {
    "User-Agent": "Thunder Client (https://www.thunderclient.com)"
}

companies_list = load_company_list()
print(len(companies_list), "Number of Companeis Loded")


def fetch_job_details(job_id):
    response = requests.get(f"{BASE_JOB_URL}/{job_id}", auth=(API_KEY, ''), headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"⚠️ Failed to fetch details for Job ID {job_id}, Status: {response.status_code}")
        return None


def transform_job(job):
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    job_url = job.get("jobUrl", "")
    external_url = job.get("externalUrl", "")

    if external_url == "https://applybe.com/integrations/reed/reedats.ashx":
        apply_link = job_url
    elif external_url:
        apply_link = external_url
    else:
        apply_link = job_url
    driver.get(job_url)
    wait = WebDriverWait(driver, 10)
    company_logo_url = ''
    try:
        img_elem = wait.until(
            ec.presence_of_element_located((By.CSS_SELECTOR, ".company-logo_jobResultLogo__LMM4u img"))
        )
        company_logo_url = img_elem.get_attribute("src")
    except Exception:
        pass

    return {
        "job_title": job.get("jobTitle", ""),
        "company_name": job.get("employerName", ""),
        "company_logo": company_logo_url,  # Not available in Reed API
        "salary": job.get("salary", None),
        "posted_date": job.get("datePosted", datetime.now().isoformat()),
        "job_id": job.get("jobId", ""),
        "experience": None,  # Not available in Reed API
        "location": job.get("locationName", None),
        "apply_link": apply_link,
        "description": html_to_text_with_breaks(job.get("jobDescription", None))
    }


def scrape_reed_jobs():
    results_to_skip = 0
    scraped_jobs = []

    while len(scraped_jobs) < 5:
        params = {
            "keywords": "",
            "distanceFromLocation": 5,
            "minimumSalary": "35000",
            "fullTime": "true",
            "permanent": "true",
            "resultsToSkip": results_to_skip
        }
        print(f"Requesting {results_to_skip / 100 + 1} Page")
        response = requests.get(BASE_SEARCH_URL, params=params, auth=(API_KEY, ''), headers=HEADERS)

        if response.status_code != 200:
            print("❌ Failed to fetch search results.")
            print(f"➡️ URL: {response.url}")
            print(f"➡️ Headers: {HEADERS}")
            print(f"➡️ Auth username: {API_KEY}, password: ''")
            print(f"➡️ Params: {params}")
            print(f"➡️ Status code: {response.status_code}")
            break

        data = response.json()
        search_results = data.get("results", [])
        total_results = data.get("totalResults", 0)

        if not search_results:
            print("✅ No more search results to process.")
            break

        for result in search_results:
            if len(scraped_jobs) >= MAX_JOBS:
                break

            job_id = result.get("jobId")
            if not job_id:
                continue
            company_name = result.get("employerName")
            score = is_company_match_above_70(company_name, companies_list)
            if (not company_name or not score):
                continue

            time.sleep(1)  # Rate limit
            detailed_job = fetch_job_details(job_id)
            if detailed_job:
                transformed_job = transform_job(detailed_job)
                scraped_jobs.append(transformed_job)

        results_to_skip += 100
        if results_to_skip >= total_results:
            break

    return scraped_jobs


if __name__ == "__main__":
    jobs = scrape_reed_jobs()
    print(f"✅ Found {len(jobs)} jobs from Reed")
    print(jobs)
    inserted, deleted = insert_jobs(jobs, data_source="reed")
    print(f"Inserted {inserted} jobs to Database")
    notify_success(f"🎉 Reed Job scraping done successfully! {inserted} jobs processed.", " Reed ")
