import os
import logging
from datetime import datetime

# Create logs directory if it doesn't exist
os.makedirs('data/logs', exist_ok=True)

# Set up logger
logger = logging.getLogger('job_scraper')
logger.setLevel(logging.INFO)

# Create console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# Create file handler
log_filename = f'data/logs/{datetime.now().strftime("%Y%m%d")}_scraper.log'
file_handler = logging.FileHandler(log_filename)
file_handler.setLevel(logging.INFO)

# Create formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
file_handler.setFormatter(formatter)

# Add handlers to logger
logger.addHandler(console_handler)
logger.addHandler(file_handler)