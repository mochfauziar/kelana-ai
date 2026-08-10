def print_trip_summary(destination, country, days, budget, currency, travel_month):
    print("========================")
    print("KelanaAI")
    print("========================")
    print(f"Destination   : {destination}")
    print(f"Country       : {country}")
    print(f"Days          : {days}")
    print(f"Budget        : {budget:.2f} {currency}")
    print(f"Currency      : {currency}")
    print(f"Travel Month  : {travel_month}")


def main():
    print("Welcome to KelanaAI!")
    print("Please enter your trip information.\n")

    destination = input("Destination: ")
    country = input("Country: ")
    days = int(input("Days: "))
    budget = float(input("Budget: "))
    currency = input("Currency: ")
    travel_month = input("Travel Month: ")

    print()
    print_trip_summary(
        destination,
        country,
        days,
        budget,
        currency,
        travel_month
    )


if __name__ == "__main__":
    main()