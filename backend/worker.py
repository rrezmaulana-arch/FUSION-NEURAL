import os
from celery import Celery
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Gunakan Native Redis URI dari env, atau fallback ke localhost
REDIS_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")

# Inisialisasi Aplikasi Celery
celery_app = Celery(
    "fusion_neural_workers",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Jakarta",
    enable_utc=True,
    worker_concurrency=4, # Mampu menjalankan 4 agen secara paralel murni
)

@celery_app.task(name="process_neural_ticket")
def process_ticket(ticket_id: str, t_data: dict):
    """
    Worker terpisah yang ditarik dari Redis. 
    Akan mengeksekusi LLM tanpa membebani thread API FastAPI.
    """
    agent_name = t_data.get("agent", "Unknown Agent")
    task_title = t_data.get("title", "No Title")
    
    print(f"[CELERY WORKER] 🚀 Memulai tugas untuk {agent_name} | ID: {ticket_id}")
    
    # Karena eksekusi LLM kita sebelumnya menggunakan asyncio,
    # kita jalankan event loop di dalam thread Celery ini.
    try:
        from main import process_ticket_task # Import fungsinya dari main.py
        
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        loop.run_until_complete(process_ticket_task(t_data, ticket_id))
        
        return {"status": "success", "ticket_id": ticket_id, "agent": agent_name}
    except Exception as e:
        print(f"[CELERY ERROR] ❌ Gagal memproses tiket {ticket_id}: {str(e)}")
        return {"status": "error", "message": str(e)}

# Cara menjalankan worker ini di terminal production:
# celery -A worker.celery_app worker --loglevel=info
