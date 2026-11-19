import { Module } from "@medusajs/framework/utils"

import ChatbotModuleService from "./service"

export const CHATBOT_MODULE = "chatbot"

export * from "./types/common"
export { ChatbotModuleService }

export default Module(CHATBOT_MODULE, {
  service: ChatbotModuleService,
})
