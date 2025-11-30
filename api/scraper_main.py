import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.params import Query
from supabase import create_client, Client
# from api.consts.table_consts import TableNames
supabase: Client = create_client('https://pmddjinsavovomdhxnye.supabase.co',
                                 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZGRqaW5zYXZvdm9tZGh4bnllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0Mzc3NCwiZXhwIjoyMDY4NDE5Nzc0fQ.uruPpO-6rt5QjMFjYo2xg7y5lSkt5mMDPpCVgMEss6g')

app = FastAPI()


# @app.get("/")
# def read_root():
#     return {"message": "Hello, FastAPI!"}


# run command: uvicorn scraper_main:app --reload
# url: http://127.0.0.1:8000/?location=lond

@app.get("/fetch_jobs")
def fetch_jobs(
        request: Request,
        job_title: str | None = Query(None),
        company_name: str | None = Query(None),
        # salary: str | None = Query(None),
        posted_date: datetime | None = Query(None),
        location: str | None = Query(None),
        source: str | None = Query(None),
        access_key: str | None = Query(None),
):
    user_check = supabase.table("api_users").select("id").eq("access_key", access_key).execute()
    if not user_check.data:
        raise HTTPException(status_code=403, detail="Invalid or unauthorized access key")
    user_id = user_check.data[0]["id"]

    # 3️⃣ Log access
    ip_address = request.client.host
    supabase.table("api_logs").insert({
        "user_id": user_id,
        "user_name": user_check.data['name'],
        "access_key": access_key,
        "ip_address": ip_address,
        "endpoint": "/fetch_jobs",
    }).execute()

    query = supabase.table("jobs").select("*")

    # Apply filters conditionally
    if job_title:
        query = query.ilike("job_title", f"%{job_title}%")
    if company_name:
        query = query.ilike("company_name", f"%{company_name}%")
    if location:
        query = query.ilike("location", f"%{location}%")
    # if salary:
    #     query = query.ilike("salary", f"%{salary}%")
    # if posted_date:
    #     query = query.ilike("posted_date", f"%{posted_date}%")
    if source:
        query = query.ilike("data_source", f"%{source}%")

    response = query.execute()

    return {"count": len(response.data), "data": response.data}


@app.get("/add_user")
def add_user(
        name: str = Query(..., description="User's full name"),
        email: str = Query(..., description="User's email"),
):
    # Generate access key
    access_key = str(uuid.uuid4())

    # Insert into Supabase
    data = {
        "name": name,
        "email": email,
        "access_key": access_key,
        "created_at": datetime.utcnow().isoformat()
    }

    response = supabase.table("api_users").insert(data).execute()

    print('this is the response')
    print(response)
    if not response.data:
        raise HTTPException(status_code=400, detail=response.error.message)

    return {
        "message": "User added successfully!",
        "user": data
    }


# Remove a User

@app.get("/remove_user")
def remove_user(access_key: str = Query(..., description="User access key")):
    # Delete user using their access key
    try:
        # Check if user exists first
        user_check = supabase.table("api_users").select("*").eq("access_key", access_key).execute()
        if not user_check.data:
            raise HTTPException(status_code=404, detail="User not found")

        # Delete user
        supabase.table("api_users").delete().eq("access_key", access_key).execute()

        return {
            "message": "User removed successfully",
            "deleted_user": user_check.data[0]  # Return details of deleted user
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing user: {str(e)}")
