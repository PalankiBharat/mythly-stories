export type StoryStatus = 'draft' | 'published';
export type AspectRatio = '1:1' | '3:4' | '16:9';
export type SpacerSize = 'sm' | 'md' | 'lg';

// ── Marks (new model) ──────────────────────────────────────────
export interface BoldMark      { type: 'bold' }
export interface ItalicMark    { type: 'italic' }
export interface UnderlineMark { type: 'underline' }
export interface LinkMark      { type: 'link'; href: string; target: '_blank' | '_self' }
export interface StoryLinkMark { type: 'storyLink'; storySlug: string }
export interface SanskritMark  { type: 'sanskrit'; transliteration?: string | null; meaning?: string | null }

export type Mark =
  | BoldMark
  | ItalicMark
  | UnderlineMark
  | LinkMark
  | StoryLinkMark
  | SanskritMark;
export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'SLUG_CONFLICT'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'IMAGE_UPLOAD_FAILED'
  | 'INTERNAL_ERROR';

export interface LoginRequest {
  username: string;
  password: string;
}
export interface LoginResponse {
  token: string;
  expiresIn: number;
}

export interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
    details?: string[];
    debug?: string;
  };
}

export interface FeaturedImage {
  url: string;
  alt: string;
  aspectRatio: AspectRatio;
  generationPrompt?: string | null;
}

export interface StoryMetadata {
  characters: string;
  theme: string;
  source: string;
  verification?: string | null;
}

export interface Teaser {
  nextStorySlug: string;
  content: InlineNode[];
}

// ── Inline node (new model) ────────────────────────────────────
export interface InlineNode {
  text: string;
  marks: Mark[]; // always an array, never null
}

// Blocks
export interface LeadParagraphBlock {
  type: 'leadParagraph';
  content: InlineNode[];
}
export interface ParagraphBlock {
  type: 'paragraph';
  content: InlineNode[];
}
export interface DialogueBlock {
  type: 'dialogue';
  speaker: string;
  content: InlineNode[];
}
export interface SceneImageBlock {
  type: 'sceneImage';
  url: string;
  alt: string;
  caption: string;
  aspectRatio: AspectRatio;
  generationPrompt?: string | null;
}
export interface DividerBlock {
  type: 'divider';
}
export interface SpacerBlock {
  type: 'spacer';
  size: SpacerSize;
}
export type Block =
  | LeadParagraphBlock
  | ParagraphBlock
  | DialogueBlock
  | SceneImageBlock
  | DividerBlock
  | SpacerBlock;

export interface Story {
  schemaVersion: number;
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  source: string;
  featuredImage: FeaturedImage;
  heroMeta: string[];
  readingTimeMinutes: number;
  moral: InlineNode[] | null;
  teaser: Teaser | null;
  metadata: StoryMetadata;
  blocks: Block[];
  status: StoryStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StorySummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  source: string;
  featuredImage: FeaturedImage;
  heroMeta: string[];
  readingTimeMinutes: number;
  status: StoryStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateStoryRequest {
  schemaVersion: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  source: string;
  featuredImage: FeaturedImage;
  heroMeta: string[];
  readingTimeMinutes?: number | null;
  moral?: InlineNode[] | null;
  teaser?: Teaser | null;
  metadata: StoryMetadata;
  blocks: Block[];
  status?: StoryStatus;
}
export type UpdateStoryRequest = CreateStoryRequest;
