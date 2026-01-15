import { Context } from "hono";

export async function getSessionFromRequest(c: Context) {
  const cookies = c.req.raw.headers.get("cookie") || "";

  const sessionTokenMatch = cookies.match(/better-auth\.session_token=([^;]+)/);
  const sessionDataMatch = cookies.match(/better-auth\.session_data=([^;]+)/);

  if (!sessionTokenMatch || !sessionDataMatch) {
    return null;
  }

  const token = sessionTokenMatch[1].split(";")[0];
  const dataStr = sessionDataMatch[1].split(";")[0];

  try {
    const data = JSON.parse(atob(dataStr));

    const expiresAt = new Date(data.session.expiresAt);
    const now = new Date();

    if (expiresAt < now) {
      return null;
    }

    const userId = data.session?.session?.userId || data.session?.userId;

    return {
      session: data.session,
      user: {
        id: userId,
        ...data.user,
      },
    };
  } catch (error) {
    return null;
  }
}
