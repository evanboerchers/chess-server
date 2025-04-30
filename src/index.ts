import { createServer, ServerOptions } from "./server";
import pkg from "../package.json"
import dotenv from 'dotenv'

dotenv.config()
const serverOptions: ServerOptions = {
    port: 3000,
    version: pkg.version,
    corsOrigin: process.env.CORS_ORIGIN
}
const server = createServer(serverOptions);
