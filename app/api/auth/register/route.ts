import { handleRegister } from "../../../../db/auth";

export async function POST(request: Request) {
  return handleRegister(request);
}
