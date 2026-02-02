def calculate_deductions(data: dict) -> dict:
    deductions = {}

    BASIC_LUMP_SUM = 500_000_000
    base_deduction = 200_000_000

    personal = 0
    personal += data.get("children", 0) * 50_000_000
    personal += data.get("elderly", 0) * 50_000_000

    for age in data.get("minors", []):
        personal += (19 - age) * 10_000_000

    for expectancy in data.get("disabled", []):
        personal += expectancy * 10_000_000

    deductions["basic_or_personal"] = max(
        BASIC_LUMP_SUM,
        base_deduction + personal
    )

    spouse_inherited = data.get("spouse_inherited", 0)
    deductions["spouse"] = min(
        max(spouse_inherited, 500_000_000),
        3_000_000_000
    ) if spouse_inherited > 0 else 0

    financial_assets = data.get("financial_assets", 0)
    deductions["financial"] = min(
        max(financial_assets * 0.2, 20_000_000),
        200_000_000
    ) if financial_assets > 0 else 0

    deductions["housing"] = min(
        data.get("housing_deduction", 0),
        600_000_000
    )

    deductions["funeral"] = min(
        data.get("funeral_cost", 0),
        10_000_000
    )

    deductions["debts"] = data.get("debts", 0)
    deductions["total"] = sum(deductions.values())

    return deductions