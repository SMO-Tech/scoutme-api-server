import * as yup from "yup";
import { playerPostition } from "../utils/constant";

const MATCH_LEVELS = [
  "Professional",
  "semiProfessional",
  "academicTopTier",
  "academicAmateur",
  "sundayLeague",
] as const;

const playerSchema = yup
  .object({
    jerseyNumber: yup
      .number()
      .required("Jersey number is required")
      .integer("Jersey number must be an integer")
      .min(1, "Jersey number must be at least 1")
      .max(99, "Jersey number must be at most 99"),

    position: yup
      .string()
      .oneOf(playerPostition)
      .required("Position is required")
      .trim()
      .min(1, "Position cannot be empty"),

    firstName: yup
      .string()
      .required("First name is required")
      .trim()
      .min(1, "First name cannot be empty")
      .max(100, "First name is too long"),

    surname: yup
      .string()
      .required("Surname is required")
      .trim()
      .min(1, "Surname cannot be empty")
      .max(100, "Surname is too long"),

    country: yup
      .string()
      .required("Country is required")
      .trim()
      .min(2, "Country must be at least 2 characters")
      .max(100, "Country is too long"),

    level: yup
      .string()
      .required("Level is required")
      .oneOf(MATCH_LEVELS, `Level must be one of: ${MATCH_LEVELS.join(", ")}`),

    dateOfBirth: yup
      .date()
      .required("Date of birth is required")
      .max(new Date(), "Date of birth cannot be in the future")
      .test("min-age", "Player must be at least 5 years old", function (value) {
        if (!value) return false;
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 5);
        return value <= minDate;
      })
      .test(
        "max-age",
        "Player must be less than 100 years old",
        function (value) {
          if (!value) return false;
          const maxDate = new Date();
          maxDate.setFullYear(maxDate.getFullYear() - 100);
          return value >= maxDate;
        }
      ),

    isHomeTeam: yup.boolean().required("isHomeTeam is required"),
  })
  .required();

const clubSchema = yup
  .object({
    name: yup
      .string()
      .required("Club name is required")
      .trim()
      .min(1, "Club name cannot be empty")
      .max(200, "Club name is too long"),

    country: yup
      .string()
      .required("Country is required")
      .trim()
      .min(2, "Country must be at least 2 characters")
      .max(100, "Country is too long"),

    isHomeClub: yup.boolean().required("isHomeClub is required"),

    jerseyColor: yup
      .string()
      .trim()
      .max(50, "Jersey color is too long")
      .optional(),
  })
  .required();

export const matchRequestSchema = yup
  .object({
    videoUrl: yup
      .string()
      .required("Video URL is required")
      .url("Video URL must be a valid URL")
      .trim(),

    lineUpImage: yup
      .string()
      .url("Line up image must be a valid URL")
      .trim()
      .optional(),

    Player: yup
      .array()
      .of(playerSchema)
      .required("Players array is required")
      .min(1, "At least one player is required")
      .test(
        "home-away-balance",
        "Must have players from both home and away teams",
        function (players) {
          if (!players || players.length === 0) return false;
          const hasHome = players.some((p) => p.isHomeTeam === true);
          const hasAway = players.some((p) => p.isHomeTeam === false);
          return hasHome && hasAway;
        }
      )
      .test(
        "unique-jersey-per-team",
        "Jersey numbers must be unique per team",
        function (players) {
          if (!players) return true;

          const homeJerseys = new Set();
          const awayJerseys = new Set();

          for (const player of players) {
            const jerseySet = player.isHomeTeam ? homeJerseys : awayJerseys;
            if (jerseySet.has(player.jerseyNumber)) {
              return this.createError({
                message: `Duplicate jersey number ${player.jerseyNumber} in ${
                  player.isHomeTeam ? "home" : "away"
                } team`,
              });
            }
            jerseySet.add(player.jerseyNumber);
          }
          return true;
        }
      ),

    Club: yup
      .array()
      .of(clubSchema)
      .required("Clubs array is required")
      .min(2, "Exactly 2 clubs are required (home and away)")
      .max(2, "Exactly 2 clubs are required (home and away)")
      .test(
        "one-home-one-away",
        "Must have exactly one home club and one away club",
        function (clubs) {
          if (!clubs || clubs.length !== 2) return false;
          const homeClubs = clubs.filter((c) => c.isHomeClub === true);
          const awayClubs = clubs.filter((c) => c.isHomeClub === false);
          return homeClubs.length === 1 && awayClubs.length === 1;
        }
      ),
  })
  .required();
