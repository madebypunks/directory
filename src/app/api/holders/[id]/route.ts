import { NextRequest, NextResponse } from "next/server";
import { getPunkById, getProjectsByPunk } from "@/data/punks";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const punkId = parseInt(id);

    if (isNaN(punkId)) {
      return NextResponse.json(
        { success: false, error: "Invalid punk ID" },
        { status: 400 }
      );
    }

    const punk = getPunkById(punkId);

    if (!punk) {
      return NextResponse.json(
        { success: false, error: `No holder profile found for punk #${punkId}` },
        { status: 404 }
      );
    }

    const projects = getProjectsByPunk(punkId).map(({ body, ...p }) => p);

    return NextResponse.json({
      success: true,
      data: {
        id: punk.id,
        name: punk.name,
        bio: punk.body,
        links: punk.links,
        projects,
        projectCount: projects.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
