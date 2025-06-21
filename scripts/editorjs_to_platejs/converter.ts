import { Value, Descendant, TElement, TText, UnknownObject } from 'platejs';

/*
PlateJS

type Value = TElement[];

type UnknownObject = {
    [x: string]: unknown;
}

type TElement = {
    children: Descendant[];
    type: string;
} & UnknownObject

type TText = {
    text: string;
} & UnknownObject

type Descendant = TElement | TText
*/

// EditorJS editor value is ArticleContentType:
export interface ArticleContentType {
  time?: number;
  blocks: ArticleBlockType[];
  version?: string;
}

export interface ArticleBlockType {
  id?: string;
  type: string;
  data: object;
}