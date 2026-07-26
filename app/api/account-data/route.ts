import { getAccountDb, getSessionUser, isSameOrigin } from "../../../db/auth";

const MAX_DATA_BYTES = 750_000;

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });

  const row = await getAccountDb()
    .prepare("SELECT data_json FROM account_data WHERE user_id = ?")
    .bind(user.id)
    .first<{ data_json: string }>();

  if (!row) return Response.json({ data: null });
  try {
    return Response.json({ data: JSON.parse(row.data_json) });
  } catch {
    return Response.json({ data: null });
  }
}

export async function PUT(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "请求来源无效" }, { status: 403 });
  }
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });

  const data = await request.json().catch(() => null);
  if (!data || typeof data !== "object") {
    return Response.json({ error: "数据格式无效" }, { status: 400 });
  }
  const dataJson = JSON.stringify(data);
  if (new TextEncoder().encode(dataJson).byteLength > MAX_DATA_BYTES) {
    return Response.json({ error: "账号数据过大" }, { status: 413 });
  }

  await getAccountDb()
    .prepare(
      `INSERT INTO account_data (user_id, data_json, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
         data_json = excluded.data_json,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(user.id, dataJson)
    .run();
  return Response.json({ ok: true });
}
