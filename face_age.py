import cv2
import numpy as np
from deepface import DeepFace


def predict_ages_from_image(image_bytes: bytes) -> dict:
    """
    Detect all faces in the image and predict each person's age.

    Returns:
        {
            "faces_found": int,
            "ages": [int, ...],          # one per detected face
            "message": str               # human-readable summary
        }
    """
    # Decode image bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {
            "faces_found": 0,
            "ages": [],
            "message": "Could not decode the uploaded image."
        }

    try:
        # DeepFace.analyze returns a list (one entry per face)
        # enforce_detection=False prevents exception when no face found
        results = DeepFace.analyze(
            img_path=img,
            actions=["age"],
            enforce_detection=True,
            detector_backend="opencv",   # fast; alternatives: retinaface, mtcnn, ssd
            silent=True
        )
    except ValueError:
        # DeepFace raises ValueError when no face is detected
        return {
            "faces_found": 0,
            "ages": [],
            "message": "No face found in the image."
        }

    # results is always a list when enforce_detection=True succeeds
    if not isinstance(results, list):
        results = [results]

    ages = [int(r["age"]) for r in results]
    count = len(ages)

    if count == 1:
        message = f"1 face detected. Estimated age: {ages[0]}"
    else:
        age_list = ", ".join(
            f"Person {i + 1}: ~{age}" for i, age in enumerate(ages)
        )
        message = f"{count} faces detected. {age_list}"

    return {
        "faces_found": count,
        "ages": ages,
        "message": message
    }
