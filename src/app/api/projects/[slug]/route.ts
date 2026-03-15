import { NextRequest, NextResponse } from "next/server";
import { getProjectById, getProjectCreators } from "@/data/punks";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const project = getProjectById(slug);

    if (!project) {
      return NextResponse.json(
        { success: false, error: `Project not found: ${slug}` },
        { status: 404 }
      );
    }

    const creators = getProjectCreators(project).map((punk) => ({
      id: punk.id,
      name: punk.name,
      bio: punk.body,
      links: punk.links,
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        creators: creators,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
