from fastapi import FastAPI


app = FastAPI(title="StreamGuard AI API")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "StreamGuard AI backend is running"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
