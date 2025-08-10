import html
import re
import psycopg2
import xml.etree.ElementTree as ET
from xml.dom import minidom
from supabase import create_client, Client


# 🔧 Config
PG_CONNECTION_STRING = "postgresql://postgres.pmddjinsavovomdhxnye:AEWeSCJ$Cc9EFYy@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
table_name = "jobs"
output_file = "jobs.xml"
batch_size = 100

# 🔧 Supabase credentials
SUPABASE_URL = "https://pmddjinsavovomdhxnye.supabase.co" # Add these
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZGRqaW5zYXZvdm9tZGh4bnllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0Mzc3NCwiZXhwIjoyMDY4NDE5Nzc0fQ.uruPpO-6rt5QjMFjYo2xg7y5lSkt5mMDPpCVgMEss6g"
BUCKET_NAME = "xml-files"
STORAGE_PATH = "exports/jobs.xml"  # folder/filename in bucket


# ✅ Step 1: Fetch records in batches
def fetch_jobs_in_batches():
    conn = psycopg2.connect(PG_CONNECTION_STRING)
    cursor = conn.cursor()

    offset = 0
    batch_num = 1

    while True:
        query = f"""
            SELECT job_title, company_name, company_logo, salary, location, apply_link, description, posted_date
            FROM {table_name}
            ORDER BY id
            LIMIT {batch_size} OFFSET {offset}
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]

        if not rows:
            break

        print(f"📦 Fetched batch {batch_num}: {len(rows)} rows")
        yield [dict(zip(columns, row)) for row in rows]

        offset += batch_size
        batch_num += 1

    cursor.close()
    conn.close()

def clean_html(raw_value):
    if not raw_value:
        return ""
    unescaped = html.unescape(str(raw_value))  # Converts &lt;p&gt; to <p>
    return re.sub(r'<[^>]+>', '', unescaped)   # Removes <...> tags

# ✅ Step 2: Convert all batches to XML root
def convert_batches_to_xml():
    root = ET.Element("jobs")

    for batch in fetch_jobs_in_batches():
        for row in batch:
            job_el = ET.SubElement(root, "job")
            for key, value in row.items():
                el = ET.SubElement(job_el, key)
                el.text = clean_html(value) if value is not None else ""
                

    return root

# ✅ Step 3: Pretty print and save
def save_pretty_xml(root):
    rough_string = ET.tostring(root, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    pretty_xml = reparsed.toprettyxml(indent="  ")

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(pretty_xml)

    print(f"✅ XML saved to {output_file}")

def upload_to_supabase_storage(file_path):
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Client Created")

    with open(file_path, "rb") as f:
        file_bytes = f.read()
    print("File Read")
    bucket = BUCKET_NAME
    path = STORAGE_PATH

    files = supabase.storage.from_(bucket).list(path.rsplit("/", 1)[0] or "")
    if any(item["name"] == path.rsplit("/", 1)[-1] for item in files):
        supabase.storage.from_(bucket).remove([path])

    # Upload the new file
    res = supabase.storage.from_(bucket).upload(
        path,
        file_bytes,
        {"content-type": "application/xml"}
    )

    print("Uploaded")

    if res is None or getattr(res, "error", None):
        print("❌ Upload failed")
    else:
        print(f"✅ Uploaded XML to Supabase Storage as {STORAGE_PATH}")



# ✅ Main
if __name__ == "__main__":
    try:
        print("🚀 Starting job XML export...")
        root = convert_batches_to_xml()
        save_pretty_xml(root)
        print("Starting Next")
        upload_to_supabase_storage(output_file)
    except Exception as e:
        print(f"❌ Error: {e}")
