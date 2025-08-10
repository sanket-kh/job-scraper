from datetime import datetime
from bs4 import BeautifulSoup
import json

from utils.logger import logger

class CVLibraryParser:
    """
    Parser for CV Library job listings
    Handles parsing job descriptions, extracting data from HTML content, and formatting
    """
    
    @staticmethod
    def parse_json_ld(html_content):
        """Parse JSON-LD structured data from HTML content"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Find all <script> tags with type="application/ld+json"
            scripts = soup.find_all('script', type='application/ld+json')

            for script in scripts:
                try:
                    data = json.loads(script.string)
                    
                    # Check if it's a JobPosting type
                    if data.get('@type') == 'JobPosting':
                        return data
                except json.JSONDecodeError:
                    continue  # Skip if not a valid JSON

            return None
        except Exception as e:
            logger.error(f"Failed to parse JSON-LD: {e}")
            return None
    
    @staticmethod
    def extract_job_details(job_element):
        """Extract job details from a job listing element"""
        if not job_element:
            return {}
        
        try:
            section_element = job_element.find("article")
            
            if not section_element:
                return {}
                
            # Extract basic job details
            job_data = {
                "job_title": section_element.get("data-job-title", ""),
                "company_name": section_element.get("data-company-name", ""),
                "location": section_element.get("data-job-location", ""),
                "salary": section_element.get("data-job-salary", ""),
                "job_type": section_element.get("data-job-type", ""),
                "date_posted": section_element.get("data-job-posted", ""),
                "job_id": section_element.get("data-job-id", ""),
                "industry": section_element.get("data-job-industry", "")
            }
            
            # Extract company logo if available
            company_logo_element = job_element.select_one("img.job__logo")
            if company_logo_element:
                job_data["company_logo"] = company_logo_element.get("data-src", "")
            else:
                job_data["company_logo"] = ""
                
            return job_data
            
        except Exception as e:
            logger.error(f"Failed to extract job details: {e}")
            return {}
    
    @staticmethod
    def format_job_data(job_data, apply_link=None, description=None):
        """Format raw job data into standardized structure"""
        try:
            # Add default values for missing fields
            if not job_data.get("job_title"):
                job_data["job_title"] = "Untitled Position"
                
            if not job_data.get("company_name"):
                job_data["company_name"] = "Unknown Company"
                
            # Format the job posting
            formatted_job = {
                "job_title": job_data.get("job_title", ""),
                "experience": "",
                "salary": job_data.get("salary", "Not specified"),
                "location": job_data.get("location", "Not specified"),
                "job_type": job_data.get("job_type", "Not specified"),
                "url": f'https://www.cv-library.co.uk/job/{job_data.get("job_id", "")}' if job_data.get("job_id") else "",
                "company_name": job_data.get("company_name", ""),
                "description": description or "No description available",
                "posted_date": job_data.get("date_posted", datetime.now().date()),
                "company_logo": job_data.get("company_logo", ""),
                "apply_link": apply_link or "",
                "country": "UK",
                "data_source": "cv_library",
                "ingestion_timestamp": datetime.utcnow().isoformat(),
                "external_job_id": job_data.get("job_id", "")
            }
            
            return formatted_job
            
        except Exception as e:
            logger.error(f"Failed to format job data: {e}")
            return {}