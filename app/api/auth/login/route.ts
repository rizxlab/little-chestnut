import { createSession, isSameOrigin, verifyCredentials } from "../../../../db/auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "请求来源无效" }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;
  const username = payload?.username?.trim() || "";
  const password = payload?.password || "";
  if (!username || !password || username.length > 64 || password.length > 256) {
    return Response.json({ error: "请输入账号和密码" }, { status: 400 });
  }

  const user = await verifyCredentials(username, password);
  if (!user) {
    return Response.json({ error: "账号或密码不正确" }, { status: 401 });
  }

  const session = await createSession(user.id);
  return Response.json(
    { account: { username: user.username } },
    { headers: { "Set-Cookie": session.cookie } },
  );
}
