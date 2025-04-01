from fastapi import FastAPI

# Create a minimal test app
app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello from Vercel"}

# For Vercel
handler = app