import requests
import pandas as pd
import re
from rapidfuzz import process

from Scraper.job_portal_extractor.utils.common_utils import html_to_text_with_breaks, get_posted_date
from utils.notification import notify_success,notify_failure,send_message

from utils.dbUtils import init_db, insert_jobs_to_db , delete_jobs_by_source;

from constants.glassDoorConstants import glassDoorCookies,glassDoorHeaders

# Global variables
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
        print(error_message)
        return ""

def get_company_list():
    """Loads and cleans the list of target companies from CSV."""
    global company_list
    try:
        df = pd.read_csv(r"data/2025-04-04_-_Worker_and_Temporary_Worker.csv")
        df['Organisation Name'] = df['Organisation Name'].apply(clean_name)
        company_list = list(df['Organisation Name'])
        print(f"Loaded {len(company_list)} companies from CSV")
    except Exception as e:
        error_message = f"Failed to load company list: {str(e)}"
        print(error_message, "get_company_list")
        raise

def scrape_glassdoor_jobs(cookies, headers, url):
    """Main function to scrape Glassdoor jobs."""
    import requests
    import time
    
    # Static parameters for POST
    base_url = "https://www.glassdoor.co.uk/graph"
    base_variables = {
        'excludeJobListingIds': [],
        'filterParams': [
            {'filterKey': 'maxSalary', 'values': '9000000'},
            {'filterKey': 'minSalary', 'values': '33500'},
        ],
        'keyword': '',
        'locationId': 7287,
        'locationType': 'STATE',
        'numJobsToShow': 5,
        'originalPageUrl': url,
        'parameterUrlInput': 'IL.0,10_IS7287',
        'pageType': 'SERP',
        'queryString': 'maxSalary=9000000&minSalary=250000',
        'seoFriendlyUrlInput': 'england-uk-jobs',
        'seoUrl': True,
        'includeIndeedJobAttributes': False
    }

    # Initial page cursor and number
    initial_cursor = None
    initial_page_number = 1

    # Container for scraped jobs
    scraped_jobs = []

    def extract_external_url(cookies, headers, queryString):
        """Extract external URL from Glassdoor."""
        try:
            json_data = [
                {
                    'operationName': 'SerpRedirectorQuery',
                    'variables': {
                        'baseUrl': 'www.glassdoor.co.uk',
                        'queryString': f'{queryString}',
                    },
                    'query': 'mutation SerpRedirectorQuery($applyData: ApplyDataInput, $baseUrl: String!, $queryString: String!) {\n  redirector(\n    redirectorContextInput: {applyData: $applyData, baseUrl: $baseUrl, queryString: $queryString}\n  ) {\n    redirectUrl\n    __typename\n  }\n}\n',
                },
            ]

            response = requests.post('https://www.glassdoor.co.uk/graph', cookies=cookies, headers=headers, json=json_data)

            result = response.json()
            url = None
            if response.status_code == 200:
                url = result[0]['data']['redirector']['redirectUrl']
            else:
                url = None
            
            return url

        except Exception as e:
            error_message = f"Failed to extract external URL: {str(e)}"
            print(error_message)
            print(error_message, "extract_external_url")
            return None

    def extract_description(cookies, headers, jobSearchTrackingKey, jl, queryString):
        """Extract job description from Glassdoor."""
        try:
            json_data = [
            {
                'operationName': 'uilTrackingMutation',
                'variables': {
                    'events': [
                        {
                            'eventType': 'JAVASCRIPT_DETECTION',
                            'jobSearchTrackingKey': jobSearchTrackingKey,
                            'pageType': 'SERP',
                        },
                    ],
                },
                'query': 'mutation uilTrackingMutation($events: [EventContextInput]!) {\n  trackEvents(events: $events) {\n    eventType\n    resultStatus\n    message\n    clickId\n    clickGuid\n    __typename\n  }\n}\n',
            },
            {
                'operationName': 'JobDetailQuery',
                'variables': {
                    'enableReviewSummary': True,
                    'jl': jl,
                    'queryString': queryString,
                    'pageTypeEnum': 'SERP',
                    'countryId': 2,
                },
                'query': 'query JobDetailQuery($jl: Long!, $queryString: String, $enableReviewSummary: Boolean!, $pageTypeEnum: PageTypeEnum, $countryId: Int) {\n  jobview: jobView(\n    listingId: $jl\n    contextHolder: {queryString: $queryString, pageTypeEnum: $pageTypeEnum}\n  ) {\n    ...JobDetailsFragment\n    employerReviewSummary @include(if: $enableReviewSummary) {\n      reviewSummary {\n        highlightSummary {\n          sentiment\n          sentence\n          categoryReviewCount\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment JobDetailsFragment on JobView {\n  employerBenefits {\n    benefitsOverview {\n      benefitsHighlights {\n        benefit {\n          commentCount\n          icon\n          name\n          __typename\n        }\n        highlightPhrase\n        __typename\n      }\n      overallBenefitRating\n      employerBenefitSummary {\n        comment\n        __typename\n      }\n      __typename\n    }\n    benefitReviews {\n      benefitComments {\n        id\n        comment\n        __typename\n      }\n      cityName\n      createDate\n      currentJob\n      rating\n      stateName\n      userEnteredJobTitle\n      __typename\n    }\n    numReviews\n    __typename\n  }\n  employerContent {\n    managedContent {\n      id\n      type\n      title\n      body\n      captions\n      photos\n      videos\n      __typename\n    }\n    __typename\n  }\n  employerAttributes {\n    attributes {\n      attributeName\n      attributeValue\n      __typename\n    }\n    __typename\n  }\n  gaTrackerData {\n    jobViewDisplayTimeMillis\n    requiresTracking\n    pageRequestGuid\n    searchTypeCode\n    trackingUrl\n    __typename\n  }\n  header {\n    jobLink\n    adOrderId\n    ageInDays\n    applicationId\n    appliedDate\n    applyUrl\n    applyButtonDisabled\n    categoryMgocId\n    campaignKeys\n    easyApply\n    employerNameFromSearch\n    employer {\n      activeStatus\n      bestProfile {\n        id\n        __typename\n      }\n      id\n      name\n      shortName\n      size\n      squareLogoUrl\n      __typename\n    }\n    expired\n    goc\n    gocId\n    hideCEOInfo\n    indeedJobAttribute {\n      education\n      skills\n      educationLabel\n      skillsLabel\n      yearsOfExperienceLabel\n      __typename\n    }\n    isIndexableJobViewPage\n    isSponsoredJob\n    isSponsoredEmployer\n    jobTitleText\n    jobType\n    jobTypeKeys\n    jobCountryId\n    jobResultTrackingKey\n    locId\n    locationName\n    locationType\n    normalizedJobTitle\n    payCurrency\n    payPeriod\n    payPeriodAdjustedPay {\n      p10\n      p50\n      p90\n      __typename\n    }\n    profileAttributes {\n      suid\n      label\n      match\n      type\n      __typename\n    }\n    rating\n    remoteWorkTypes\n    salarySource\n    savedJobId\n    seoJobLink\n    serpUrlForJobListing\n    sgocId\n    __typename\n  }\n  job {\n    description\n    discoverDate\n    eolHashCode\n    importConfigId\n    jobTitleId\n    jobTitleText\n    listingId\n    __typename\n  }\n  map {\n    address\n    cityName\n    country\n    employer {\n      id\n      name\n      __typename\n    }\n    lat\n    lng\n    locationName\n    postalCode\n    stateName\n    __typename\n  }\n  overview {\n    ceo(countryId: $countryId) {\n      name\n      photoUrl\n      __typename\n    }\n    id\n    name\n    shortName\n    squareLogoUrl\n    headquarters\n    links {\n      overviewUrl\n      benefitsUrl\n      photosUrl\n      reviewsUrl\n      salariesUrl\n      __typename\n    }\n    primaryIndustry {\n      industryId\n      industryName\n      sectorName\n      sectorId\n      __typename\n    }\n    ratings {\n      overallRating\n      ceoRating\n      ceoRatingsCount\n      recommendToFriendRating\n      compensationAndBenefitsRating\n      cultureAndValuesRating\n      careerOpportunitiesRating\n      seniorManagementRating\n      workLifeBalanceRating\n      __typename\n    }\n    revenue\n    size\n    sizeCategory\n    type\n    website\n    yearFounded\n    __typename\n  }\n  reviews {\n    reviews {\n      advice\n      cons\n      countHelpful\n      employerResponses {\n        response\n        responseDateTime\n        userJobTitle\n        __typename\n      }\n      employmentStatus\n      featured\n      isCurrentJob\n      jobTitle {\n        text\n        __typename\n      }\n      lengthOfEmployment\n      pros\n      ratingBusinessOutlook\n      ratingCareerOpportunities\n      ratingCeo\n      ratingCompensationAndBenefits\n      ratingCultureAndValues\n      ratingOverall\n      ratingRecommendToFriend\n      ratingSeniorLeadership\n      ratingWorkLifeBalance\n      reviewDateTime\n      reviewId\n      summary\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n',
            },
        ]

            response = requests.post('https://www.glassdoor.co.uk/graph', cookies=cookies, headers=headers, json=json_data)
            
            result = response.json()
            description = result[1]['data']['jobview']['job']['description']
            return description
        except Exception as e:
            error_message = f"Failed to extract job description: {str(e)}"
            print(error_message)
            print(error_message, "extract_description")
            return "No description available"
    
    try:
        # Function to fetch jobs for a page
        def fetch_jobs(page_cursor, page_number):
            json_data = [{
                'operationName': 'JobSearchResultsQuery',
                'variables': {
                    **base_variables,
                    'pageCursor': page_cursor,
                    'pageNumber': page_number,
                },
                'query': 'query JobSearchResultsQuery($excludeJobListingIds: [Long!], $filterParams: [FilterParams], $keyword: String, $locationId: Int, $locationType: LocationTypeEnum, $numJobsToShow: Int!, $originalPageUrl: String, $pageCursor: String, $pageNumber: Int, $pageType: PageTypeEnum, $parameterUrlInput: String, $queryString: String, $seoFriendlyUrlInput: String, $seoUrl: Boolean, $includeIndeedJobAttributes: Boolean) {\n  jobListings(\n    contextHolder: {queryString: $queryString, pageTypeEnum: $pageType, searchParams: {excludeJobListingIds: $excludeJobListingIds, filterParams: $filterParams, keyword: $keyword, locationId: $locationId, locationType: $locationType, numPerPage: $numJobsToShow, pageCursor: $pageCursor, pageNumber: $pageNumber, originalPageUrl: $originalPageUrl, seoFriendlyUrlInput: $seoFriendlyUrlInput, parameterUrlInput: $parameterUrlInput, seoUrl: $seoUrl, searchType: SR, includeIndeedJobAttributes: $includeIndeedJobAttributes}}\n  ) {\n    companyFilterOptions {\n      id\n      shortName\n      __typename\n    }\n    filterOptions\n    indeedCtk\n    jobListings {\n      ...JobListingJobView\n      __typename\n    }\n    jobSearchTrackingKey\n    jobsPageSeoData {\n      pageMetaDescription\n      pageTitle\n      __typename\n    }\n    paginationCursors {\n      cursor\n      pageNumber\n      __typename\n    }\n    indexablePageForSeo\n    searchResultsMetadata {\n      searchCriteria {\n        implicitLocation {\n          id\n          localizedDisplayName\n          type\n          __typename\n        }\n        keyword\n        location {\n          id\n          shortName\n          localizedShortName\n          localizedDisplayName\n          type\n          __typename\n        }\n        __typename\n      }\n      footerVO {\n        countryMenu {\n          childNavigationLinks {\n            id\n            link\n            textKey\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      helpCenterDomain\n      helpCenterLocale\n      jobAlert {\n        jobAlertId\n        __typename\n      }\n      jobSerpFaq {\n        questions {\n          answer\n          question\n          __typename\n        }\n        __typename\n      }\n      jobSerpJobOutlook {\n        occupation\n        paragraph\n        heading\n        __typename\n      }\n      showMachineReadableJobs\n      __typename\n    }\n    serpSeoLinksVO {\n      relatedJobTitlesResults\n      searchedJobTitle\n      searchedKeyword\n      searchedLocationIdAsString\n      searchedLocationSeoName\n      searchedLocationType\n      topCityIdsToNameResults {\n        key\n        value\n        __typename\n      }\n      topEmployerIdsToNameResults {\n        key\n        value\n        __typename\n      }\n      topOccupationResults\n      __typename\n    }\n    totalJobsCount\n    __typename\n  }\n}\n\nfragment JobListingJobView on JobListingSearchResult {\n  jobview {\n    header {\n      indeedJobAttribute {\n        skills\n        extractedJobAttributes {\n          key\n          value\n          __typename\n        }\n        __typename\n      }\n      adOrderId\n      ageInDays\n      easyApply\n      employer {\n        id\n        name\n        shortName\n        __typename\n      }\n      expired\n      occupations {\n        key\n        __typename\n      }\n      employerNameFromSearch\n      goc\n      gocId\n      isSponsoredJob\n      isSponsoredEmployer\n      jobCountryId\n      jobLink\n      jobResultTrackingKey\n      normalizedJobTitle\n      jobTitleText\n      locationName\n      locationType\n      locId\n      payCurrency\n      payPeriod\n      payPeriodAdjustedPay {\n        p10\n        p50\n        p90\n        __typename\n      }\n      rating\n      salarySource\n      savedJobId\n      seoJobLink\n      __typename\n    }\n    job {\n      descriptionFragmentsText\n      importConfigId\n      jobTitleId\n      jobTitleText\n      listingId\n      __typename\n    }\n    jobListingAdminDetails {\n      userEligibleForAdminJobDetails\n      __typename\n    }\n    overview {\n      shortName\n      squareLogoUrl\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n'
            }]
            response = requests.post(base_url, cookies=cookies, headers=headers, json=json_data)
            print(response.status_code)
            if response.status_code != 200:
                print(f"Request failed with status code: {response.status_code}")
                return None
            return response.json()

        # Start navigation
        next_cursor = initial_cursor
        page_number = initial_page_number

        while page_number<3:
            data = fetch_jobs(next_cursor, page_number)

            if not data:
                error_message = f"No data returned from page {page_number}"
                print(error_message)
                print(error_message, "scrape_glassdoor_jobs")
                break
                
            try:
                job_listings = data[0]['data']['jobListings']['jobListings']
                pagination_cursors = data[0]['data']['jobListings']['paginationCursors']
            except (KeyError, TypeError) as e:
                error_message = f"Stopping at page {page_number}: Unexpected response structure: {e}"
                print(error_message)
                print(error_message, "scrape_glassdoor_jobs")
                break
            
            for job_item in job_listings:
                try:
                    header = job_item.get('jobview', {}).get('header', {})
                    if not header:
                        continue
                        
                    _job_tracking_key = header.get('jobResultTrackingKey')
                    _partner_link = header.get('jobLink')
                    
                    if not _job_tracking_key or not _partner_link:
                        continue
                    
                    _job_link = header.get('seoJobLink')
                    if not _job_link:
                        continue
                        
                    _jl = _job_link.split('?jl=')[-1] if '?jl=' in _job_link else ''
                    
                    query_string = _partner_link.split("/partner/jobListing.htm?")[-1] if "/partner/jobListing.htm?" in _partner_link else ''
                    
                    # Make sure we have valid parameters before calling extract_description
                    if _job_tracking_key and _jl and query_string:
                        description = extract_description(cookies, headers, _job_tracking_key, _jl, query_string)
                    else:
                        description = None
                    
                    _partner_link = _partner_link.replace("GD_JOB_AD", "GD_JOB_VIEW")
                    query_string = _partner_link.split("/partner/jobListing.htm?")[-1] if "/partner/jobListing.htm?" in _partner_link else ''
                    external_link = extract_external_url(cookies, headers, query_string)
                    
                    url = _job_link if not external_link else external_link

                    if url.startswith("/"):
                        url = f"https://www.glassdoor.co.uk{url}"
                    
                    salary = None
                    salary_data = header.get('payPeriodAdjustedPay', {})
                    if salary_data and isinstance(salary_data, dict):
                        salary = salary_data.get('p50')
                    
                    employer_data = header.get('employer', {})
                    company_name = employer_data.get('name', '') if employer_data and isinstance(employer_data, dict) else ''
                    
                    if not company_name:
                        continue
                    
                    # Only attempt fuzzy matching if company_list has elements
                    score = 0
                    match = None
                    if company_list:
                        try:
                            match, score, _ = process.extractOne(company_name, company_list)
                        except Exception as e:
                            print(f"Error in fuzzy matching: {e}")
                            match, score = company_name, 0
                    if description is None:
                        continue

                    if (not company_list or score > 70) and (not salary or str(salary).lower() not in ['hour', 'day', 'hourly']):
                        overview = job_item.get('jobview', {}).get('overview', {})
                        company_logo = overview.get('squareLogoUrl', '') if overview else ''
                        
                        job_entry = {
                            "job_title": header.get('jobTitleText', ''),
                            "company_name": company_name,
                            "company_logo": company_logo,
                            "salary": salary,
                            "posted_date": get_posted_date(header.get('ageInDays', '')),
                            "experience": None,
                            "location": header.get('locationName', ''),
                            "apply_link": url,
                            "description": html_to_text_with_breaks(description),
                            "data_source": "glassdoor"
                        }
                        
                        scraped_jobs.append(job_entry)
                        
                except Exception as e:
                    print(f"Error processing job item: {e}")
                    continue

            print(f"Scraped page {page_number} with {len(job_listings)} jobs.")

            # Dynamically find next cursor
            next_page_cursor = None
            for p_cursor in pagination_cursors:
                if p_cursor.get('pageNumber') == page_number + 1:
                    next_page_cursor = p_cursor.get('cursor')
                    break

            if not next_page_cursor:
                print("No more pages available.")
                break

            next_cursor = next_page_cursor
            page_number += 1

            time.sleep(1)
        
        print(f"Scraped total {len(scraped_jobs)} jobs successfully.")
        return scraped_jobs
        
    except Exception as e:
        error_message = f"Failed during scraping: {str(e)}"
        print(error_message)
        print(error_message, "scrape_glassdoor_jobs")
        return []

def main():
    """Main function to run the scraper."""
    try:
        
        get_company_list()

        total_jobs = []
        # Scrape new jobs
        urls = [
            "https://www.glassdoor.co.uk/Job/england-uk-jobs-SRCH_IL.0,10_IS7287.htm?maxSalary=9000000&minSalary=300000",
             "https://www.glassdoor.co.uk/Job/scotland-uk-jobs-SRCH_IL.0,11_IS7289.htm?maxSalary=9000000&minSalary=300000",
            "https://www.glassdoor.co.uk/Job/wales-uk-jobs-SRCH_IL.0,8_IS7290.htm?maxSalary=9000000&minSalary=300000",
            "https://www.glassdoor.co.uk/Job/northern-ireland-uk-jobs-SRCH_IL.0,19_IS7288.htm?maxSalary=9000000&minSalary=300000"
        ]

        for url in urls:
            scraped_jobs = scrape_glassdoor_jobs(glassDoorCookies, glassDoorHeaders, url)
            total_jobs.extend(scraped_jobs)
        
        if total_jobs:
            # Initialize database
            init_db()
            # First, delete existing Glassdoor jobs
            delete_jobs_by_source("glassdoor")
            
            insert_jobs_to_db(total_jobs)
        print(f"Complete scraping process finished. Scraped and inserted {len(total_jobs)} jobs.")    
        notify_success(f"Complete scraping process finished. Scraped and inserted {len(total_jobs)} jobs." , "Glass Door")
            
    except Exception as e:
        error_message = f"Failed in main function: {str(e)}"
        print(error_message)
        notify_failure(error_message, "Glass Door")

if __name__ == "__main__":
    main()