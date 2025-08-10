import csv
import json
import logging
from datetime import datetime

from linkedin_jobs_scraper import LinkedinScraper
from linkedin_jobs_scraper.events import Events, EventData, EventMetrics
from linkedin_jobs_scraper.filters import RelevanceFilters, TimeFilters, TypeFilters, ExperienceLevelFilters, \
    OnSiteOrRemoteFilters, SalaryBaseFilters
from linkedin_jobs_scraper.query import Query, QueryOptions, QueryFilters

# Change root logger level (default is WARN)
logging.basicConfig(level=logging.INFO)


# Fired once for each successfully processed job
def on_data(data: EventData):
    job_data = {
        'title': data.title,
        'company': data.company,
        'company_link': data.company_link,
        'company_logo': data.company_img_link,
        'date': data.date,
        'date_text': data.date_text,
        'link': data.link,
        'location': data.place,
        'description': data.description,
        'description_length': len(data.description) if data.description else 0,
        'insights': data.insights,
        'scraped_at': datetime.now().isoformat()
    }

    scraped_jobs.append(job_data)
    save_results_to_files()
    print('[ON_DATA]', data.title,data.company_img_link ,  data.company, data.company_link, data.date, data.date_text, data.link, data.insights,
          len(data.description))


scraped_jobs = []


def save_results_to_files():
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    json_filename = f'linkedin_jobs_{timestamp}.json'
    with open(json_filename, 'w', encoding='utf-8') as f:
        json.dump(scraped_jobs, f, indent=2, ensure_ascii=False)
    print(f'Data saved to: {json_filename}')

    # Save to CSV
    if scraped_jobs:
        csv_filename = f'linkedin_jobs_{timestamp}.csv'
        with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=scraped_jobs[0].keys())
            writer.writeheader()
            writer.writerows(scraped_jobs)
        print(f'Data saved to: {csv_filename}')

    # Save to CSV
    if scraped_jobs:
        csv_filename = f'linkedin_jobs_{timestamp}.csv'
        with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=scraped_jobs[0].keys())
            writer.writeheader()
            writer.writerows(scraped_jobs)
        print(f'Data saved to: {csv_filename}')

    # Print summary
    print(f'\n=== SCRAPING SUMMARY ===')
    print(f'Total jobs scraped: {len(scraped_jobs)}')
    if scraped_jobs:
        companies = set(job['company'] for job in scraped_jobs)
        print(f'Unique companies: {len(companies)}')
        print(f'Companies: {", ".join(list(companies)[:5])}{"..." if len(companies) > 5 else ""}')


# Fired once for each page (25 jobs)
def on_metrics(metrics: EventMetrics):
    print('[ON_METRICS]', str(metrics))


def on_error(error):
    print('[ON_ERROR]', error)


def on_end():
    print('[ON_END]')


scraper = LinkedinScraper(
    chrome_executable_path=None,  # Custom Chrome executable path (e.g. /foo/bar/bin/chromedriver)
    chrome_binary_location=None,
    # Custom path to Chrome/Chromium binary (e.g. /foo/bar/chrome-mac/Chromium.app/Contents/MacOS/Chromium)
    chrome_options=None,  # Custom Chrome options here
    headless=True,  # Overrides headless mode only if chrome_options is None
    max_workers=1,  # How many threads will be spawned to run queries concurrently (one Chrome driver for each thread)
    slow_mo=2.0,  # Slow down the scraper to avoid 'Too many requests 429' errors (in seconds)
    page_load_timeout=40  # Page load timeout (in seconds)    
)

# Add event listeners
scraper.on(Events.DATA, on_data)
scraper.on(Events.ERROR, on_error)
scraper.on(Events.END, on_end)

queries = [
    Query(
        options=QueryOptions(
            limit=5  # Limit the number of jobs to scrape.
        )
    ),
    Query(
        query='Engineer',
        options=QueryOptions(
            locations=['United States', 'Europe'],
            apply_link=True,
            # Try to extract apply link (easy applies are skipped). If set to True, scraping is slower because an additional page must be navigated. Default to False.
            skip_promoted_jobs=True,  # Skip promoted jobs. Default to False.
            page_offset=2,  # How many pages to skip
            limit=5,
            filters=QueryFilters(
                # company_jobs_url='https://www.linkedin.com/jobs/search/?f_C=1441%2C17876832%2C791962%2C2374003%2C18950635%2C16140%2C10440912&geoId=92000000',  # Filter by companies.
                relevance=RelevanceFilters.RECENT,
                time=TimeFilters.MONTH,
                type=[TypeFilters.FULL_TIME, TypeFilters.INTERNSHIP],
                on_site_or_remote=[OnSiteOrRemoteFilters.REMOTE],
                experience=[ExperienceLevelFilters.MID_SENIOR],
                base_salary=SalaryBaseFilters.SALARY_100K
            )
        )
    ),
]

scraper.run(queries)
