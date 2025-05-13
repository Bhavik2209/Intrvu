import uvicorn
import os
import multiprocessing

if __name__ == "__main__":
    # Determine the number of workers based on CPU cores
    # A common practice is to use (2 * num_cores) + 1
    # This ensures efficient CPU utilization without overloading
    num_cores = multiprocessing.cpu_count()
    num_workers = (2 * num_cores) + 1
    
    # Print server configuration
    print(f"Starting server with {num_workers} workers (based on {num_cores} CPU cores)")
    
    # Run the server with multiple workers
    # Using 0.0.0.0 to bind to all network interfaces
    # This allows connections from other devices on the network
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        workers=num_workers,
        log_level="info",
        reload=False  # Disable reload in production with multiple workers
    )
