export interface RequestMatchAnalysisBody {
  videoUrl: string;
  lineUpImage?: string;
  Player: Player[];
  Club: Club[];
}

export interface Club {
  name :       String
  country :    String
  isHomeClub:   Boolean
  jerseyColor: String
}

export interface Player {
  jerseyNumber: number;
  position: string;
  matchId: String;
  firstName: String;
  surname: String;
  country: String;
  level: String;
  dateOfBirth: Date;
  isHomeTeam: Boolean;
}

export interface MatchStatusBody {
  status: "PENDING" | "PROCESSING" | "COMPLETED";
}
