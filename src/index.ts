import { createServer } from "./server";
import pkg from "../package.json"
import dotenv from 'dotenv'

dotenv.config()
const version = pkg.version
const server = createServer(3000, version);
