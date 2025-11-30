from datetime import datetime

from supabase import create_client, Client
import os

SUPABASE_URL = "https://pmddjinsavovomdhxnye.supabase.co" # Add these
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZGRqaW5zYXZvdm9tZGh4bnllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0Mzc3NCwiZXhwIjoyMDY4NDE5Nzc0fQ.uruPpO-6rt5QjMFjYo2xg7y5lSkt5mMDPpCVgMEss6g"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def insert_jobs(jobs, data_source: str):
    if not jobs:
        print("⚠️ No jobs to insert.")
        return 0, 0

    try:
        print(f"🗑️ Deleting existing jobs for data source: {data_source}")
        #Todo main table
        delete_response = supabase.table("jobs").delete().eq("data_source", data_source).execute()

        deleted_count = len(delete_response["data"]) if "data" in delete_response else 0

        # Set default posted_date to today
        today_str = datetime.today().strftime("%Y-%m-%d")

        cleaned_jobs = []
        for job in jobs:
            job.pop("id", None)
            job["data_source"] = data_source
            job["posted_date"] = job.get("posted_date") or today_str
            cleaned_jobs.append(job)

        print(f"📥 Inserting {len(cleaned_jobs)} jobs...")
        # todo main table
        insert_response = supabase.table("jobs").insert(cleaned_jobs).execute()

        if "error" in insert_response and insert_response["error"]:
            print(f"❌ Insert error: {insert_response['error']['message']}")
            return 0, deleted_count

        print("✅ Jobs inserted successfully.")
        return len(cleaned_jobs), deleted_count

    except Exception as e:
        print(f"❌ Exception while inserting jobs: {e}")
        return 0, 0
