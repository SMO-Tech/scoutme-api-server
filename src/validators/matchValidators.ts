import * as yup from "yup";
import { playerPostition } from "../utils/constant";

export const matchRequestSchema = yup.object().shape({
  videoUrl: yup
    .string()
    .url("Video URL must be a valid URL")
    .required("Video URL is required"),

  lineUpUrl: yup.string().url("Lineup URL must be valid!").nullable(),

  players: yup
    .array()
    .of(
      yup.object().shape({
        name: yup.string().required("Player name is required!"),
        jerseyNumber: yup
          .number()
          .typeError("Jersey number must be a number!")
          .required("Jersey number is required!"),
        position: yup
          .string()
          .oneOf(playerPostition, "Position must be one of the allowed roles!")
          .required("Position is required!"),
        team: yup.string().nullable(),
      })
    )
    .required("Players list is required")
    .min(11, "You must provide exactly 11 players")
    .max(11, "You must provide exactly 11 players"),
});
