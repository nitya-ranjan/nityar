from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import List
import os
import shutil
from datetime import datetime
from app.routers.auth import get_current_user
from app.models.user import User

router = APIRouter()

# Set up file storage location
# Set up file storage location from environment variable or use default
UPLOAD_DIR = os.environ.get("CLOUD_STORAGE_PATH", "/home/nitya-rpi/cloud-storage")
os.makedirs(UPLOAD_DIR, exist_ok=True)
@router.get("/list")
async def list_files(current_user: User = Depends(get_current_user)):
    """List all files in the cloud storage"""
    try:
        files = []
        for filename in os.listdir(UPLOAD_DIR):
            filepath = os.path.join(UPLOAD_DIR, filename)
            if os.path.isfile(filepath):
                stats = os.stat(filepath)
                modified_time = datetime.fromtimestamp(stats.st_mtime).isoformat()
                files.append({
                    "name": filename,
                    "size": stats.st_size,
                    "modified": modified_time
                })
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Upload a file to cloud storage"""
    try:
        file_location = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
            
        return {
            "filename": file.filename, 
            "size": os.path.getsize(file_location),
            "uploaded_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{filename}")
async def download_file(filename: str, current_user: User = Depends(get_current_user)):
    """Download a file from cloud storage"""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, filename=filename)

@router.delete("/{filename}")
async def delete_file(filename: str, current_user: User = Depends(get_current_user)):
    """Delete a file from cloud storage"""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        os.remove(file_path)
        return {"message": f"File {filename} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
