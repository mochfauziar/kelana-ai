from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_recommended_place,
    get_transportation_recommendation,
    get_season
)


def print_trip_summary(destination, country, days, budget, currency, travel_month):
    print("========================")
    print("KelanaAI")
    print("========================")
    print(f"Destination      : {destination}")
    print(f"Country          : {country}")
    print(f"Days             : {days}")
    print(f"Budget           : {budget:.2f} {currency}")
    print(f"Currency         : {currency}")
    print(f"Travel Month     : {travel_month}")


def main():
    print("Welcome to KelanaAI!")
    print("Please enter your trip information.\n")

    destination = input("Destination: ")
    country = input("Country: ")
    days = int(input("Days: "))
    budget = float(input("Budget: "))
    currency = input("Currency: ")
    travel_month = input("Travel Month: ")

    # Calculate daily budget
    daily = calculate_daily_budget(budget, days)

    # Determine trip category
    category = get_trip_category(budget)

    #homework
    season = get_season(travel_month)

    # Get transportation recommendation
    transportation = get_transportation_recommendation(category)

    # Get recommended places
    recommendation_places = get_recommended_place(destination)

    print()

    print_trip_summary(
        destination,
        country,
        days,
        budget,
        currency,
        travel_month
    )

    print(f"Category         : {category}")
    print(f"Daily Budget     : {daily:.2f} {currency}/day")
    print(f"Transportation   : {transportation}")
    print(f"Season           : {season}")

    print("\nRecommended Places:")

    for place in recommendation_places:
        print(f" - {place}")


if __name__ == "__main__":
    main()