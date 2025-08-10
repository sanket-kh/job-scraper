from rapidfuzz import process

def is_company_match_above_70(company_name,company_list):
    score = 0
    match = None
    if company_list:
        try:
            match, score, _ = process.extractOne(company_name, company_list)
        except Exception as e:
            print(f"Error in fuzzy matching: {e}")
            match, score = company_name, 0
    return score > 70;