from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

# Import routers
from app.routers import files, auth

app = FastAPI(
    title="Nityar API", 
    description="Personal dev tools & cloud storage API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configure CORS with more restrictive settings for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://nityar.com", "https://www.nityar.com"],  # Only allow your domains
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Add middleware to handle HTTPS
@app.middleware("http")
async def https_middleware(request: Request, call_next):
    response = await call_next(request)
    # Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Serve index.html at root
@app.get("/", response_class=HTMLResponse)
async def root():
    try:
        with open("app/static/index.html", "r") as f:
            content = f.read()
        return content
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Index page not found")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(files.router, prefix="/api/files", tags=["Files"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
