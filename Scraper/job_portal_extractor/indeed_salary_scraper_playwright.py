"""
Indeed Salary Scraper - Bulletproof Playwright Implementation
Simply import and use: salary = scrape_indeed_salary(job_url)
"""

import time
import re
from playwright.sync_api import sync_playwright


def scrape_indeed_salary(job_url, max_retries=3):
    """
    Bulletproof Indeed salary scraper using Playwright.
    
    Args:
        job_url (str): Indeed job posting URL
        max_retries (int): Maximum number of retry attempts
    
    Returns:
        str: Salary information or 'N/A' if not found
    """
    
    for attempt in range(max_retries):
        salary = _attempt_scrape(job_url, attempt)
        if salary != 'N/A':
            return salary
        
        if attempt < max_retries - 1:
            print(f"Retry {attempt + 1}/{max_retries - 1}...")
            time.sleep(2)
    
    return 'N/A'


def _attempt_scrape(job_url, attempt_num=0):
    """
    Single scraping attempt with progressive strategies.
    """
    with sync_playwright() as p:
        # Use different browser strategies based on attempt number
        browser_args = [
            "--disable-blink-features=AutomationControlled",
            "--disable-features=IsolateOrigins,site-per-process",
            "--disable-web-security",
            "--disable-features=BlockInsecurePrivateNetworkRequests",
            "--no-sandbox",
            "--disable-setuid-sandbox",
        ]
        
        # Alternate between headless and headed mode
        headless = (attempt_num % 2 == 0)
        
        # Launch browser with stealth settings
        browser = p.chromium.launch(
            headless=headless,
            args=browser_args
        )
        
        # Create context with realistic viewport and user agent
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            locale='en-GB',
            timezone_id='Europe/London',
        )
        
        # Add cookies to appear more legitimate
        context.add_cookies([
            {'name': 'indeed_cookie_consent', 'value': 'all', 'domain': '.indeed.com', 'path': '/'},
        ])
        
        page = context.new_page()
        
        # Add stealth scripts
        page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-GB', 'en']
            });
            window.chrome = {
                runtime: {}
            };
            Object.defineProperty(navigator, 'permissions', {
                get: () => ({
                    query: () => Promise.resolve({ state: 'granted' })
                })
            });
        """)
        
        try:
            # Navigate with longer timeout
            page.goto(job_url, wait_until='domcontentloaded', timeout=60000)
            
            # Multiple wait strategies
            page.wait_for_timeout(3000 + (attempt_num * 1000))
            
            # Try to wait for any salary-related element
            try:
                page.wait_for_selector("text=/£[0-9]/", timeout=5000)
            except:
                pass
            
            # EXTRACTION PHASE - Multiple methods in order of reliability
            
            # Method 1: Direct salary selectors
            salary = _extract_by_selectors(page)
            if salary:
                browser.close()
                return salary
            
            # Method 2: Aria labels and data attributes
            salary = _extract_by_attributes(page)
            if salary:
                browser.close()
                return salary
            
            # Method 3: Text content search
            salary = _extract_by_text_search(page)
            if salary:
                browser.close()
                return salary
            
            # Method 4: JavaScript evaluation
            salary = _extract_by_javascript(page)
            if salary:
                browser.close()
                return salary
            
            # Method 5: Full HTML regex search
            salary = _extract_by_html_regex(page)
            if salary:
                browser.close()
                return salary
            
            browser.close()
            return 'N/A'
            
        except Exception as e:
            print(f"Attempt {attempt_num} error: {str(e)[:50]}")
            browser.close()
            return 'N/A'


def _extract_by_selectors(page):
    """Extract salary using specific CSS selectors."""
    selectors = [
        # Primary selectors
        "[data-testid='job-salary']",
        "[data-testid='salary-snippet']",
        "div[id='salaryInfoAndJobType']",
        "span[class*='salary']",
        "div[class*='salary']",
        
        # Secondary selectors
        "[aria-label*='salary' i]",
        "[aria-label*='pay' i]",
        "div.metadata.salary-snippet-container",
        "div.jobsearch-JobMetadataHeader-item:has-text('£')",
        "span.attribute_snippet:has-text('£')",
        
        # Tile-based selectors
        "div[data-testid*='tile'] span:has-text('£')",
        "div[data-testid*='compensationAmt']",
        
        # Generic but targeted
        "div:has-text('£'):has-text('year')",
        "div:has-text('£'):has-text('hour')",
        "span:has-text('£'):has-text('-')",
    ]
    
    for selector in selectors:
        try:
            elements = page.query_selector_all(selector)
            for element in elements:
                text = element.inner_text().strip()
                if _is_valid_salary(text):
                    return _clean_salary(text)
        except:
            continue
    
    return None


def _extract_by_attributes(page):
    """Extract salary by searching data attributes."""
    try:
        # Get all elements with data attributes
        elements = page.query_selector_all("[data-testid], [aria-label]")
        
        for element in elements:
            try:
                # Check data-testid
                testid = element.get_attribute('data-testid') or ''
                if 'salary' in testid.lower() or 'compensation' in testid.lower():
                    text = element.inner_text().strip()
                    if _is_valid_salary(text):
                        return _clean_salary(text)
                
                # Check aria-label
                aria = element.get_attribute('aria-label') or ''
                if 'salary' in aria.lower() or 'pay' in aria.lower():
                    text = element.inner_text().strip()
                    if _is_valid_salary(text):
                        return _clean_salary(text)
            except:
                continue
    except:
        pass
    
    return None


def _extract_by_text_search(page):
    """Extract salary by searching visible text."""
    try:
        # Get all text elements containing £
        elements = page.query_selector_all("*:has-text('£')")
        
        salary_candidates = []
        for element in elements[:50]:  # Limit to first 50 to avoid timeout
            try:
                text = element.inner_text().strip()
                if _is_valid_salary(text) and len(text) < 100:
                    # Score based on salary indicators
                    score = 0
                    if '£' in text: score += 10
                    if '-' in text: score += 5
                    if any(word in text.lower() for word in ['year', 'hour', 'annum', 'day', 'week']): score += 5
                    if re.search(r'£[\d,]+', text): score += 10
                    
                    salary_candidates.append((text, score))
            except:
                continue
        
        # Return highest scored candidate
        if salary_candidates:
            salary_candidates.sort(key=lambda x: x[1], reverse=True)
            return _clean_salary(salary_candidates[0][0])
    except:
        pass
    
    return None


def _extract_by_javascript(page):
    """Extract salary using JavaScript evaluation."""
    try:
        salary = page.evaluate("""
            () => {
                // Search for salary in all text nodes
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                let node;
                const salaryPattern = /£[\d,]+(?:\.\d{2})?(?:\s*-\s*£?[\d,]+(?:\.\d{2})?)?(?:\s*(?:a year|an hour|per hour|per annum|p\.a\.|pa))?/gi;
                
                while (node = walker.nextNode()) {
                    const text = node.nodeValue;
                    if (text && salaryPattern.test(text)) {
                        const match = text.match(salaryPattern);
                        if (match && match[0].length > 2) {
                            return match[0];
                        }
                    }
                }
                
                // Fallback: Check common salary containers
                const salaryElements = document.querySelectorAll('[data-testid*="salary"], [class*="salary"], [aria-label*="salary"]');
                for (const elem of salaryElements) {
                    if (elem.textContent && elem.textContent.includes('£')) {
                        return elem.textContent.trim();
                    }
                }
                
                return null;
            }
        """)
        
        if salary and _is_valid_salary(salary):
            return _clean_salary(salary)
    except:
        pass
    
    return None


def _extract_by_html_regex(page):
    """Extract salary using regex on full HTML."""
    try:
        html = page.content()
        
        # Remove script and style tags
        html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
        html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)
        
        # Comprehensive salary patterns
        patterns = [
            r'£\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:-|–|to)\s*£?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:per\s+)?(?:year|annum|p\.?a\.?)',
            r'£\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:-|–|to)\s*£?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:per\s+)?(?:hour|hr)',
            r'£\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:per\s+)?(?:year|annum|p\.?a\.?)',
            r'£\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:per\s+)?(?:hour|hr)',
            r'£\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:-|–|to)\s*£?\d{1,3}(?:,\d{3})*(?:\.\d{2})?',
            r'£\d{1,3}(?:,\d{3})*(?:\.\d{2})?',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, html, re.IGNORECASE)
            if matches:
                # Filter out unlikely matches
                valid_matches = [m for m in matches if len(m) > 2 and len(m) < 100]
                if valid_matches:
                    return _clean_salary(valid_matches[0])
    except:
        pass
    
    return None


def _is_valid_salary(text):
    """Check if text contains valid salary information."""
    if not text or len(text) > 200:
        return False
    
    # Must contain £ symbol
    if '£' not in text:
        return False
    
    # Must contain numbers
    if not re.search(r'\d', text):
        return False
    
    # Exclude obvious non-salary content
    exclude_words = ['apply', 'click', 'view', 'save', 'share', 'report', 'sign']
    if any(word in text.lower() for word in exclude_words):
        return False
    
    return True


def _clean_salary(salary_text):
    """Clean and format salary text."""
    # Remove excessive whitespace
    salary_text = re.sub(r'\s+', ' ', salary_text).strip()
    
    # Extract just the salary part if mixed with other text
    patterns = [
        r'£\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:-|–|to)\s*£?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:per\s+)?(?:year|annum|p\.?a\.?|hour|hr|week|day|month)',
        r'£\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:per\s+)?(?:year|annum|p\.?a\.?|hour|hr|week|day|month)',
        r'£\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:-|–|to)\s*£?\d{1,3}(?:,\d{3})*(?:\.\d{2})?',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, salary_text, re.IGNORECASE)
        if match:
            return match.group(0).strip()
    
    # If no pattern matches but we have £ and numbers, return as is (up to 50 chars)
    if '£' in salary_text and re.search(r'\d', salary_text):
        return salary_text[:50].strip()
    
    return salary_text


# Easy integration function for your existing code
def get_indeed_salary(job_url):
    """
    Simple wrapper function for easy integration.
    Just call: salary = get_indeed_salary(job_url)
    """
    if not job_url or 'indeed.com' not in job_url:
        return 'N/A'
    
    salary = scrape_indeed_salary(job_url)
    print(f"💰 Salary for {job_url[-20:]}: {salary}")
    return salary

