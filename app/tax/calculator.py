from .rates import get_tax_rate
from .deductions import calculate_deductions


def calculate_inheritance_tax(data: dict) -> dict:
    deductions = calculate_deductions(data)

    taxable_base = data["total_assets"] - deductions["total"]

    if taxable_base <= 0:
        return {
            "taxable_base": 0,
            "tax": 0,
            "deductions": deductions
        }

    rate, progressive = get_tax_rate(taxable_base)
    tax = taxable_base * rate - progressive

    return {
        "total_assets": data["total_assets"],
        "taxable_base": taxable_base,
        "tax": int(tax),
        "rate": rate,
        "deductions": deductions
    }
