from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.services.face_engine import face_engine
from app.core.config import settings

router = APIRouter()

# Request/Response Schemas
class DetectRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image string or Data URL")

class CandidateFace(BaseModel):
    id: str
    name: str
    role: Optional[str] = "USER"
    type: Optional[str] = "User"
    avatarUrl: Optional[str] = None
    embedding: List[float]

class RecognizeRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image string or Data URL")
    candidates: List[CandidateFace] = Field(default=[], description="List of registered face embeddings")
    threshold: Optional[float] = settings.DEFAULT_MATCH_THRESHOLD

class SearchFaceRequest(BaseModel):
    targetEmbedding: List[float]
    candidates: List[CandidateFace]
    topK: Optional[int] = 5

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "embeddingDimension": settings.EMBEDDING_DIM,
        "defaultThreshold": settings.DEFAULT_MATCH_THRESHOLD
    }

@router.post("/detect")
def detect_face(req: DetectRequest):
    img = face_engine.decode_image(req.image)
    if img is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image encoding or format."
        )

    faces = face_engine.detect_faces(img)
    formatted_faces = []
    for f in faces:
        formatted_faces.append({
            "boundingBox": f["boundingBox"],
            "confidence": f["confidence"],
            "qualityScore": f["qualityScore"],
            "livenessScore": f["livenessScore"]
        })

    return {
        "success": True,
        "facesCount": len(formatted_faces),
        "faces": formatted_faces
    }

@router.post("/register-face")
def register_face(req: DetectRequest):
    img = face_engine.decode_image(req.image)
    if img is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image encoding or format."
        )

    faces = face_engine.detect_faces(img)
    if len(faces) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No face detected in the provided image. Please center your face and ensure adequate lighting."
        )

    # Use the primary/largest face detected
    primary_face = max(faces, key=lambda f: f["boundingBox"]["width"] * f["boundingBox"]["height"])

    if primary_face["qualityScore"] < settings.QUALITY_THRESHOLD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Face quality score ({primary_face['qualityScore']}) is below minimum threshold ({settings.QUALITY_THRESHOLD}). Avoid blur and low lighting."
        )

    return {
        "success": True,
        "embedding": primary_face["embedding"],
        "qualityScore": primary_face["qualityScore"],
        "livenessScore": primary_face["livenessScore"],
        "boundingBox": primary_face["boundingBox"]
    }

@router.post("/recognize")
def recognize_face(req: RecognizeRequest):
    img = face_engine.decode_image(req.image)
    if img is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image encoding."
        )

    detected_faces = face_engine.detect_faces(img)
    if not detected_faces:
        return {
            "success": True,
            "recognized": False,
            "message": "No faces detected in frame.",
            "faces": []
        }

    results = []
    candidates_dict = [c.model_dump() for c in req.candidates]

    for face in detected_faces:
        emb = face["embedding"]
        matched, match_info, similarity = face_engine.match_face(
            emb,
            candidates_dict,
            threshold=req.threshold or settings.DEFAULT_MATCH_THRESHOLD
        )

        face_result = {
            "boundingBox": face["boundingBox"],
            "detectionConfidence": face["confidence"],
            "qualityScore": face["qualityScore"],
            "livenessScore": face["livenessScore"],
            "matched": matched,
            "matchConfidence": similarity
        }

        if matched and match_info:
            face_result.update({
                "personId": match_info["id"],
                "personName": match_info["name"],
                "personRole": match_info.get("role", "USER"),
                "personType": match_info.get("type", "User"),
                "avatarUrl": match_info.get("avatarUrl")
            })
        else:
            face_result.update({
                "personName": "Unknown Visitor",
                "personType": "Visitor"
            })

        results.append(face_result)

    return {
        "success": True,
        "facesCount": len(results),
        "results": results
    }

@router.post("/search-face")
def search_face(req: SearchFaceRequest):
    candidates_dict = [c.model_dump() for c in req.candidates]
    scored = []

    for candidate in candidates_dict:
        sim = face_engine.calculate_cosine_similarity(req.targetEmbedding, candidate.get("embedding", []))
        scored.append({
            "candidate": candidate,
            "similarity": round(sim, 4)
        })

    scored.sort(key=lambda x: x["similarity"], reverse=True)
    top_matches = scored[:req.topK]

    return {
        "success": True,
        "matches": top_matches
    }
