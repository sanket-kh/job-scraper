import os
from dataclasses import dataclass
from typing import Optional

@dataclass
class Settings:
    """Application settings with defaults and environment variable overrides"""
    
    # Database settings
    DATABASE_URL: str = os.environ.get(
        'DATABASE_URL', 
        'postgresql://postgres.pmddjinsavovomdhxnye:AEWeSCJ$Cc9EFYy@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
    )
    
    # Telegram notification settings
    TELEGRAM_TOKEN: str = os.environ.get(
        'TELEGRAM_TOKEN',
        '8193810562:AAG8tyBYxgn9VcU7NcnB8jrdL1AYad-OO2U'
    )
    
    # Scraping settings
    MAX_WORKERS: int = int(os.environ.get('MAX_WORKERS', '15'))
    MAX_PAGES: Optional[int] = int(os.environ.get('MAX_PAGES', '0')) or None  # None if 0
    
    # Request settings
    USER_AGENT: str = os.environ.get(
        'USER_AGENT',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    )
    
    # Data paths
    DATA_DIR: str = os.environ.get('DATA_DIR', 'data')
    COMPANY_LIST_PATH: str = os.environ.get(
        'COMPANY_LIST_PATH',
        'data/2025-04-04_-_Worker_and_Temporary_Worker.csv'
    )


def load_company_list(file_path: str = None) -> list:
    """Load company list from CSV file"""
    import pandas as pd
    from utils.logger import logger
    from utils.notification import notify_failure
    
    settings = Settings()
    try:
        path = file_path or settings.COMPANY_LIST_PATH
        df = pd.read_csv(path)
        return list(df['Organisation Name'])
    except Exception as e:
        error_msg = f"Failed to load company list: {str(e)}"
        logger.error(error_msg)
        notify_failure(error_msg, "load_company_list")
        return []