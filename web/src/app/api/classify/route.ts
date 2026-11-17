import { handleClassify } from "@/lib/classify/handleClassify";
import { geminiModel } from "@/lib/classify/gemini";
import { isSignedIn } from "@/lib/supabase/server";

/** Model calls can be slow when Gemini is busy; allow a minute before the platform cuts the request off. */
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    return await handleClassify(request, { model: geminiModel, authorize: () => isSignedIn() });
  } catch (err) {
    console.error("classify failed", err);
    return Response.json({ error: "The classification service is unavailable. Try again shortly." }, { status: 503 });
  }
}
