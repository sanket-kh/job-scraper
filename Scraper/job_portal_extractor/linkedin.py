from datetime import date, datetime

from jobspy2 import scrape_jobs
import time
from selenium import webdriver
from selenium.common import TimeoutException
from selenium.webdriver import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as ec
from selenium.webdriver.support.wait import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

from utils.config import load_company_list
from utils.match_company import is_company_match_above_70

companies_list = load_company_list()
transformed_results = []


def open_job_url_and_handle_popup(company_url):
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)

    try:
        driver.get(company_url)

        wait = WebDriverWait(driver, 15)
        try:
            driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
            print("Attempted to close popup with Escape key")
        except Exception:
            print('No popup')

        time.sleep(2)

        img_element = wait.until(
            ec.presence_of_element_located(
                (By.CSS_SELECTOR, ".contextual-sign-in-modal__screen img.contextual-sign-in-modal__img")
            )
        )
        # Wait for the salary element to be present
        salary_element = wait.until(
            ec.presence_of_element_located((By.CSS_SELECTOR, "div.salary.compensation__salary"))
        )

        salary_map = {'min': None, 'max': None}
        if salary_element:
            salary_text = salary_element.text.strip()
            salary_map = {
                'min': salary_text.split('-')[0].strip(),
                'max': salary_text.split('-')[1].strip()
            }

        logo_url = img_element.get_attribute("src")
        return logo_url, salary_map

    except TimeoutException:
        print("Timed out waiting for logo image on the page.")
        return None

    finally:
        driver.quit()


try:
    jobs = scrape_jobs(
        site_name=["linkedin"],
        search_term="software engineer",
        location="London,UK",
        linkedin_fetch_description=True,
        distance=25,
        # results_wanted=2500,
        results_wanted=5,  # For Testing
        # hours_old=168,
        # enforce_annual_salary = True,
        country_indeed='UK',

        # linkedin_fetch_description=True # gets more info such as description, direct job url (slower)
        # proxies=["208.195.175.46:65095", "208.195.175.45:65095", "localhost"],
    )
    print(f"Found {len(jobs)} jobs")
    all_jobs_dicts = jobs.to_dict(orient="records")

    for job in all_jobs_dicts:
        if not (is_company_match_above_70(job.get("company", ""), companies_list)):
            continue
        print(job)
        logo_url, salary_map = open_job_url_and_handle_popup(job.get("job_url"))
        transformed_job = {
            "job_title": job.get("title", ""),
            "company_name": job.get("company", ""),
            "company_logo": logo_url,
            "salary": f"{salary_map.get('min')} to {salary_map.get('min')}" if salary_map.get('min') else None,
            "posted_date": (
                job["date_posted"].isoformat() if isinstance(job.get("date_posted"), (date, datetime)) else job.get(
                    "date_posted") or datetime.now().isoformat()),
            "experience": job.get("experience_range", None),  # Optional, fill if available
            "location": job.get("location", None),
            "apply_link": job.get("job_url_direct", "") or job.get("job_url", ""),
            "description": job.get("description", None),  # Optional, fill if available
        }
        # print(job.get("job_url_direct"), job.get("job_url"))
        # print(transformed_job.get("posted_date"))
        transformed_results.append(transformed_job)

except Exception as e:
    print(f"Error in Scraping Linkedin: {e}")

print(transformed_results)
print(f"Found {len(transformed_results)} jobs from Linkedin")
# if(len(transformed_results)>0):
# inserted, deleted = insert_jobs(transformed_results, data_source="linkedin")
# print(f"Inserted {inserted} jobs to Database , and deleted {deleted} existing jobs")
# notify_success(f"🎉 Linkedin Job scraping done successfully! {inserted} jobs processed.")
# notify_success(f"🎉 Linkedin Job scraping done successfully! {len(transformed_results)} jobs processed.")

## print(jobs.head())
# jobs.to_csv("jobs.csv", quoting=csv.QUOTE_NONNUMERIC, escapechar="\\", index=False) # to_excel
