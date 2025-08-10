import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timedelta
import pandas as pd
import re
import json
import time
import logging
import traceback
from sqlalchemy import create_engine, Column, Integer, String, Text, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from rapidfuzz import process

from utils.notification import notify_failure,notify_success
from constants.totalJobsConstants import totalJobsCookies,totalJobsHeaders

from utils.dbUtils import Job,init_db,insert_jobs_to_db,delete_jobs_by_source

# Setup logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('totaljobs_scraper')

company_list = []

# Database setup
Base = declarative_base()
engine = create_engine('postgresql://postgres.pmddjinsavovomdhxnye:AEWeSCJ$Cc9EFYy@aws-0-ap-south-1.pooler.supabase.com:6543/postgres')
Session = sessionmaker(bind=engine)


# Helper functions for database operations
def truncate_string(text: str, max_length: int) -> str:
    """Truncate string to specified maximum length"""
    return text[:max_length] if text else ""

def parse_date(date_str: str) -> datetime.date:
    """Parse date string into a datetime.date object"""
    try:
        # Handle different date formats from TotalJobs
        if 'today' in date_str.lower():
            return datetime.now().date()
        elif 'yesterday' in date_str.lower():
            return (datetime.now() - timedelta(days=1)).date()
        
        # Try to parse other date formats
        date_patterns = [
            r'(\d+)\s+days?\s+ago',  # "3 days ago"
            r'(\d+)\s+weeks?\s+ago'  # "2 weeks ago"
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, date_str.lower())
            if match:
                time_value = int(match.group(1))
                if 'day' in date_str.lower():
                    return (datetime.now() - timedelta(days=time_value)).date()
                elif 'week' in date_str.lower():
                    return (datetime.now() - timedelta(weeks=time_value)).date()
        
        # Try standard date formats
        for fmt in ['%d/%m/%Y', '%Y-%m-%d', '%d %b %Y']:
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
                
        # If all else fails, return today's date
        logger.warning(f"Could not parse date: {date_str}, using current date")
        return datetime.now().date()
    except Exception as e:
        logger.error(f"Error parsing date '{date_str}': {str(e)}")
        return datetime.now().date()


# Cleaning and matching
def clean_name(name):
    try:
        name = str(name).strip().lower()
        name = re.sub(r'[^a-z0-9\s]', '', name)
        name = re.sub(r'\s+', ' ', name)
        return name
    except Exception as e:
        print(f"Failed to clean name: {str(e)}", "clean_name")
        return ""

def get_company_list():
    global company_list
    try:
        df = pd.read_csv(r"data/2025-04-04_-_Worker_and_Temporary_Worker.csv")
        df['Organisation Name'] = df['Organisation Name'].apply(clean_name)
        company_list = list(df['Organisation Name'])

        logger.info(f"✅ Loaded {len(company_list)} companies from CSV")
    except Exception as e:
        print(f"Failed to load company list: {str(e)}", "get_company_list")
        raise


def extract_external_url(url: str) -> str:
    response = requests.get(
        url,
        cookies=totalJobsCookies,
        headers=totalJobsHeaders,
    )
    match = re.search(r'"listingGlobalId"\s*:\s*"([^"]+)"', response.text)
    if match:
        return match.group(1)
    else:
        return None

def fetch_totaljobs_page(url: str) -> str:
    """Fetch HTML content from the specified URL"""
    try:
        logger.info(f"Fetching URL: {url}")
        response = requests.get(url, cookies=totalJobsCookies, headers=totalJobsHeaders)

        if response.status_code == 200:
            logger.info(f"Successfully fetched page from URL: {url}")
            return response.text
        else:
            raise Exception(f"Failed to fetch page from URL: {url}, status code: {response.status_code}")
    except Exception as e:
        logger.error(f"Error fetching page from URL {url}: {str(e)}")
        raise

def extract_job_data_and_pagination(html_content: str, current_page: int) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    """
    Extract job data from preloaded state in script tags and return pagination info
    Returns: (job_listings, next_page_url)
    """
    jobs = []
    next_page_url = None
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        with open("sample.html", "w+", encoding="utf-8") as file:
                file.write(html_content)

        # Pattern to find JSON assignment inside script
        pattern = r'window\.__PRELOADED_STATE__\["[^"]+"\]\s*=\s*({.*?});'
        
        # List to collect all extracted JSON objects
        extracted_data = []
        
        # Loop through all script tags
        found_data = False
        for script in soup.find_all('script'):
            if script.string and 'window.__PRELOADED_STATE__' in script.string:
                matches = re.finditer(pattern, script.string, re.DOTALL)
                for match in matches:
                    json_text = match.group(1)
                    try:
                        data = json.loads(json_text)
                        extracted_data.append(data)
                        found_data = True
                    except json.JSONDecodeError as e:
                        logger.error(f"JSON decoding error: {e}")
        
        if not found_data:
            logger.warning("No preloaded state data found in the HTML")
            return [], None
            
        # Process the extracted data (using the second JSON object which contains search results)
        if len(extracted_data) > 1 and 'searchResults' in extracted_data[1]:
            search_results = extracted_data[1]['searchResults']
            
            with open("sample.json", "w+", encoding="utf-8") as file:
                json.dump(extracted_data, file)

            # Extract pagination info
            if 'pagination' in search_results:
                pagination = search_results['pagination']
                logger.info(f"Pagination info: Page {pagination.get('page')} of {pagination.get('pageCount')}, Total: {pagination.get('totalCount')}")
                
                # Get next page URL if available
                if 'links' in pagination and 'next' in pagination['links'] and pagination['links']['next']:
                    next_page_url = pagination['links']['next']
                    logger.info(f"Next page URL: {next_page_url}")
            
            # Extract job items
            job_items = search_results.get('items', [])
            base_url = "https://www.totaljobs.com"
            
            for job in job_items:
                # Clean and check company name
                raw_company = job.get('companyName', 'N/A')
                try:
                    match, score, _ = process.extractOne(raw_company, company_list)
                except Exception as e:
                    print(f"Error in fuzzy matching: {e}")
                    match, score = company_name, 0
                
                if score < 70:
                    continue
                
                salary = job.get('salary', 'N/A')
                if any(unit in salary for unit in ['per hour', 'hourly', 'an hour', 'a day', 'per day', '/hour', '/day']):
                    continue
                
                job_url = base_url + job.get('url', '')
                if not job:
                    continue
                globaljobid = extract_external_url(job_url)
                if not globaljobid:
                    continue

                apply_link = f'https://www.totaljobs.com/job/{globaljobid}/application/authentication'

                # Extract job data
                job_data = {
                    'job_id': job.get('id'),
                    'title': job.get('title', 'N/A'),
                    'company': raw_company,
                    'company_logo': job.get('companyLogoUrl', 'N/A'),
                    'salary': job.get('salary', 'N/A'),
                    'posted_date': job.get('datePosted', 'N/A'),
                    'location': job.get('location', 'N/A'),
                    'url': apply_link,
                    'description': job.get('textSnippet', 'N/A'),
                    'experience': job.get('jobType', ''),
                    'apply_link': apply_link,
                    'country': "UK",
                    'data_source': 'totaljobs',
                    'page_number': current_page,
                    'ingestion_timestamp': datetime.utcnow().isoformat()
                }
                
                # Try to extract additional info
                job_data['labels'] = job.get('badges', [])
                if isinstance(job_data['labels'], list) and job_data['labels']:
                    job_data['experience'] += f" - {', '.join([b.get('text', '') for b in job_data['labels'] if 'text' in b])}"

                jobs.append(job_data)
                
            logger.info(f"Extracted {len(jobs)} matching jobs from preloaded state on page {current_page}")
        else:
            logger.warning(f"Could not find search results in extracted data on page {current_page}")
            
    except Exception as e:
        error_message = f"Error extracting job data: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_message)
        print(error_message, "extract_job_data_and_pagination")
        
    return jobs, next_page_url


# Main function
if __name__ == "__main__":
    try:
        print("Start of the Job")
        
        # Get company list 
        get_company_list()
        
        # Set maximum pages to scrape (as a safety measure)
        max_pages = 200
        
        # Set initial URL
        current_url = 'https://www.totaljobs.com/jobs/sponsorship/in-united-kingdom?salary=30000&salarytypeid=1'
        current_page = 1
        all_jobs = []

        # Loop through pages using dynamic pagination
        while current_url and current_page <= max_pages:
            try:
                # Fetch the page
                html_content = fetch_totaljobs_page(current_url)
                
                # Extract job data and get next page URL
                job_listings, next_page_url = extract_job_data_and_pagination(html_content, current_page)

                # Add jobs to our collection
                if job_listings:
                    all_jobs.extend(job_listings)
                    logger.info(f"✅ Page {current_page}: {len(job_listings)} jobs matched and added. Total: {len(all_jobs)}")
                else:
                    logger.info(f"⚠️ Page {current_page}: No matching jobs.")
                
                # Save progress after each page
                with open("totaljobs_combined.json", "w", encoding="utf-8") as f:
                    json.dump(all_jobs, f, ensure_ascii=False, indent=4)
                
                # Set URL for next page
                current_url = next_page_url
                current_page += 1
                
                # If there's no next page URL, we're done
                if not current_url:
                    logger.info("Reached last page. Scraping complete.")
                    break
                    
                # Be nice to the server
                time.sleep(2)  

            except Exception as page_error:
                error_msg = f"Error processing page {current_page}: {str(page_error)}"
                logger.error(error_msg)
                print(error_msg, f"Page {current_page}")
                raise

        # After all pages are processed, insert jobs to database
        if all_jobs:
            delete_jobs_by_source('totaljobs')
            inserted_count = insert_jobs_to_db(all_jobs)
            success_message = f"✅ TotalJobs Scraper completed successfully!\n📊 Stats:\n- Pages scraped: {current_page - 1}\n- Jobs matched: {len(all_jobs)}\n- Jobs inserted: {inserted_count}"
            logger.info(success_message)
            print(success_message)
            notify_success(success_message)
        else:
            print("No jobs found matching the criteria", "main")

    except KeyboardInterrupt:
        logger.info("Script interrupted by user")
        notify_failure("Script interrupted by user", "main")
    except Exception as e:
        error_message = f"Unexpected error in main function: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_message, "Total Jobs")
        notify_failure(error_message, " Total Jobs ")
    finally:
        logger.info("Script execution completed")