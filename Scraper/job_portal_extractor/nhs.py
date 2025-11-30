import requests
from bs4 import BeautifulSoup
import datetime
import logging
import re
import pandas as pd
import html
import traceback
from datetime import datetime
from sqlalchemy.ext.declarative import declarative_base
import pyshorteners

from sqlalchemy.orm import sessionmaker
from dateutil import parser
import time
from rapidfuzz import process

from Scraper.job_portal_extractor.filter_jobs import apply_all_filters
from Scraper.job_portal_extractor.utils.common_utils import remove_duplicate_jobs, html_to_text_with_breaks
from utils.notification import notify_success, notify_failure
from utils.dbUtils import Job, init_db, insert_jobs_to_db, delete_jobs_by_source;

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
BASE_URL = "https://www.jobs.nhs.uk/candidate/search/results?workingPattern=full-time&contractType=Permanent&payRange=30-40%2C40-50%2C50-60%2C60-70%2C70-80%2C80-90%2C90-100%2C100&language=en#"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}
PARAMS = {
    'searchFormType': 'main',
    'searchByLocationOnly': 'true',
    'language': 'en'
}
OUTPUT_FILE = "nhs_jobs.json"

# SQLAlchemy setup
Base = declarative_base()
engine = None
Session = None

company_list = []


def clean_name(name):
    """Cleans a company name for matching."""
    try:
        name = str(name).strip().lower()
        name = re.sub(r'[^a-z0-9\s]', '', name)
        name = re.sub(r'\s+', ' ', name)
        return name
    except Exception as e:
        error_message = f"Failed to clean name: {str(e)}"
        print(error_message, "clean_name")
        return ""


def get_company_list():
    """Loads and cleans the list of target companies from CSV."""
    global company_list
    try:
        df = pd.read_csv(r"data/2025-04-04_-_Worker_and_Temporary_Worker.csv")
        df['Organisation Name'] = df['Organisation Name'].apply(clean_name)
        company_list = list(df['Organisation Name'])
        logger.info(f"Loaded {len(company_list)} companies from CSV")
    except Exception as e:
        error_message = f"Failed to load company list: {str(e)}"
        print(error_message, "get_company_list")
        raise


def parse_date(date_str):
    """Parse date string in various formats to a datetime.date object"""
    try:
        if not date_str or date_str == "N/A" or date_str == "Not specified" or date_str == "Invalid date format":
            return datetime.now().date()

        # Handle "X days ago" format
        days_ago_match = re.search(r'(\d+)d ago', date_str)
        if days_ago_match:
            days = int(days_ago_match.group(1))
            return (datetime.now() - pd.Timedelta(days=days)).date()

        # Handle "Today" and "Just posted"
        if date_str.lower() in ["today", "just posted"]:
            return datetime.now().date()

        # Handle date strings in "dd/mm/yyyy" format
        if "/" in date_str:
            parts = date_str.split("/")
            if len(parts) == 3:
                day, month, year = map(int, parts)
                return datetime(year, month, day).date()

        # Try parsing with dateutil parser as fallback
        return parser.parse(date_str).date()
    except Exception:
        # If parsing fails, return current date
        return datetime.now().date()


def extract_description(url):
    """Extract job description HTML from the job detail page."""
    try:
        logger.info(f"Fetching job description from: {url}")
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        # Look for the specific class you mentioned
        description_element = soup.find('div', {'class': 'nhsuk-grid-column-two-thirds wrap-paragraphs'})

        if description_element:
            # Remove any script tags
            for script in description_element.find_all('script'):
                script.decompose()

            # Return the full HTML content as a string
            return str(description_element)

        # Fallback to other potential description containers
        description_section = soup.find('section', {'id': 'job-overview'})
        if description_section:
            for script in description_section.find_all('script'):
                script.decompose()
            return str(description_section)

        # If no description found
        return "<div>Description not available</div>"
    except Exception as e:
        error_message = f"Failed to extract job description: {str(e)}"
        logger.error(error_message)
        return "<div>Failed to retrieve description</div>"


def scrape_nhs_logo_urls(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }


    print(f"\nProcessing URL: {url}")
    try:
        # Step 1: Fetch the HTML content of the page
        response = requests.get(url, headers=headers, timeout=10)
        # Raise an exception for bad status codes (4xx or 5xx)
        response.raise_for_status()

        # Step 2: Parse the HTML with BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')

        # Step 3: Find the image tag with the specific ID 'employer_logo'
        logo_tag = soup.find('img', id='employer_logo')

        if logo_tag:
            # Extract the 'src' attribute which contains the base64 data URI
            logo_src = logo_tag.get('src')

            if logo_src and logo_src.startswith('data:image'):
                # Step 4: Print the data URI
                print(f"Logo Data URI found: {logo_src[:70]}...")  # Print a snippet
                logo_data_urls = logo_src
            else:
                print("Could not find a valid data URI in the logo's src attribute.")
                logo_data_urls = None
        else:
            print("Could not find the logo image tag with id='employer_logo'.")
            logo_data_urls = None

    except requests.exceptions.RequestException as e:
        print(f"An error occurred while fetching the URL: {e}")
        logo_data_urls = f"Error: {e}"
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        logo_data_urls = f"Error: {e}"

    return logo_data_urls


def truncate_string(text, max_length):
    """Safely truncate a string to specified maximum length."""
    if text and len(text) > max_length:
        return text[:max_length - 3] + "..."
    return text


def scrape_all_pages():
    """Scrape all pages of job listings from the NHS jobs website."""
    all_jobs = []
    page = 1
    matched_jobs = []

    logger.info("Starting to scrape NHS job listings")
    while True:
        params = PARAMS.copy()
        params['page'] = str(page)

        try:
            logger.info(f"Fetching page {page}")
            response = requests.get(BASE_URL, params=params, headers=HEADERS)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')
            jobs = parse_jobs(soup)

            if not jobs:
                logger.info(f"No more jobs found on page {page}. Stopping.")
                break

            logger.info(f"Found {len(jobs)} jobs on page {page}")
            all_jobs.extend(jobs)

            # Filter for target companies
            for job in jobs:
                # Fetch and add the job description
                job_url = job.get('url', '')
                if job_url:
                    # Add delay to avoid being rate-limited
                    time.sleep(1)
                    description = extract_description(job_url)

                    if 'This job is now closed' in description:
                        continue

                    if not 'Certificate of Sponsorship' in description:
                        continue

                    job['description'] = html_to_text_with_breaks(description)
                matched_jobs.append(job)

            page += 1

            # Break after first page for testing
            if page > 10:
                break

        except requests.RequestException as e:
            error_message = f"Error fetching page {page}: {str(e)}"
            logger.error(error_message)
            print(error_message, f"scrape_all_pages (page {page})")
            break

    all_jobs_count = len(all_jobs)
    matched_jobs_count = len(matched_jobs)
    logger.info(f"Total jobs scraped: {all_jobs_count}, Matching target companies: {matched_jobs_count}")
    return all_jobs, matched_jobs


def parse_jobs(soup):
    """Parse job listings from a BeautifulSoup object."""
    job_listings = soup.find_all('li', class_='search-result')
    if not job_listings:
        return []

    jobs = []
    current_date = datetime.now().date()

    for job in job_listings:
        try:
            title_element = job.find('a', {'data-test': 'search-result-job-title'})
            if not title_element:
                continue

            title = title_element.text.strip()
            url = "https://www.jobs.nhs.uk" + title_element['href']

            employer_element = job.find('h3', class_='nhsuk-u-font-weight-bold')
            employer = employer_element.contents[0].strip() if employer_element else "Unknown Employer"

            try:
                match, score, _ = process.extractOne(employer, company_list)
            except Exception as e:
                print(f"Error in fuzzy matching: {e}")
                match, score = company_name, 0

            if score < 70:
                continue

            location_element = job.find('div', class_='location-font-size')
            location = location_element.text.strip() if location_element else "Unknown Location"

            salary_element = job.find('li', {'data-test': 'search-result-salary'})
            salary = "N/A"
            if salary_element:
                salary = salary_element.text.strip()
                salary = html.unescape(salary)
                salary = salary.replace('Salary:', '').strip()
                salary = salary.split('a year')[0].strip()

            closing_date_element = job.find('li', {'data-test': 'search-result-closingDate'})
            closing_date_str = "N/A"
            if closing_date_element:
                closing_date_str = closing_date_element.text.strip().replace('Closing date:', '').strip()

            posting_date_element = job.find('li', {'data-test': 'search-result-publicationDate'})
            posting_date_str = "N/A"
            if posting_date_element:
                posting_date_str = posting_date_element.text.strip().replace('Date posted:', '').strip()

            job_id = "N/A"
            job_type = "N/A"
            contract_type = "N/A"

            job_id_element = job.find('span', {'data-test': 'search-result-jobId'})
            if job_id_element:
                job_id = job_id_element.text.strip().replace('Job reference:', '').strip()

            job_type_element = job.find('li', {'data-test': 'search-result-jobType'})
            if job_type_element:
                job_type = job_type_element.text.strip().replace('Job type:', '').strip()

            contract_type_element = job.find('li', {'data-test': 'search-result-contractType'})
            if contract_type_element:
                contract_type = contract_type_element.text.strip().replace('Contract type:', '').strip()

            ingestion_time = datetime.utcnow().isoformat()

            job_data = {
                'job_title': title,
                'url': url,
                'company_name': employer,
                'location': location,
                'salary': salary,
                'posted_date': posting_date_str,
                'job_id': job_id,
                'job_type': job_type,
                'apply_link': url,
                'company_logo': scrape_nhs_logo_urls(url),
                'data_source': 'nhs',
                'country': 'UK',
            }

            jobs.append(job_data)

        except Exception as e:
            error_message = f"Error parsing job: {str(e)}"
            logger.error(error_message)
            print(error_message, "parse_jobs")

    return jobs


def main():
    """Main function to run the scraper."""

    logger.info("Starting NHS job scraper...")

    try:
        # Get Telegram chat ID

        notify_success(f"🚀 NHS scraper started at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        # Initialize database
        init_db()

        # Load company list
        get_company_list()

        # Scrape all job listings
        all_jobs, matched_jobs = scrape_all_pages()

        try:
            if len(all_jobs) == 0:
                error_message = "No jobs collected from NHS site"
                logger.error(error_message)
                print(error_message, "data_collection")
                return

            # Insert jobs into database
            delete_jobs_by_source('nhs')

            matched_jobs = apply_all_filters(matched_jobs)
            inserted_count = insert_jobs_to_db(matched_jobs)

            success_message = (
                f"✅ NHS scraper completed successfully at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"Scraped {len(all_jobs)} jobs\n"
                f"Matched {len(matched_jobs)} jobs with target companies\n"
                f"Inserted {inserted_count} jobs into database"
            )
            notify_success(success_message)

        except Exception as e:
            error_message = f"Failed to save data: {str(e)}\n{traceback.format_exc()}"
            logger.error(error_message)
            notify_failure(error_message, " NHS ")

    except Exception as e:
        error_message = f"Critical failure in main: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_message)
        notify_failure(error_message, " NHS ")


if __name__ == "__main__":
    main()
