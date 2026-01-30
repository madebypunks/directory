import { GITHUB_URL } from "./constants";

interface PunkEditContext {
  punkId: number;
  name?: string;
}

interface ProjectEditContext {
  projectId: string;
  name: string;
}

export function generatePunkEditUrl(context: PunkEditContext): string {
  const { punkId, name } = context;

  const title = `Edit Punk: #${punkId}${name ? ` (${name})` : ""}`;

  const params = new URLSearchParams({
    template: "edit-punk.md",
    title,
  });

  return `${GITHUB_URL}/issues/new?${params.toString()}`;
}

export function generateProjectEditUrl(context: ProjectEditContext): string {
  const { name } = context;

  const title = `Edit Project: ${name}`;

  const params = new URLSearchParams({
    template: "edit-project.md",
    title,
  });

  return `${GITHUB_URL}/issues/new?${params.toString()}`;
}

export function generateSubmissionUrl(): string {
  const params = new URLSearchParams({
    template: "submission.md",
  });

  return `${GITHUB_URL}/issues/new?${params.toString()}`;
}
