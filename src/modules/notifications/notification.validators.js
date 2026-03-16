import Joi from "joi";
import { CHANNELS } from "../../utils/constants.js";

export const sendNotificationSchema = Joi.object({
  userId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  customerId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  title: Joi.string().min(1).max(200).required(),
  message: Joi.string().min(1).max(1000).required(),
  channel: Joi.string()
    .valid(...Object.values(CHANNELS))
    .required()
});
