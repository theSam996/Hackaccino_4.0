import signal
import sys
import psutil
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
import os

# ---------------------------------------------------------
# PORT KILLER: Ensures we never hit Port Already In Use
# ---------------------------------------------------------
PORT = 8000

def kill_existing_on_port(port):
    """Scan through running processes and kill anything hogging `port`."""
    print(f"Scanning for zombie processes on port {port}...")
    try:
        for proc in psutil.process_iter(attrs=['pid', 'name']):
            try:
                for conn in proc.connections(kind='inet'):
                    if conn.laddr.port == port:
                        print(f"[*] Found ghost process PID {proc.info['pid']} on port {port}. Terminating...")
                        os.kill(proc.info['pid'], signal.SIGTERM)
            except (psutil.AccessDenied, psutil.NoSuchProcess, psutil.ZombieProcess):
                pass
    except Exception as e:
        print(f"Warning during port scan: {e}")

# Call immediately on startup
kill_existing_on_port(PORT)

# ---------------------------------------------------------
# FASTAPI APP
# ---------------------------------------------------------
app = FastAPI(title="Cyber-Physical Anomaly Detection API")

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "FastAPI Server Running"}

# Dummy SSE Endpoint to test stream
@app.get("/stream")
def sse_stream():
    pass # Add your SSE implementation here

# ---------------------------------------------------------
# GRACEFUL SHUTDOWN (App Lifecycle)
# ---------------------------------------------------------
def handle_sigint(*args):
    print("\n[FASTAPI] Trapped shutdown signal! Graceful cleanup initialized.")
    # Add any explicit DB closing or ML model unloading here
    sys.exit(0)

signal.signal(signal.SIGINT, handle_sigint)
signal.signal(signal.SIGTERM, handle_sigint)

if __name__ == "__main__":
    print(f"[FASTAPI] Booting server on port {PORT}...")
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True, workers=1)