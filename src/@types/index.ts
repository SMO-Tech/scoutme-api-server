export interface RequestMatchAnalysisBody {
  videoUrl: string;
  lineUpImage?: string;
  players: Player[];
}

export interface Player {
  name: string;
  jerseyNumber: number;
  position: string;
  team?: string;
}
