import * as yup from "yup";
import { playerPostition } from "../utils/constant";

export const mathcRequestSchema = yup.object().shape({
  videoUrl: yup
    .string()
    .url("Video URL must be a valid URL")
    .required("Video URL is required"),

  lineUpUrl: yup.string().url("lineup Url must be valid!").nullable(),

  player: yup.array().of(
    yup.object().shape({
      name: yup.string().required("Player name is required!"),
      jerseyNumber:yup.number().typeError("jersey number must be a number!").required('Jerset number is required!'),
      position: yup.string().oneOf(playerPostition,'Position must be on of the allowed roles!').required('Position is required!'),
      team: yup.string().nullable()
    })
  ),
});
