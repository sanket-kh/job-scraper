from datetime import datetime, timedelta

from bs4 import BeautifulSoup


def html_to_text_with_breaks(html_content: str) -> str:
    """
    Converts HTML content to plain text while preserving line breaks.
    """
    # Parse HTML
    soup = BeautifulSoup(html_content, "html.parser")

    # Replace <br> and <p> with newlines
    for br in soup.find_all("br"):
        br.replace_with("\n")
    for p in soup.find_all("p"):
        p.insert_before("\n")

    # Extract text and strip extra spaces
    text = soup.get_text()
    return "\n".join(line.strip() for line in text.splitlines() if line.strip())


def get_posted_date(age_in_days: str) -> str:

    age_in_days = int(age_in_days)

    """
    Given the age in days, return the posted date in YYYY-MM-DD format.
    """
    posted_date = datetime.now() - timedelta(days=age_in_days)
    return posted_date.strftime("%Y-%m-%d")
