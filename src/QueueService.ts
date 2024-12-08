import { Player } from "./types";

class QueueService {
    queue: Player[]
    
    constructor() {
        this.queue = []
    }

    addToQueue(player: Player): void {
        if (!this.queue.some(p => p.id === player.id)) {
            this.queue.push(player);
        }
    }

    findMatch(): Player[] | null {
        if (this.queue.length < 2) {
            return null;
        }
        const matchedPlayers = this.queue.splice(0, 2);
        GamesService
    }
}   

const queueService = new QueueService();
export default queueService