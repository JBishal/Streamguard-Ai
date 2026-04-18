from fastapi import APIRouter

from app.services.incidents import Incident, build_mock_incidents


router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("/mock", response_model=list[Incident])
def get_mock_incidents() -> list[Incident]:
    return build_mock_incidents()
