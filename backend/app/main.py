from fastapi import FastAPI

from app.routers.analyze import router as analyze_router

app = FastAPI(title="StreamGuard AI API")

app.include_router(analyze_router)


@app.get("/")
def root():
    return {"message": "StreamGuard AI backend is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
