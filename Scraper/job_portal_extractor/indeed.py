import csv
import time
import random

from jobspy2 import scrape_jobs
from datetime import date, datetime

from playwright.sync_api import sync_playwright

from utils.notification import notify_success
from utils.supaDb import insert_jobs


def scrape_indeed_with_checkbox(job_url):
    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            user_data_dir="/tmp/chrome_profile",
            headless=False,
            args=["--disable-blink-features=AutomationControlled"]
        )
        page = browser.new_page()
        page.goto(job_url)

        time.sleep(5)

        # Now you can scrape the page content
        content = page.content()
        print(content)
        page.wait_for_selector("div[data-testid*='tile']", timeout=15000)

        # Find all divs with data-testid containing currency sign or 'tile'
        salary_elements = page.query_selector_all("div[data-testid*='tile'] span")

        salaries = []
        for el in salary_elements:
            text = el.inner_text().strip()
            if re.search(r"£\d", text):  # Matches salary patterns like £13.85
                salaries.append(text)

        print("💰 Salaries found:", salaries)
        browser.close()

transformed_results = []

try:
    jobs = scrape_jobs(
        site_name=["indeed"],  # search_term="software engineer",
        location="London,UK",
        distance=25,
        # results_wanted=2500,
        results_wanted=5,  # For Testing
        # hours_old=72,
        country_indeed='UK',
        
        # linkedin_fetch_description=True # gets more info such as description, direct job url (slower)
        # proxies=["208.195.175.46:65095", "208.195.175.45:65095", "localhost"],
    )
    print(f"Found {len(jobs)} jobs")
    all_jobs_dicts = jobs.to_dict(orient="records")

    for job in all_jobs_dicts:
        transformed_job = {
            "job_title": job.get("title", ""),
            "company_name": job.get("company", ""),
            "company_logo": job.get("company_logo", None),
            "salary": scrape_indeed_with_checkbox(job.get('job_url')),
            "posted_date": (job["date_posted"].isoformat() if isinstance(job.get("date_posted"), (date, datetime)) else job.get("date_posted") or datetime.now().isoformat()),
            "experience": job.get("experience_range", None),  # Optional, fill if available
            "location": job.get("location", None),
            "apply_link": job.get("job_url_direct", "") or job.get("job_url", "") ,
            "description": job.get("description", None),  # Optional, fill if available
        }
        print(transformed_job.get("posted_date"))
        transformed_results.append(transformed_job)

except Exception as e:
    print(f"Error in Scraping Linkedin: {e}")

print(transformed_results)
print(f"Found {len(transformed_results)} jobs from Indeed")
if(len(transformed_results)>0):
    inserted, deleted = insert_jobs(transformed_results, data_source="indeed")
    print(f"Inserted {inserted} jobs to Database")
notify_success(f"🎉 Indeed Job scraping done successfully! {len(transformed_results)} jobs processed.")

# print(jobs.head())
jobs.to_csv("jobs.csv", quoting=csv.QUOTE_NONNUMERIC, escapechar="\\", index=False) # to_excel