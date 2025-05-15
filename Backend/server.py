import uvicorn
import os
import multiprocessing
import sys
import logging
import psutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("server")

def is_running_on_render():
    """Check if we're running on Render"""
    return os.environ.get("RENDER", "") == "true"

def get_optimal_workers():
    """Calculate optimal number of workers based on available resources"""
    try:
        # Get available memory in GB
        available_memory_gb = psutil.virtual_memory().available / (1024 * 1024 * 1024)
        # Get number of CPU cores
        num_cores = multiprocessing.cpu_count()
        
        logger.info(f"Available memory: {available_memory_gb:.2f} GB, CPU cores: {num_cores}")
        
        if is_running_on_render():
            # On Render, be more conservative with workers
            # Use fewer workers based on available memory
            if available_memory_gb < 0.5:  # Less than 512MB available
                return 2  # Minimum workers for concurrency
            elif available_memory_gb < 1.0:  # Less than 1GB available
                return 3
            else:
                # Use a more conservative formula for Render
                return min(4, num_cores)  # Cap at 4 workers or number of cores, whichever is smaller
        else:
            # For local development, use the standard formula
            return (2 * num_cores) + 1
    except Exception as e:
        logger.warning(f"Error calculating optimal workers: {str(e)}. Falling back to 2 workers.")
        return 2  # Safe fallback

if __name__ == "__main__":
    try:
        # Get port from environment variable (for Render) or use default 8000
        port = int(os.environ.get("PORT", 8000))
        
        # Determine optimal number of workers based on available resources
        num_workers = get_optimal_workers()
        
        # Log server configuration
        if is_running_on_render():
            logger.info(f"Starting server on Render with {num_workers} workers (optimized for Render environment)")
        else:
            logger.info(f"Starting server with {num_workers} workers (local environment)")
        
        logger.info(f"Binding to port {port}")
        logger.info(f"Current working directory: {os.getcwd()}")
        
        # Run the server with the calculated number of workers
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
