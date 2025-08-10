import { zod4 } from "sveltekit-superforms/adapters";
import * as z from "zod";

// Define outside the load function so the adapter can be cached
const schema = z.object({
  name: z.string().default("Hello world!"),
  email: z.email(),
});

export const validatedSchema = zod4(schema);
