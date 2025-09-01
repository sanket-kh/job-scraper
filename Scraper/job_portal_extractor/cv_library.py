#!/usr/bin/env python3
import argparse
import asyncio

from Scraper.job_portal_extractor.filter_jobs import apply_all_filters
from Scraper.job_portal_extractor.utils import notification, database
from Scraper.job_portal_extractor.utils.common_utils import remove_duplicate_jobs
# Import scrapers
from portals.cvlibrary import CVLibraryScraper
from utils.config import Settings, load_company_list
from utils.database import DatabaseManager
from utils.logger import logger
from utils.notification import notify_success, notify_failure


async def run_cv_library_scraper(company_list=None, max_workers=None, max_pages=None):
    """Run the CV Library scraper"""
    settings = Settings()
    
    try:
        # Use provided args or fallback to settings
        # max_workers = max_workers or settings.MAX_WORKERS
        # max_pages = max_pages if max_pages is not None else settings.MAX_PAGES
        max_workers = 2
        max_pages = 20

        notify_success("Started", "CV Library")
        
        # Initialize scraper
        scraper = CVLibraryScraper(
            company_list=company_list,
            max_workers=max_workers,
            max_pages=max_pages
        )
        
        # Run the scraper
        job_listings = await scraper.get_job_listings_async()
        job_listings = apply_all_filters(job_listings)
        
        if not job_listings:
            notify_failure("No job listings returned from CV Library scraper", "run_cv_library_scraper")
            return []
        
        # Save to database
        db_manager = DatabaseManager()
        inserted, deleted = db_manager.batch_upsert_jobs(job_listings, data_source="cv_library")
        
        # Send success notification
        success_message = (
            f"CV Library scraper completed successfully.\n"
            f"Scraped {len(job_listings)} jobs\n"
            f"Database: {deleted} old jobs deleted, {inserted} new jobs inserted\n"
        )
        notify_success(success_message, "CV Library")
        
        return job_listings
        
    except Exception as e:
        error_message = f"Failed to run CV Library scraper: {str(e)}"
        logger.exception(error_message)
        notify_failure(error_message, "CV Library")
        return []


async def main():
    """Main function to run all scrapers based on arguments"""
    parser = argparse.ArgumentParser(description='Job Scraper CLI')
    parser.add_argument('--scraper', type=str, choices=['cv_library', 'linkedin', 'indeed', 'glassdoor', 'nhs'], 
                       default='all', help='Which scraper to run')
    parser.add_argument('--max-workers', type=int, help='Maximum number of concurrent workers')
    parser.add_argument('--max-pages', type=int, help='Maximum number of pages to scrape')
    parser.add_argument('--company-list', type=str, help='Path to CSV file with company list')
    
    args = parser.parse_args()
    
    # Load company list
    company_list = load_company_list(args.company_list)
    
    # Initialize results dictionary
    results = {}
    
    # Run selected scrapers
    logger.info("Running CV Library scraper...")
    await run_cv_library_scraper(
        company_list=company_list,
        max_workers=args.max_workers,
        max_pages=args.max_pages
    )
    return results


if __name__ == "__main__":
    print()
    asyncio.run(main())
