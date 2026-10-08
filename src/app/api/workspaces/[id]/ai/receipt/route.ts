import { NextResponse } from "next/server";
import { requireUser, requireWorkspaceAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { parseReceiptVision } from "@/lib/ai/gemini";
import { enforceRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const receiptSchema = z.preprocess(
  (val: any) => {
    if (typeof val === "object" && val !== null) {
      return {
        ...val,
        imageBase64: val.imageBase64 || val.image || val.base64 || val.data || val.file,
        mimeType: val.mimeType || val.type || "image/jpeg",
      };
    }
    return val;
  },
  z.object({
    imageBase64: z
      .string("Gambar struk wajib disertakan")
      .min(10, "Data gambar struk tidak valid")
      .max(8 * 1024 * 1024, "Ukuran gambar melebihi batas maksimum 6MB"),
    mimeType: z.string().default("image/jpeg"),
  })
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const rateLimitError = await enforceRateLimit(req, "ai-receipt", 15, 60);
    if (rateLimitError) return rateLimitError;

    const user = await requireUser();
    const { id: workspaceId } = await params;

    await requireWorkspaceAccess(user.id, workspaceId);

    let body: any = {};
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      try {
        const formData = await req.formData();
        const file = formData.get("file") || formData.get("image") || formData.get("receipt");
        if (file && typeof file === "object" && "arrayBuffer" in file) {
          const buffer = Buffer.from(await (file as File).arrayBuffer());
          body.imageBase64 = buffer.toString("base64");
          body.mimeType = (file as File).type || "image/jpeg";
        } else if (typeof file === "string") {
          body.imageBase64 = file;
        }
      } catch (formErr) {
        console.error("FormData parse error:", formErr);
      }
    } else {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const parsed = receiptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Gambar struk wajib disertakan" },
        { status: 400 }
      );
    }

    const categories = await prisma.category.findMany({
      where: { workspaceId, type: "EXPENSE" },
      select: { id: true, name: true },
    });

    const result = await parseReceiptVision(
      parsed.data.imageBase64,
      parsed.data.mimeType,
      categories
    );

    return NextResponse.json({ success: true, receipt: result });
  } catch (error: any) {
    if (error.name === "UnauthorizedError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error in Receipt Vision route:", error);
    return NextResponse.json({ error: "Gagal menganalisis struk belanja" }, { status: 500 });
  }
}
