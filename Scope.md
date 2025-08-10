WEBSCRAPER
====================
1. 8 sites in the UK
2. 24 hour/ frequency
- Job boards to target include:
- LinkedIn
- Reed
- Indeed
- Monster
- CV Library
- Totaljobs
- Glassdoor
- NHS Jobs

3. Set telegram alert message along with error message and summary everyday

4. Role name, Company name:

Jobs to be scraped - according to CSV excel file with company list 
(company names may not exactly match as it will be their official registered names ending with Ltd, Plc etc hence we will use fuzzy logic to match as much as we can (>70%). 

Eg: On job boards, a role will be listed as Barclays. But on the excel, name will be Barclays Bank PLC. This role should be scraped. 

Most important parameter - job should be from company on the excel

Other parameters:
A. If available, Salary >33.5k (hourly paid roles should not be scraped eg: £12 / hr)
- Exception: All Nhs jobs will only be scraped with keyword match. It says in below job under additional information about "Applications from job seekers who require current Skilled worker sponsorship to work in the UK are welcome and will be considered". We must use this to scrape. Salary filter will be ignored for this job board. 
https://www.jobs.nhs.uk/candidate/jobadvert/B0462-25-0032?language=en- 

B. Role should be full time / permanent

(part-time/hourly/contract/maternity cover roles should not be scraped)

5. Job Description - we need this info

6. URL - we need this to be redirected to the actual company page link instead of CV Library / other 6 sites wherever possible.

if external page is linked, then that URL should be scraped instead of job board. 
If not redirecting externally, then it is fine to have the job board landing page. But preference should be external link (i.e actual company page where the role exists).

7. Date posted - from source code of career page.

8. Location (city, country)

9. Logo of company (important)

10. Currency in £

11. Github ACTIONS to automate the scripts every 24 hrs.