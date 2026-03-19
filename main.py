from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from face_age import predict_ages_from_image
from datetime import datetime
from pathlib import Path

app = FastAPI(title="Age Prediction API", version="1.0.0")

LOG_FILE = Path(__file__).parent / "age_results.log"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


def append_log(filename: str, result: dict) -> None:
    """Append one prediction result to the log file.
    Creates the file if it was deleted; never overwrites existing records."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    faces = result["faces_found"]
    ages  = ", ".join(str(a) for a in result["ages"]) if result["ages"] else "-"
    line  = f"{timestamp} | file={filename} | faces={faces} | ages=[{ages}] | {result['message']}\n"
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line)


@app.get("/")
def health_check():
    return {"status": "ok", "message": "Age Prediction API is running."}


@app.post("/predict-age")
async def predict_age(file: UploadFile = File(...)):
    """
    Upload an image file.
    Returns detected face count and estimated age(s).
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must be an image (JPEG, PNG, etc.)"
        )

    image_bytes = await file.read()

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    result = predict_ages_from_image(image_bytes)
    append_log(file.filename or "unknown", result)
    return result