import OpenAI from "openai";
import process from "node:process";

export const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const MODEL = "gemini-2.5-flash-lite";
