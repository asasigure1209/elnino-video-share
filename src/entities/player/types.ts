export interface Player {
  id: number
  name: string
  videos: string[]
}

export interface CreatePlayerData {
  name: string
}

export interface UpdatePlayerData {
  id: number
  name: string
}
