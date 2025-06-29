export interface PlayerVideo {
  id: number
  player_id: number
  video_id: number
}

export interface CreatePlayerVideoData {
  player_id: number
  video_id: number
}

export interface UpdatePlayerVideoData {
  id: number
  player_id: number
  video_id: number
}

// プレイヤーと動画の関連情報を含む拡張型
export interface PlayerVideoWithDetails extends PlayerVideo {
  player_name: string
  video_name: string
  video_type: string
}
