const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
if (!apiKey) {
  console.error("Missing GOOGLE_PLACES_API_KEY in backend/.env");
  Deno.exit(1);
}

const PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby";
// Pedimos solo los campos que usamos: Google cobra según los campos solicitados.
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.primaryType",
  "places.rating",
  "places.priceLevel",
].join(",");

// Busca restaurantes dentro de un círculo (radio en metros) alrededor de una coordenada.
async function searchNearbyRestaurants(latitude: number, longitude: number, radius: number) {
  const response = await fetch(PLACES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey!,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: ["restaurant"],
      maxResultCount: 10,
      locationRestriction: { circle: { center: { latitude, longitude }, radius } },
    }),
  });

  if (!response.ok) {
    throw new Error(`Places API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  // Google devuelve {} cuando no hay resultados, por eso usamos una lista vacía por defecto.
  // Convertimos al formato propio para que el frontend no dependa del formato de Google.
  // deno-lint-ignore no-explicit-any
  return (data.places ?? []).map((place: any) => ({
    id: place.id,
    name: place.displayName?.text,
    address: place.formattedAddress,
    location: place.location,
    cuisine: place.primaryType,
    rating: place.rating ?? null,
    priceLevel: place.priceLevel ?? null,
  }));
}

// GET /api/restaurants?lat=..&lng=..&radius=..
async function restaurantsHandler(url: URL): Promise<Response> {
  const latitude = Number(url.searchParams.get("lat"));
  const longitude = Number(url.searchParams.get("lng"));
  const radius = Number(url.searchParams.get("radius") ?? 1000);

  // 400: el error es del cliente (faltan parámetros o no son números).
  if (
    !url.searchParams.has("lat") || !url.searchParams.has("lng") ||
    Number.isNaN(latitude) || Number.isNaN(longitude)
  ) {
    return Response.json({ error: "lat and lng query params are required numbers" }, {
      status: 400,
    });
  }

  try {
    const restaurants = await searchNearbyRestaurants(latitude, longitude, radius);
    return Response.json(restaurants);
  } catch (error) {
    // 502: falló el servicio externo (Google), no nuestro servidor.
    console.error(error);
    return Response.json({ error: "Could not fetch restaurants" }, { status: 502 });
  }
}

Deno.serve({ port: 8000 }, (request) => {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/restaurants") {
    return restaurantsHandler(url);
  }

  return Response.json({ error: "Not found" }, { status: 404 });
});
