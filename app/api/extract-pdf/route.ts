import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { verifyRequestAuth } from "@/lib/apiAuth";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use pdf-parse to extract text from the buffer
    const data = await pdfParse(buffer);

    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error("PDF Extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract text from PDF. Ensure it is a valid text-based PDF." },
      { status: 500 }
    );
  }
}
