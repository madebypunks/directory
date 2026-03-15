import { NextRequest, NextResponse } from "next/server";
import { getAllProjects, getProjectsByTag, getProjectsByPunk, getAllTags } from "@/data/punks";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const tag = searchParams.get("tag");
    const creator = searchParams.get("creator");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");

    let projects = getAllProjects();

    if (tag) {
      projects = getProjectsByTag(tag);
    }

    if (creator) {
      const punkId = parseInt(creator);
      if (!isNaN(punkId)) {
        projects = projects.filter((p) => p.creators.includes(punkId));
      }
    }

    if (featured === "true") {
      projects = projects.filter((p) => p.featured);
    }

    if (search) {
      const q = search.toLowerCase();
      projects = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Strip body from list responses (too large, fetch individually)
    const data = projects.map(({ body, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
      tags: getAllTags(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
