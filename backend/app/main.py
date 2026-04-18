from fastapi import FastAPI


app = FastAPI(title="StreamGuard AI API")


@app.get("/")
def root():
    return {"message": "StreamGuard AI backend is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
