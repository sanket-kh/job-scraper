import requests
from datetime import datetime

from Scraper.job_portal_extractor.utils.logger import logger

myChatId = '446530656'
hardilChatId = '1067240798'
chat_id = hardilChatId
token = '8193810562:AAG8tyBYxgn9VcU7NcnB8jrdL1AYad-OO2U'

def send_message(message: str):
    '''Send notification to bot'''
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage?chat_id={chat_id}&text={message}"
        response = requests.get(url)
        if response.status_code == 200:
            logger.info("Sent message successfully")
        else:
            logger.error(f"Message not sent. Status code: {response.status_code}")
    except Exception as e:
        logger.error(f"Failed to send message: {e}")

# Keep track of the chat_id once obtained
def notify_failure(error_message, location="Unknown"):
    """Send failure notification via Telegram"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    message = f"❌  at {timestamp} Website: {location}\nError: {error_message}"
    send_message( message )
    
def notify_success(details, location="Unknown"):
    """Send success notification via Telegram"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    message = f"✅  at {timestamp} Website: {location}\nDetails: {details}"
    send_message( message )