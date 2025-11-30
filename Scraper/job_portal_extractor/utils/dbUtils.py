from sqlalchemy import create_engine, Column, Integer, String, Text, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from utils.notification import notify_success,notify_failure,send_message

Base = declarative_base()

_engine = None
_Session = None

def get_engine():
    global _engine
    if _engine is None:
        DATABASE_URL = "postgresql://postgres.pmddjinsavovomdhxnye:AEWeSCJ$Cc9EFYy@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
        _engine = create_engine(DATABASE_URL)
    return _engine

def get_session():
    global _Session
    if _Session is None:
        _Session = sessionmaker(bind=get_engine())
    return _Session()


class Job(Base):
    __tablename__ = 'jobs'
    
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


def init_db():
    """Initialize SQLAlchemy engine and create tables if they don't exist"""
    try:
        DATABASE_URL = "postgresql://postgres.pmddjinsavovomdhxnye:AEWeSCJ$Cc9EFYy@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
        
        # Create SQLAlchemy engine
        engine = get_engine()
        Session = get_session()
        
        # Check if table exists, create if not
        inspector = inspect(engine)
        # todo main table
        if not inspector.has_table('jobs'):
            print("Creating jobs table...")
            Base.metadata.create_all(engine)
            print("Table created successfully")
        else:
            print("Jobs table already exists")
            
        # Test connection
        with engine.connect() as conn:
            print("Database connection test successful")
            
    except Exception as e:
        error_message = f"Failed to initialize database: {str(e)}"
        print(error_message)
        raise


def insert_jobs_to_db(jobs_data):
    """Insert scraped jobs into the database."""
    if _engine is None:
        init_db()
    
    session = get_session()
    try:
        count = 0
        for job_data in jobs_data:
            job = Job(
                job_title=job_data.get('job_title', ''),
                company_name=job_data.get('company_name', ''),
                company_logo=job_data.get('company_logo', None),
                salary=str(job_data.get('salary')) if job_data.get('salary') else None,
                posted_date=job_data.get('posted_date', ''),
                experience=job_data.get('experience', None),
                location=job_data.get('location', ''),
                apply_link=job_data.get('apply_link', ''),
                description=job_data.get('description', None),
                data_source=job_data.get('data_source', 'glassdoor')
            )
            session.add(job)
            count += 1
        
        session.commit()
        print(f"Successfully inserted {count} jobs into the database")
        notify_success(f"Successfully inserted {count} jobs into the database")
        return count
    except Exception as e:
        session.rollback()
        error_message = f"Failed to insert jobs: {str(e)}"
        print(error_message)
        notify_failure(error_message, " at Insert Jobs")
        raise
    finally:
        session.close()

def delete_jobs_by_source(source):
    """Delete jobs by data source."""
    if _engine is None:
        init_db()
    if not source:
        print("No Source given, returning... ")
        return
    
    session = get_session()
    try:
        count = session.query(Job).filter(Job.data_source == source).delete()
        session.commit()
        print(f"Successfully deleted {count} jobs with source '{source}'")
        return count
    except Exception as e:
        session.rollback()
        error_message = f"Failed to delete jobs: {str(e)}"
        print(error_message)
        raise
    finally:
        session.close()
