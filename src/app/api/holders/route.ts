import { NextRequest, NextResponse } from "next/server";
import PUNKS, { getProjectsByPunk } from "@/data/punks";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search");

    let punks = [...PUNKS];

    if (search) {
      const q = search.toLowerCase();
      punks = punks.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          String(p.id).includes(q)
      );
    }

    const data = punks.map((punk) => {
      const projects = getProjectsByPunk(punk.id);
      return {
        id: punk.id,
        name: punk.name,
        links: punk.links,
        projectCount: projects.length,
        projects: projects.map((p) => ({ id: p.id, name: p.name })),
      };
    });

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
