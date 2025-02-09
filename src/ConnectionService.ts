import { Socket } from "socket.io";

class ConnectionService {
    
    openSockets: Socket[]

    constructor() {
        this.openSockets = []
    }

    handleConnection(socket: Socket) {
        socket.on('join_queue', () => {
            
        })
    }
}
const connectionService = ConnectionService
export default connectionService