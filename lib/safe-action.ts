import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    console.error("Server action error:", error);
    return "Une erreur est survenue.";
  },
});


