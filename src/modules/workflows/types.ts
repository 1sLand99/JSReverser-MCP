export interface ParameterWorkflowMetadata {
  id: string;
  title: string;
  aliases: string[];
  keywords?: string[];
  category: string;
  status: string;
  version: string;
  lastUpdated: string;
  summary: string;
  relatedDocs?: string[];
}

export interface ParameterWorkflowIndexEntry {
  id: string;
  path: string;
  aliases: string[];
  keywords?: string[];
  category: string;
  status: string;
  summary: string;
}

export interface ParameterWorkflowIndex {
  schemaVersion: string;
  libraryVersion: string;
  workflows: ParameterWorkflowIndexEntry[];
}

export interface ParameterWorkflowDocument {
  metadata: ParameterWorkflowMetadata;
  workflow: string;
  path: string;
}
