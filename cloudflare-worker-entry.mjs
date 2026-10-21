// Expose only the generated fetch handler; Vite resolves TanStack virtual imports.
import worker from "./dist/server/server.js";

export default worker;
