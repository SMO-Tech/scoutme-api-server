export interface RequestMatchAnalysisBody {
  videoUrl: string;
  lineUpImage?: string;

  matchLevel: MatchLevel;

  // Club list: exactly TWO expected — yourTeam + opponentTeam
  clubs: ClubInput[];

  // All players from both teams
  players: PlayerInput[];
}

export interface ClubInput {
  name: string;
  country: string;
  jerseyColor: string;
  logoUrl?:string
  // "yourTeam" / "opponentTeam"
  teamType: "yourTeam" | "opponentTeam";
}

export interface PlayerInput {
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  dateOfBirth?: string; // string from frontend
  position: PlayerPosition;
  country: string;
  teamType: "yourTeam" | "opponentTeam";
}

export type PlayerPosition =
  | "Goalkeeper"
  | "Right Back"
  | "Right Centre Back"
  | "Sweeper"
  | "Left Centre Back"
  | "Left Back"
  | "Right Wing Back"
  | "Right Defensive Midfielder"
  | "Central Defensive Midfielder"
  | "Left Defensive Midfielder"
  | "Left Wing Back"
  | "Right Wing Forward"
  | "Right Winger"
  | "Right Central Midfielder"
  | "Central Midfielder"
  | "Left Central Midfielder"
  | "Left Winger"
  | "Left Wing Forward"
  | "Right Attacking Midfielder"
  | "Central Attacking Midfielder"
  | "Left Attacking Midfielder"
  | "Right Striker"
  | "Centre Forward"
  | "Left Striker";

export type MatchLevel =
  | "PROFESSIONAL"
  | "SEMI_PROFESSIONAL"
  | "ACADEMIC_TOP_TIER"
  | "ACADEMIC_AMATEUR"
  | "SUNDAY_LEAGUE";
