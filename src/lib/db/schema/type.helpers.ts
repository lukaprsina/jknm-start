export interface ArticleBlockType {
  id?: string;
  type: string;
  data: object;
}
export interface ArticleContentType {
  time?: number;
  blocks: ArticleBlockType[];
  version?: string;
}
