from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers.analyze import router as analyze_router

load_dotenv()

app = FastAPI(title="StreamGuard AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)


@app.get("/")
def root():
    return {"message": "StreamGuard AI backend is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
