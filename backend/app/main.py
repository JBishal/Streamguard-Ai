from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path

from app.routers.analyze import router as analyze_router

BACKEND_ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = BACKEND_ROOT / ".env"
ENV_EXAMPLE_PATH = BACKEND_ROOT / ".env.example"

if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
elif ENV_EXAMPLE_PATH.exists():
    # Local dev fallback so the app still starts when only the example file exists.
    load_dotenv(ENV_EXAMPLE_PATH)

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
