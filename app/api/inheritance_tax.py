from fastapi import APIRouter
from app.tax.calculator import calculate_inheritance_tax
from app.tax.allocation import allocate_tax, fix_rounding_error

router = APIRouter(
    prefix="/inheritance-tax",
    tags=["Inheritance Tax"]
)


@router.post("/calculate")
def calculate(payload: dict):
    """
    홈택스 상속세 계산 API
    """
    result = calculate_inheritance_tax(payload)
    return result


@router.post("/allocate")
def allocate(payload: dict):
    """
    상속인별 세액 안분 API
    """
    total_tax = payload["total_tax"]
    heirs = payload["heirs"]

    allocated = allocate_tax(total_tax, heirs)
    allocated = fix_rounding_error(allocated, total_tax)

    return {
        "total_tax": total_tax,
        "allocated": allocated
    }
