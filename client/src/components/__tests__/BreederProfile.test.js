import { render, screen, waitFor } from "@testing-library/react";
import BreederProfile from "../../pages/dashboard/BreederProfile"; // ✅ Correct path
import { server } from "../../mocks/server";

test("fetches and displays breeder profile data", async () => {
  render(<BreederProfile />);

  await waitFor(() => screen.getByLabelText(/Program Name/i));

  expect(screen.getByLabelText(/Program Name/i)).toHaveValue("Laur's Classic Corgis");
});
