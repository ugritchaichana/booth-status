const DISPATCH_URL = "https://api.github.com/repos/ugritchaichana/booth-status/dispatches";

async function dispatch(env, eventType) {
  const res = await fetch(DISPATCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "booth-status-trigger",
    },
    body: JSON.stringify({ event_type: eventType }),
  });
  if (res.status !== 204) {
    throw new Error(`dispatch ${eventType} failed: ${res.status} ${await res.text()}`);
  }
}

export default {
  async scheduled(event, env) {
    if (!env.GITHUB_TOKEN) throw new Error("secret GITHUB_TOKEN is not set");
    const types = ["uptime"];
    if (new Date(event.scheduledTime).getUTCMinutes() === 0) types.push("summary", "response_time");
    const results = await Promise.allSettled(types.map((type) => dispatch(env, type)));
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length) throw new AggregateError(failed.map((r) => r.reason), failed.map((r) => r.reason.message).join("; "));
  },
  async fetch() {
    return new Response("Not Found", { status: 404 });
  },
};
