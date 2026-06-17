import { Router, raw } from "express";
import { handleCorsairWebhook, webhookStatus } from "./webhooks.controller";

/** Raw body + signature auth (NOT session auth). */
export const webhooksRouter = Router();

webhooksRouter.post("/corsair", raw({ type: "*/*", limit: "1mb" }), handleCorsairWebhook);

/** Session-authed: mounted AFTER requireAuth for the in-app settings tab. */
export const webhookStatusRouter = Router();
webhookStatusRouter.get("/", webhookStatus);
