import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { Punk, Project } from "@/types";

const punksDirectory = path.join(process.cwd(), "content/punks");
const projectsDirectory = path.join(process.cwd(), "content/projects");

/**
 * Punk frontmatter schema ({punkId}.md)
 */
interface PunkFrontmatter {
  name?: string;
  links?: string[];
}

/**
 * Project frontmatter schema ({slug}.md)
 */
interface ProjectFrontmatter {
  name: string;
  description: string;
  thumbnail?: string;
  url: string;
  launchDate: string;
  tags: string[];
  links?: string[];
  hidden?: boolean;
  ded?: boolean;
  featured?: boolean;
  creators: number[];
}

/**
 * Load all punks from content/punks/
 */
function loadAllPunks(): Map<number, Punk> {
  const punks = new Map<number, Punk>();

  if (!fs.existsSync(punksDirectory)) {
    return punks;
  }

  const files = fs.readdirSync(punksDirectory);

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const punkId = parseInt(file.replace(/\.md$/, ""), 10);
    if (isNaN(punkId)) continue;

    const filePath = path.join(punksDirectory, file);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContent);
    const punkData = data as PunkFrontmatter;

    punks.set(punkId, {
      id: punkId,
      name: punkData.name,
      links: punkData.links,
      body: content.trim() || undefined,
    });
  }

  return punks;
}

/**
 * Load all projects from content/projects/
 */
function loadAllProjects(): Project[] {
  if (!fs.existsSync(projectsDirectory)) {
    return [];
  }

  const files = fs.readdirSync(projectsDirectory);

  return files
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const filePath = path.join(projectsDirectory, file);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(fileContent);
      const projectData = data as ProjectFrontmatter;

      // Skip hidden or dead projects
      if (projectData.hidden || projectData.ded) {
        return null;
      }

      const id = file.replace(/\.md$/, "");

      return {
        id,
        name: projectData.name,
        description: projectData.description,
        body: content.trim() || undefined,
        thumbnail: projectData.thumbnail,
        url: projectData.url,
        launchDate: projectData.launchDate,
        tags: projectData.tags || [],
        links: projectData.links,
        ded: projectData.ded,
        featured: projectData.featured,
        creators: projectData.creators || [],
      } as Project;
    })
    .filter((project): project is Project => project !== null)
    .sort((a, b) => new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime());
}

// Load data once at build time
const PUNKS_MAP = loadAllPunks();
const PROJECTS = loadAllProjects();

// Export punks as array sorted by ID
const PUNKS = Array.from(PUNKS_MAP.values()).sort((a, b) => a.id - b.id);

export default PUNKS;
export { PROJECTS };

// Helper functions
export function getAllPunks(): number[] {
  return PUNKS.map((punk) => punk.id);
}

export function getPunkById(id: number): Punk | undefined {
  return PUNKS_MAP.get(id);
}

export function getAllProjects(): Project[] {
  return PROJECTS;
}

export function getProjectById(projectId: string): Project | undefined {
  return PROJECTS.find((p) => p.id === projectId);
}

export function getProjectsByPunk(punkId: number): Project[] {
  return PROJECTS.filter((p) => p.creators.includes(punkId));
}

export function getProjectCreators(project: Project): Punk[] {
  return project.creators
    .map((id) => PUNKS_MAP.get(id))
    .filter((punk): punk is Punk => punk !== undefined);
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  PROJECTS.forEach((project) => {
    project.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

export function getProjectsByTag(tag: string): Project[] {
  return PROJECTS.filter((project) =>
    project.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

export function getAllProjectParams() {
  return PROJECTS.map((project) => ({
    slug: project.id,
  }));
}

export function getAllPunkParams() {
  return PUNKS.map((punk) => ({
    id: String(punk.id),
  }));
}

/**
 * Group projects by their creator sets.
 *
 * Logic:
 * - Every punk who has at least one project gets their own entry
 * - Their entry shows ALL projects they contributed to (solo + collab)
 * - This means collaborative projects may appear under multiple punk entries
 *
 * Returns groups sorted by featured first, then by most projects.
 */
export interface CreatorGroup {
  key: string;
  punks: Punk[];
  projects: Project[];
}

/**
 * Get search data for client-side search
 */
export interface SearchItem {
  type: "punk" | "project";
  id: string | number;
  name: string;
  slug: string;
  punkId?: number;
}

export function getSearchData(): SearchItem[] {
  const items: SearchItem[] = [];

  // Add punks
  for (const punk of PUNKS) {
    items.push({
      type: "punk",
      id: punk.id,
      name: punk.name || `Punk #${punk.id}`,
      slug: `/${punk.id}`,
      punkId: punk.id,
    });
  }

  // Add projects
  for (const project of PROJECTS) {
    items.push({
      type: "project",
      id: project.id,
      name: project.name,
      slug: `/p/${project.id}`,
    });
  }

  return items;
}

/**
 * Get all punks sorted alphabetically by name
 * Returns an array of objects with the letter and punks for that letter
 */
export interface AlphabetGroup {
  letter: string;
  punks: Punk[];
}

export function getPunksAlphabetically(): AlphabetGroup[] {
  // Helper to get display name - explicitly return string
  const getDisplayName = (punk: Punk): string => {
    if (punk.name && typeof punk.name === "string") {
      return punk.name;
    }
    return "Punk #" + String(punk.id);
  };

  // Sort punks by name (or by ID if no name)
  const sortedPunks = [...PUNKS].sort((a, b) => {
    const nameA = String(getDisplayName(a)).toLowerCase();
    const nameB = String(getDisplayName(b)).toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Group by first letter
  const groups = new Map<string, Punk[]>();

  for (const punk of sortedPunks) {
    const name = getDisplayName(punk);
    const firstChar = name.charAt(0).toUpperCase();
    // Use # for numbers, otherwise use the letter
    const letter = /[A-Z]/i.test(firstChar) ? firstChar : "#";

    if (!groups.has(letter)) {
      groups.set(letter, []);
    }
    groups.get(letter)!.push(punk);
  }

  // Convert to array and sort by letter (A-Z, then # at the end)
  return Array.from(groups.entries())
    .sort(([letterA], [letterB]) => {
      if (letterA === "#") return 1;
      if (letterB === "#") return -1;
      return letterA.localeCompare(letterB);
    })
    .map(([letter, punks]) => ({ letter, punks }));
}

export function getProjectGroups(): CreatorGroup[] {
  // Get all punks who have at least one project
  const punksWithProjects = new Set<number>();
  for (const project of PROJECTS) {
    for (const creatorId of project.creators) {
      punksWithProjects.add(creatorId);
    }
  }

  // Create an entry for each punk with their projects
  const groups: CreatorGroup[] = [];

  for (const punkId of punksWithProjects) {
    const punk = PUNKS_MAP.get(punkId);
    if (!punk) continue;

    const punkProjects = PROJECTS.filter((p) => p.creators.includes(punkId));

    groups.push({
      key: String(punkId),
      punks: [punk],
      projects: punkProjects,
    });
  }

  // Sort: featured first, then by number of projects
  return groups.sort((a, b) => {
    // Featured groups first (any project in the group is featured)
    const aFeatured = a.projects.some((p) => p.featured);
    const bFeatured = b.projects.some((p) => p.featured);
    if (aFeatured && !bFeatured) return -1;
    if (!aFeatured && bFeatured) return 1;
    // Then by number of projects
    return b.projects.length - a.projects.length;
  });
}
