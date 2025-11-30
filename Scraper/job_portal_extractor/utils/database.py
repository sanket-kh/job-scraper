import os
import traceback
from datetime import datetime
import pandas as pd
from sqlalchemy import create_engine, Column, Integer, String, Date, MetaData, Table, inspect, insert, select, update, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.sql.expression import exists

from utils.notification import notify_failure
from utils.logger import logger
from utils.config import Settings

# Define the SQLAlchemy Base
Base = declarative_base()
settings = Settings()

# Define Job columns
JOB_COLUMNS = [
    "job_title",
    "company_name",
    "company_logo",
    "salary",
    "posted_date",
    "experience",
    "location",
    "apply_link",
    "description",
    "data_source"
]


class Job(Base):
    """Database model for job listings"""
    __tablename__ = 'jobs_duplicate'
    
    id = Column(Integer, primary_key=True)
    job_title = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)
    company_logo = Column(Text, nullable=True)
    salary = Column(String(100), nullable=True)
    posted_date = Column(Text, nullable=False)
    experience = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    apply_link = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    data_source = Column(String(180), nullable=False)


class DatabaseManager:
    """Handles database operations for job scrapers"""
    
    def __init__(self):
        self.engine, self.Session = self._setup_database()
    
    def _setup_database(self):
        """Initialize the database connection and tables"""
        try:
            # Create database engine - using connection string from settings
            engine = create_engine(settings.DATABASE_URL, echo=False)
            
            # Create tables
            Base.metadata.create_all(engine)
            
            # Create session factory
            Session = sessionmaker(bind=engine)
            
            return engine, Session
        except Exception as e:
            error_message = f"Failed to set up database: {str(e)}"
            notify_failure(error_message, "setup_database")
            raise

    def batch_upsert_jobs(self, job_list, data_source):
        """Batch insert job listings into the database after deleting existing records with the same source"""
        session = self.Session()
        try:
            if not job_list:
                logger.info("No jobs to insert")
                return 0, 0

            # Delete existing records from same data source
            delete_count = session.query(Job).filter(Job.data_source == data_source).delete()
            logger.info(f"Deleted {delete_count} existing records from source: {data_source}")

            job_records = []
            for raw_job in job_list:
                job_data = {}

                for col in JOB_COLUMNS:
                    if col in raw_job:
                        job_data[col] = raw_job[col]
                    elif col == "posted_date":
                        job_data[col] = datetime.now().date()
                    elif col in ["job_title", "company_name", "apply_link", "data_source", "description"]:
                        job_data[col] = f"Default {col}"
                    else:
                        job_data[col] = None

                job_records.append(job_data)

            if job_records:
                session.bulk_insert_mappings(Job, job_records)
                session.commit()
            print("No Exception So Far")   
            return len(job_records), delete_count
            

        except Exception as e:
            session.rollback()
            error_message = f"Database batch insert failed: {str(e)}\n{traceback.format_exc()}"
            notify_failure(error_message, "batch_upsert_jobs")
                
            raise
        
        finally:
            print("Sucessfully Inserted")
            session.close()