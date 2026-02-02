def allocate_tax(total_tax: int, heirs: list) -> list:
    total_inherited = sum(
        h["inherited_assets"] for h in heirs
    )

    allocated = []

    for heir in heirs:
        ratio = heir["inherited_assets"] / total_inherited
        allocated.append({
            "name": heir["name"],
            "inherited_assets": heir["inherited_assets"],
            "ratio": round(ratio, 4),
            "allocated_tax": int(total_tax * ratio)
        })

    return allocated


def fix_rounding_error(allocated: list, total_tax: int) -> list:
    diff = total_tax - sum(a["allocated_tax"] for a in allocated)
    if diff != 0:
        allocated[-1]["allocated_tax"] += diff
    return allocated
    