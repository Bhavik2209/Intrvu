import uvicorn
import os
import multiprocessing
import sys
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("server")

if __name__ == "__main__":
    try:
        # Determine the number of workers based on CPU cores
        # A common practice is to use (2 * num_cores) + 1
        # This ensures efficient CPU utilization without overloading
        num_cores = multiprocessing.cpu_count()
        num_workers = (2 * num_cores) + 1
        
        # Get port from environment variable (for Render) or use default 8000
        port = int(os.environ.get("PORT", 8000))
        
        # Log server configuration
        logger.info(f"Starting server on port {port} with {num_workers} workers (based on {num_cores} CPU cores)")
        logger.info(f"Current working directory: {os.getcwd()}")
        logger.info(f"Python path: {sys.path}")
        
        # Run the server with multiple workers
        # Using 0.0.0.0 to bind to all network interfaces
        uvicorn.run(
            "api.main:app",
            host="0.0.0.0",
            port=port,
            workers=num_workers,
            log_level="info",
            reload=False  # Disable reload in production with multiple workers
        )
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        # Print the full exception traceback for debugging
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)
