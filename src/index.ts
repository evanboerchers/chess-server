import { createServer } from './server';
if (require.main === module) {
    const app = createServer(3000)
}