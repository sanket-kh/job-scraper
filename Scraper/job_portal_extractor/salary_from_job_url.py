import asyncio

import requests
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright


async def scrape_salary_from_job_url(url: str) -> str | None:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto(url, wait_until="domcontentloaded")
        print('page', page.content())
        try:
            await page.wait_for_selector("div[data-testid]", timeout=10000)

            print(page)

            salary_divs = await page.query_selector_all("div[data-testid]")

            for div in salary_divs:
                text = (await div.inner_text()).strip()
                # crude check if text looks like a salary
                if any(c in text for c in ["£", "$", "€"]) and any(
                        word in text.lower() for word in ["hour", "year", "month", "week"]):
                    await browser.close()
                    return text

            await browser.close()
            return None
        except Exception as e:
            print(f"Error scraping salary: {e}")
            await browser.close()
            return None


if __name__ == "__main__":
    url = "https://uk.indeed.com/viewjob?jk=e9bd6c0932cd3d5a"  # replace with actual job URL
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    print(soup)
    salary = asyncio.run(scrape_salary_from_job_url(url))
    print(f"Salary found: {salary}")
