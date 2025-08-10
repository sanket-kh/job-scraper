import datetime
import time
import json
from playwright.sync_api import sync_playwright

from utils.notification import notify_success
from utils.supaDb import  insert_jobs

BASE_URL = "https://www.reed.co.uk/jobs"
MAX_PAGES = 999  # You can change this


def scrape_reed_jobs(max_pages=1):
    all_jobs = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        for page_num in range(1, max_pages + 1):
            url = f"{BASE_URL}?pageno={page_num}"
            print(f"Scraping: {url}")
            page.goto(url, timeout=60000)
            page.wait_for_selector('article[data-qa="job-card"]', timeout=15000)

            job_cards = page.query_selector_all('article[data-qa="job-card"]')
            print(f"Found {len(job_cards)} jobs on page {page_num}")
            if(not len(job_cards)>0):
                break;

            for card in job_cards:
                try:
                    # Title and apply link
                    title_elem = card.query_selector('h2 a[data-qa="job-card-title"]')
                    title = title_elem.inner_text().strip() if title_elem else None
                    link = title_elem.get_attribute("href") if title_elem else None
                    apply_link = f"https://www.reed.co.uk{link}" if link else None
                    # TODO : Apply Link has to be fetched by clicking the Card, and selecting Apply
                    # Two Types easy apply and Redirect Apply

                    # Company name
                    company_elem = card.query_selector('a.gtmJobListingPostedBy')
                    company = company_elem.inner_text().strip() if company_elem else None

                    # Location
                    location_elem = card.query_selector('li[data-qa="job-card-location"]')
                    location = location_elem.inner_text().strip() if location_elem else None

                    # Salary
                    salary_elem = card.query_selector('li:has(svg[aria-labelledby="title-salary"])')
                    salary = salary_elem.inner_text().strip() if salary_elem else "Not specified"

                    # Posted date (e.g., "3 days ago")
                    posted_elem = card.query_selector('div[class*="postedBy"]')
                    posted_date = posted_elem.inner_text().strip() if posted_elem else None

                    # Logo (if any)
                    logo_elem = card.query_selector('img[data-qa="company-logo-image"]')
                    logo = logo_elem.get_attribute("src") if logo_elem else None

                    job = {
                        'title': title,
                        'company': company,
                        'salary': salary,
                        'posted_date': posted_date,
                        'location': location,
                        'logo': logo,
                        'apply_link': apply_link
                    }

                    all_jobs.append(job)

                except Exception as e:
                    print("Error parsing job:", e)

            time.sleep(1)

        browser.close()

    transformed_results = []
    for job in all_jobs:
        transformed_job = {
            "job_title": job.get("title", ""),
            "company_name": job.get("company", ""),
            "company_logo": job.get("logo", None),
            "salary": job.get("salary", None),
            # "posted_date": job.get("posted_date", datetime.now().isoformat()),
            "experience": job.get("experience", None),  # Optional, fill if available
            "location": job.get("location", None),
            "apply_link": job.get("apply_link", ""),
            "description": job.get("description", None),  # Optional, fill if available
        }
        transformed_results.append(transformed_job)

    return transformed_results

if __name__ == "__main__":
    results = scrape_reed_jobs(MAX_PAGES)
    print(f"Found {len(results)} jobs from Reed")
    inserted, deleted = insert_jobs(results, data_source="reed")
    print(f"Inserted {inserted} jobs to Database")
    notify_success(f"🎉 Reed Job scraping done successfully! {inserted} jobs processed.")
