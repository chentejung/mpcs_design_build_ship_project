import { handleClassify } from "@/lib/classify/handleClassify";
import { geminiModel } from "@/lib/classify/gemini";
import { isSignedIn } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    return await handleClassify(request, { model: geminiModel, authorize: () => isSignedIn() });
  } catch (err) {
    console.error("classify failed", err);
    return Response.json({ error: "The classification service is unavailable. Try again shortly." }, { status: 503 });
  }
}
