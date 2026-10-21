import { getChatGPTUser } from "../../chatgpt-auth";
import { getD1 } from "../../../db/index";
import { handleNookState } from "../../../db/nook-state";

export const dynamic = "force-dynamic";

async function handle(request: Request) {
  const user = await getChatGPTUser();
  return handleNookState(request, getD1, user?.userId ?? null);
}

export const GET = handle;
export const POST = handle;
