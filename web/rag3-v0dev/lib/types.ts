// 企业级 RAG 3.0 知识库系统 — 全局类型定义

export type KBStatus = 'active' | 'indexing' | 'error' | 'archived'
export type DocStatus = 'parsed' | 'parsing' | 'failed' | 'uploading' | 'queued'
export type Confidentiality = 'public' | 'internal' | 'confidential' | 'restricted'

export interface KnowledgeBase {
  id: string
  name: string
  icon: string
  description: string
  docCount: number
  chunkCount: number
  size: string
  status: KBStatus
  quality: number
  updatedAt: string
  embeddingModel: string
  llmModel: string
}

export interface DocItem {
  id: string
  name: string
  type: 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'TXT' | 'MD' | 'CSV'
  size: string
  status: DocStatus
  quality: number | null
  confidentiality: Confidentiality
  updatedAt: string
  progress?: number
}

export interface ChunkItem {
  id: string
  index: number
  title: string
  content: string
  type: 'text' | 'table'
  tokens: number
  page: string
  confidentiality: Confidentiality
  strategy: string
  tableData?: { headers: string[]; rows: string[][] }
}

export interface Citation {
  index: number
  docName: string
  page: string
  snippet: string
  relevance: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  confidence?: { score: number; level: 'high' | 'medium' | 'low' }
  routing?: { tier: string; channel: string }
  latency?: string
  feedback?: 'up' | 'down' | null
}

export interface Conversation {
  id: string
  title: string
  group: '今天' | '昨天' | '更早'
  pinned?: boolean
}
