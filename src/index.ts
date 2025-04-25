import { createServer } from "./server";
import pkg from "../package.json"

const version = pkg.version
const server = createServer(3000, version);
