export type VideoType =
  | "予選"
  | "TOP16"
  | "TOP8"
  | "TOP4"
  | "3位決定戦"
  | "決勝戦"

export interface Video {
  id: number
  name: string
  type: VideoType
}

export interface CreateVideoData {
  name: string
  type: VideoType
}

export interface UpdateVideoData {
  id: number
  name: string
  type: VideoType
}
