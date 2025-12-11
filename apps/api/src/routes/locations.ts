
import { Hono } from "hono";
import { TR_LOCATIONS } from "../lib/locations.ts";

export const locationsRoutes = new Hono();

// Get all cities
locationsRoutes.get("/cities", (c) => {
    const cities = TR_LOCATIONS.map(({ id, name }) => ({ id, name }));
    return c.json({ cities });
});

// Get districts by city name (since frontend might send name or id)
// Let's support both ID or Name lookup for flexibility, but frontend usually selects by value.
// We will look up by city name as place.city stores text name currently.
locationsRoutes.get("/districts/:city", (c) => {
    const cityParam = c.req.param("city");
    // Try to find by ID first, then Name
    const city = TR_LOCATIONS.find(l => l.id === cityParam || l.name.toLowerCase() === cityParam.toLowerCase());

    if (!city) {
        return c.json({ districts: [] });
    }

    return c.json({ districts: city.districts });
});
