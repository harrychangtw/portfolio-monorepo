import { NextResponse, type NextRequest } from "next/server";

/** Old /g/<slug>/join?k=<key> links now live at /<key>. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const key = request.nextUrl.searchParams.get("k") || slug;
  return NextResponse.redirect(new URL(`/${key}`, request.url));
}
