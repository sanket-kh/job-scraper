import regex as re
from Scraper.job_portal_extractor.utils.config import load_company_list
from Scraper.job_portal_extractor.utils.match_company import is_company_match_above_70


def parse_salary(salary_text: str) -> float | None:
    """
    Parse salary string and return the minimum annual salary in numeric form.
    Handles formats like '33.5k', '33500', '£40,000 - £50,000', '$80k', etc.
    Returns None if parsing fails.
    """
    if not salary_text:
        return None

    salary_text = salary_text.lower().replace(",", "").strip()

    # Extract numbers (with optional decimal + 'k')
    matches = re.findall(r"(\d+(?:\.\d+)?)(k)?", salary_text)
    if not matches:
        return None

    # Convert all found numbers
    salaries = []
    for num, k in matches:
        value = float(num)
        if k:  # 'k' means thousands
            value *= 1000
        salaries.append(value)

    if not salaries:
        return None

    return min(salaries)  # return minimum salary found


def apply_all_filters(input_arr, exclude_per_day_salary=True, minimum_salary=33500):
    """
    Apply multiple filters to job data:
    - Remove duplicates based on description
    - Filter out per-day salary jobs (optional)
    - Filter by company whitelist (optional)

    Args:
        input_arr: List of job dictionaries
        exclude_per_day_salary: Whether to exclude per-day salary jobs
        minimum_salary: Whether to exclude per-day salary jobs
    """
    filtered_arr = []
    seen = set()

    for job in input_arr:
        # Skip duplicates (existing logic)
        desc_key = (job.get("description") or "")[:200]
        company_name = (job.get("company_name") or "").lower().strip()

        if desc_key in seen:
            continue

        salary_text = str((job.get("salary") or "")).lower()

        # Filter out per-day salaries
        if exclude_per_day_salary or not company_name == 'nhs':
            if "per day" in salary_text or "/day" in salary_text or "daily" in salary_text:
                continue

            # Parse salary
        min_salary = parse_salary(salary_text)
        if min_salary is None or min_salary < minimum_salary:
            continue

        company_whitelist = load_company_list()
        # Filter by company whitelist
        if company_whitelist:
            company_name = (job.get("company_name") or "").lower().strip()
            # Check if company matches any in the whitelist (case-insensitive)
            if not is_company_match_above_70(company_name, company_whitelist):
                continue

        # If we get here, job passes all filters
        seen.add(desc_key)
        filtered_arr.append(job)

    return filtered_arr
