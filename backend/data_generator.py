import os
import signal
import sys
import time

PID_FILE = "data_generator.pid"

# ---------------------------------------------------------
# GRACEFUL SHUTDOWN HANDLER
# ---------------------------------------------------------
def graceful_shutdown(signum, frame):
    print(f"\n[DATA GEN] Received shutdown signal {signum}. Closing cleanly...")
    
    # 1. Clean up PID file immediately
    if os.path.exists(PID_FILE):
        try:
            os.remove(PID_FILE)
            print("[DATA GEN] Removed lock file.")
        except Exception as e:
            print(f"[DATA GEN] Could not remove lock file: {e}")
    
    # 2. Release memory / flush database here
    # (e.g. self.ml_model = None, flush_logs(), etc.)
    print("[DATA GEN] Memory released. Exiting.")
    sys.exit(0)

# Register signals so Ctrl+C or terminal closes trigger the shutdown
signal.signal(signal.SIGINT, graceful_shutdown)
signal.signal(signal.SIGTERM, graceful_shutdown)

# ---------------------------------------------------------
# SINGLE INSTANCE GUARD
# ---------------------------------------------------------
if os.path.exists(PID_FILE):
    print("[DATA GEN] Warning: Another instance might be running. Checking lock...")
    try:
        with open(PID_FILE, 'r') as f:
            old_pid = int(f.read().strip())
        
        # Check if process is actually running
        # sending signal 0 does nothing but raises OSError if process doesn't exist
        os.kill(old_pid, 0) 
        
        print(f"❌ [DATA GEN] Error: Process {old_pid} is already running! Exiting to prevent duplicates.")
        sys.exit(1)
        
    except OSError:
        # Process doesn't exist, PID file is stale (likely crashed)
        print("[DATA GEN] Found stale lock file. Cleaning up...")
        os.remove(PID_FILE)
    except Exception as e:
        print(f"[DATA GEN] Error reading lock: {e}")
        sys.exit(1)

# Assume control and drop lock
with open(PID_FILE, 'w') as f:
    f.write(str(os.getpid()))

# ---------------------------------------------------------
# DATA GENERATOR LOOP (Mock)
# ---------------------------------------------------------
def start_generator():
    """Your Numpy/Pandas ML synthetic data generation logic"""
    print(f"[DATA GEN] 🚀 Generator started successfully! (PID {os.getpid()})")
    print(f"[DATA GEN] Single Instance Guard active.")
    
    try:
        while True:
            # Simulate generating synthetic sensor data here
            print(".", end="", flush=True)
            time.sleep(1)
            
    except Exception as e:
        print(f"\n[DATA GEN] Fatal error during generation: {e}")
        graceful_shutdown(signal.SIGINT, None)

if __name__ == '__main__':
    start_generator()