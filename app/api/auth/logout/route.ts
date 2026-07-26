import { deleteSession, isSameOrigin } from "../../../../db/auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "请求来源无效" }, { status: 403 });
  }
  const cookie = await deleteSession(request);
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": cookie } },
  );
}
