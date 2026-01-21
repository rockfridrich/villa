export interface DocPage {
  slug: string;
  title: string;
  description: string;
  content: string;
  section: "guides" | "api" | "reference";
  order: number;
  editUrl: string;
  lastModified: Date;
}

export interface ApiDoc {
  name: string;
  kind: "class" | "interface" | "function" | "type";
  description: string;
  signature: string;
  parameters?: Parameter[];
  returns?: string;
  examples?: string[];
  sourceFile: string;
  sourceLine: number;
}

export interface Parameter {
  name: string;
  type: string;
  description: string;
  optional: boolean;
  default?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  section: string;
  snippet: string;
  score: number;
}

export interface DocsConfig {
  version: string;
  versions: string[];
  defaultVersion: string;
  editBaseUrl: string;
  repoUrl: string;
}

export interface SearchIndex {
  pages: SearchIndexPage[];
}

export interface SearchIndexPage {
  id: string;
  title: string;
  content: string;
  section: string;
  url: string;
}
