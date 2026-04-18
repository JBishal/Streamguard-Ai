from fastapi import FastAPI

from app.routers.incidents import router as incidents_router


app = FastAPI(title="StreamGuard AI API")

app.include_router(incidents_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "StreamGuard AI backend is running"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
