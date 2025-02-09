import { setupServer } from "msw/node";
import { rest } from "msw";

export const server = setupServer(
  rest.get("/api/breeder-program", (req, res, ctx) => {
    return res(
      ctx.json({
        name: "Laur's Classic Corgis",
        description: "We breed Pembroke Welsh Corgis.",
        contact_email: "contact@corgis.com"
      })
    );
  })
);

// Start server before tests
beforeAll(() => server.listen());

// Close server after tests
afterAll(() => server.close());
