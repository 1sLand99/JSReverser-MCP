import {access, mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import type {
  ParameterWorkflowDocument,
  ParameterWorkflowIndex,
  ParameterWorkflowIndexEntry,
  ParameterWorkflowMetadata,
} from './types.js';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = path.resolve(MODULE_DIR, '..', '..', '..');
const KNOWLEDGE_ROOT = path.join(
  BUILD_DIR,
  'docs',
  'knowledge',
  'parameter-workflows',
);

const TEMPLATE_METADATA = {
  id: 'replace-me',
  title: 'Replace Me Workflow',
  aliases: ['replace-me'],
  keywords: ['replace-me'],
  category: 'header-signature',
  status: 'draft',
  version: '0.1.0',
  lastUpdated: 'YYYY-MM-DD',
  summary: '一句话说明该 workflow 适用的参数或链路。',
};

const TEMPLATE_WORKFLOW = `# Replace Me Workflow

## 适用范围

- 描述该 workflow 适用于什么参数/链路

## 识别特征

- 描述关键词、参数位置、入口现象

## 前置输入

- 请求样本
- MCP 页面上下文

## 分阶段流程

### 1. Request Identify

- 记录目标请求与输入边界

### 2. Script Locate

- 定位脚本入口和 initiator

### 3. Hook Capture

- 捕获输入、中间值和输出

## 常见分叉

- 记录升级或迁移的常见分叉

## 最小 artifacts 契约

- request-summary.json
- network.jsonl
- hooks.jsonl

## 成功判定

- 说明成功标准

## 禁止事项

- 不放完整实现
`;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T;
}

export class ParameterWorkflowLibrary {
  constructor(private readonly rootDir = KNOWLEDGE_ROOT) {}

  async readIndex(): Promise<ParameterWorkflowIndex> {
    return readJsonFile<ParameterWorkflowIndex>(path.join(this.rootDir, 'index.json'));
  }

  async listWorkflows(): Promise<ParameterWorkflowMetadata[]> {
    const index = await this.readIndex();
    const docs = await Promise.all(index.workflows.map((item) => this.getWorkflow(item.id)));
    return docs.map((item) => item.metadata);
  }

  async getWorkflow(id: string): Promise<ParameterWorkflowDocument> {
    const index = await this.readIndex();
    const entry = index.workflows.find((item) => item.id === id || item.aliases.includes(id));
    if (!entry) {
      throw new Error(`Unknown parameter workflow: ${id}`);
    }
    return this.readWorkflowEntry(entry);
  }

  async recommendWorkflow(query: string): Promise<ParameterWorkflowDocument> {
    const index = await this.readIndex();
    const normalizedQuery = normalize(query);

    const exact = index.workflows.find((item) => {
      if (normalize(item.id) === normalizedQuery) {
        return true;
      }
      return item.aliases.some((alias) => normalize(alias) === normalizedQuery);
    });
    if (exact) {
      return this.readWorkflowEntry(exact);
    }

    const containsMatch = index.workflows.find((item) => {
      const tokens = [item.id, ...item.aliases, ...(item.keywords ?? [])].map(normalize);
      return tokens.some((token) => normalizedQuery.includes(token) || token.includes(normalizedQuery));
    });
    if (containsMatch) {
      return this.readWorkflowEntry(containsMatch);
    }

    const fallbackId =
      normalizedQuery.includes('header') ||
      normalizedQuery.includes('x-sign') ||
      normalizedQuery.includes('sign')
        ? 'generic-header-sign'
        : 'generic-query-token';
    return this.getWorkflow(fallbackId);
  }

  async exportWorkflow(id: string, targetDir: string): Promise<void> {
    const workflow = await this.getWorkflow(id);
    await mkdir(targetDir, {recursive: true});
    await writeFile(
      path.join(targetDir, 'metadata.json'),
      `${JSON.stringify(workflow.metadata, null, 2)}\n`,
      'utf8',
    );
    await writeFile(path.join(targetDir, 'workflow.md'), workflow.workflow, 'utf8');
  }

  async validateWorkflowDirectory(targetDir: string): Promise<{valid: boolean; errors: string[]}> {
    const errors: string[] = [];
    const metadataPath = path.join(targetDir, 'metadata.json');
    const workflowPath = path.join(targetDir, 'workflow.md');

    try {
      await access(metadataPath);
    } catch {
      errors.push('metadata.json 不存在');
    }

    try {
      await access(workflowPath);
    } catch {
      errors.push('workflow.md 不存在');
    }

    if (errors.length > 0) {
      return {valid: false, errors};
    }

    const metadata = await readJsonFile<Partial<ParameterWorkflowMetadata>>(metadataPath);
    const workflow = await readFile(workflowPath, 'utf8');

    for (const field of ['id', 'title', 'aliases', 'category', 'status', 'version', 'lastUpdated', 'summary'] as const) {
      if (!metadata[field]) {
        errors.push(`metadata.json 缺少字段: ${field}`);
      }
    }

    for (const heading of ['## 适用范围', '## 成功判定', '## 禁止事项']) {
      if (!workflow.includes(heading)) {
        errors.push(`workflow.md 缺少章节: ${heading}`);
      }
    }

    return {valid: errors.length === 0, errors};
  }

  private async readWorkflowEntry(entry: ParameterWorkflowIndexEntry): Promise<ParameterWorkflowDocument> {
    const baseDir = path.join(this.rootDir, entry.path);
    const metadata = await readJsonFile<ParameterWorkflowMetadata>(path.join(baseDir, 'metadata.json'));
    const workflow = await readFile(path.join(baseDir, 'workflow.md'), 'utf8');
    return {
      metadata,
      workflow,
      path: entry.path,
    };
  }
}

let cachedLibrary: ParameterWorkflowLibrary | undefined;

export async function getParameterWorkflowLibrary(): Promise<ParameterWorkflowLibrary> {
  cachedLibrary ??= new ParameterWorkflowLibrary();
  return cachedLibrary;
}

export function resetParameterWorkflowLibraryForTest(): void {
  cachedLibrary = undefined;
}

export async function exportParameterWorkflowTemplate(targetDir: string): Promise<void> {
  await mkdir(targetDir, {recursive: true});
  await writeFile(
    path.join(targetDir, 'metadata.json'),
    `${JSON.stringify(TEMPLATE_METADATA, null, 2)}\n`,
    'utf8',
  );
  await writeFile(path.join(targetDir, 'workflow.md'), TEMPLATE_WORKFLOW, 'utf8');
}

export async function listParameterWorkflows() {
  const library = await getParameterWorkflowLibrary();
  return library.listWorkflows();
}

export async function showParameterWorkflow(id: string) {
  const library = await getParameterWorkflowLibrary();
  const doc = await library.getWorkflow(id);
  return {
    id: doc.metadata.id,
    title: doc.metadata.title,
    aliases: doc.metadata.aliases,
    category: doc.metadata.category,
    summary: doc.metadata.summary,
    workflow: doc.workflow,
  };
}

export async function validateParameterWorkflow(targetDir: string) {
  const library = await getParameterWorkflowLibrary();
  return library.validateWorkflowDirectory(targetDir);
}
