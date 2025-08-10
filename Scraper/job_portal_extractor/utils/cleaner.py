import re
from datetime import datetime
from bs4 import BeautifulSoup
from utils.logger import logger

def clean_job_data(job_data):
    """Clean and normalize job data"""
    if not job_data:
        return {}
    
    try:
        # Make a copy to avoid modifying the original
        cleaned = job_data.copy()
        
        # Clean job title
        if "job_title" in cleaned and cleaned["job_title"]:
            cleaned["job_title"] = cleaned["job_title"].strip()
        
        # Clean company name
        if "company_name" in cleaned and cleaned["company_name"]:
            cleaned["company_name"] = cleaned["company_name"].strip()
        
        # Clean location
        if "location" in cleaned and cleaned["location"]:
            cleaned["location"] = cleaned["location"].strip()
        
        # Clean salary
        if "salary" in cleaned and cleaned["salary"]:
            cleaned["salary"] = normalize_salary(cleaned["salary"])
        
        # Clean description - remove HTML tags if present
        if "description" in cleaned and cleaned["description"]:
            if "<" in cleaned["description"] and ">" in cleaned["description"]:
                soup = BeautifulSoup(cleaned["description"], "html.parser")
                cleaned["description"] = soup.get_text(separator=" ", strip=True)
        
        # Ensure posted_date is in string format
        if "posted_date" in cleaned and cleaned["posted_date"]:
            if isinstance(cleaned["posted_date"], datetime):
                cleaned["posted_date"] = cleaned["posted_date"].date().isoformat()
            elif isinstance(cleaned["posted_date"], str):
                # Already a string, ensure it's clean
                cleaned["posted_date"] = cleaned["posted_date"].strip()
        
        return cleaned
    
    except Exception as e:
        logger.error(f"Error cleaning job data: {e}")
        return job_data


def normalize_salary(salary_string):
    """Normalize salary information to a standard format"""
    if not salary_string:
        return "Not specified"
    
    try:
        # Strip and lowercase for easier processing
        salary = salary_string.strip().lower()
        
        # Remove extra spaces
        salary = re.sub(r'\s+', ' ', salary)
        
        # Standardize salary ranges with hyphen
        salary = re.sub(r'\s*-\s*', '-', salary)
        
        # Handle per annum/year notation
        salary = salary.replace('per annum', '/year')
        salary = salary.replace('per year', '/year')
        salary = salary.replace('a year', '/year')
        
        # Handle per hour notation
        salary = salary.replace('per hour', '/hour')
        salary = salary.replace('an hour', '/hour')
        
        # Add £ if it's missing but has numbers
        if '£' not in salary and re.search(r'\d', salary):
            # Find the first digit
            digit_match = re.search(r'\d', salary)
            if digit_match:
                start_pos = digit_match.start()
                # Insert £ before the first digit
                salary = salary[:start_pos] + '£' + salary[start_pos:]
        
        # Remove decimals from whole thousands (£50,000.00 -> £50,000)
        salary = re.sub(r'(\d,\d{3})\.00', r'\1', salary)
        
        return salary
        
    except Exception as e:
        logger.error(f"Error normalizing salary: {e}")
        return salary_string