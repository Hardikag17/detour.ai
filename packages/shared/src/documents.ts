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

export const RECENT_TRIPS_QUERY = /* GraphQL */ `
  query RecentTrips($limit: Int) {
    recentTrips(limit: $limit) {
      id
      prompt
      originName
      destinationName
      distanceKm
      polyline
      isShareable
      stops {
        id
      }
    }
  }
`;

export const SAVED_TRIP_QUERY = /* GraphQL */ `
  query SavedTrip($id: ID!) {
    trip(id: $id) {
      id
      prompt
      originName
      destinationName
      distanceKm
      durationMin
      summary
      polyline
      isShareable
      stops {
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
  }
`;

export const SHARE_TRIP = /* GraphQL */ `
  mutation ShareTrip($id: ID!) {
    shareTrip(id: $id)
  }
`;
