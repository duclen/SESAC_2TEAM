def get_tax_rate(taxable_base: int):
    brackets = [
        (100_000_000, 0.10, 0),
        (500_000_000, 0.20, 10_000_000),
        (1_000_000_000, 0.30, 60_000_000),
        (3_000_000_000, 0.40, 160_000_000),
        (float("inf"), 0.50, 460_000_000),
    ]

    for limit, rate, deduction in brackets:
        if taxable_base <= limit:
            return rate, deduction
