export const PLAN_TRIP_SUBSCRIPTION = /* GraphQL */ `
  subscription PlanTrip($input: PlanTripInput!) {
    planTrip(input: $input) {
      __typename
      ... on StepEvent {
        id
        label
        status
      }
      ... on RouteEvent {
        polyline
        origin {
          lat
          lng
        }
        destination {
          lat
          lng
        }
        originName
        destinationName
        distanceKm
        durationMin
      }
      ... on StopEvent {
        id
        placeId
        name
        category
        rating
        reviewCount
        priceLevel
        location {
          lat
          lng
        }
        detourKm
        detourMin
        tier
        legLabel
        why {
          icon
          text
        }
      }
      ... on StopUpdatedEvent {
        id
        change
        reason
        stop {
          id
          placeId
          name
          category
          rating
          reviewCount
          priceLevel
          location {
            lat
            lng
          }
          detourKm
          detourMin
          tier
          legLabel
          why {
            icon
            text
          }
        }
      }
      ... on PlanSummaryEvent {
        planId
        summary
        stopCount
      }
      ... on PlanErrorEvent {
        message
        code
      }
    }
  }
`;
