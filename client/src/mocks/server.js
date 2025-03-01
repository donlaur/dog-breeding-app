import { setupServer } from "msw/node";
import { rest } from "msw";

// Define handlers
const handlers = [
  // Mock the litters endpoint
  rest.get("/api/litters", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          litter_name: "Arcane - Jinx & Aspen",
          status: "Born",
          whelp_date: "2024-07-19",
          num_puppies: 5,
          puppy_count: 1,
          dam_id: 1,
          sire_id: 2,
          dam_name: "Jinx",
          sire_name: "Aspen",
          dam_photo: "path/to/dam/photo",
          sire_photo: "path/to/sire/photo"
        }
      ])
    );
  }),

  // Mock individual litter endpoint
  rest.get("/api/litters/:id", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: req.params.id,
        litter_name: "Arcane - Jinx & Aspen",
        status: "Born",
        whelp_date: "2024-07-19",
        num_puppies: 5,
        puppy_count: 1,
        dam_id: 1,
        sire_id: 2,
        dam_name: "Jinx",
        sire_name: "Aspen",
        dam_photo: "path/to/dam/photo",
        sire_photo: "path/to/sire/photo"
      })
    );
  })
];

// Create the MSW server
export const server = setupServer(...handlers);

// Start server before tests
beforeAll(() => server.listen());

// Close server after tests
afterAll(() => server.close());
