// Supabase Edge Function: identifica un monumento a partir de una imagen de cámara.
// Requiere configurar el secreto OPENAI_API_KEY en Supabase.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const key = Deno.env.get("OPENAI_API_KEY");
    if (!key) throw new Error("OPENAI_API_KEY no está configurada en Supabase.");
    const body = await req.json();
    const image = String(body?.image || "");
    const candidates = Array.isArray(body?.candidates) ? body.candidates : [];
    if (!image.startsWith("data:image/")) throw new Error("Imagen de cámara no válida.");
    if (!candidates.length) return json({ match: false, reason: "no_candidates" });

    const candidateText = candidates.map((c: any) =>
      `ID: ${c.id}\nNombre: ${c.name}\nCategoría: ${c.category || ""}\nDescripción: ${c.description || ""}\nDirección: ${c.address || ""}`
    ).join("\n\n");

    const prompt = `Eres un sistema de identificación visual turística. Analiza la fotografía de cámara y decide si muestra alguno de los monumentos candidatos. NO inventes monumentos y NO elijas un candidato solo porque sea el único disponible. Busca arquitectura, forma, materiales, elementos distintivos, carteles y contexto. Si la imagen no permite identificarlo con suficiente seguridad, devuelve match=false.\n\nCANDIDATOS:\n${candidateText}\n\nDevuelve SOLO JSON válido con esta estructura: {"match":boolean,"id":string|null,"confidence":number,"reason":string}. confidence debe estar entre 0 y 1. Considera match=true únicamente con confianza >= 0.80.`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-6-luna",
        input: [{ role: "user", content: [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: image, detail: "low" }
        ] }],
        max_output_tokens: 180
      })
    });
    const raw = await response.text();
    if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}: ${raw.slice(0, 500)}`);
    const data = JSON.parse(raw);
    const text = String(data.output_text || "").trim();
    const jsonText = text.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonText) throw new Error("La IA no devolvió JSON interpretable.");
    const result = JSON.parse(jsonText);
    return json({
      match: Boolean(result.match),
      id: result.id ? String(result.id) : null,
      confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0)),
      reason: String(result.reason || "")
    });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
