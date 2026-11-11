import type { NextApiRequest, NextApiResponse } from "next";
import { recordAnalytics } from "~/server/analytics";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  if (req.headers["sec-fetch-site"] === "cross-site")
    return res.status(403).end();

  // The client can record only a single page view, never arbitrary game counts.
  const recorded = await recordAnalytics({ pageViews: 1 });
  return res.status(recorded ? 204 : 503).end();
}
