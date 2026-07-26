import { getSessionUser } from "../../../../db/auth";

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ account: null }, { status: 401 });
  return Response.json({ account: { username: user.username } });
}
