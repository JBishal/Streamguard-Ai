from fastapi import FastAPI
from dotenv import load_dotenv

from app.routers.analyze import router as analyze_router

load_dotenv()

app = FastAPI(title="StreamGuard AI API")

app.include_router(analyze_router)


@app.get("/")
def root():
    return {"message": "StreamGuard AI backend is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
