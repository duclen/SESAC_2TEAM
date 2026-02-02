def simple_input_adapter(estimated_assets: int) -> dict:
    return {
        "total_assets": estimated_assets,
        "debts": 0,
    }


def auto_input_adapter(assets: list, debts: list, extra: dict) -> dict:
    return {
        "total_assets": sum(a["value"] for a in assets),
        "financial_assets": extra.get("financial_assets", 0),
        "debts": sum(d["amount"] for d in debts),
        **extra
    }


def history_input_adapter(saved: dict) -> dict:
    return saved.copy()
