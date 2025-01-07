import NostrEmitter from '@cmdcode/nostr-emitter'
import { PeersocketServer } from './server.js'

const peersocket = new PeersocketServer()
const emitter = new NostrEmitter()
await emitter.connect('wss://nostr.grooveix.com', 'some-room-id')

// handle incoming offer requests
emitter.on('requestOffer', async (reqID) => {
    console.log(`Offer requested with reqID: ${reqID}`)
    const { sessionId, offer } = await peersocket.createOffer()
    emitter.publish('offer', { reqID, sessionId, offer })
})

// handle incoming answers
emitter.on('answer', async (data) => {
    console.log(`Answer received for ${data.sessionId}`)
    await peersocket.handleAnswer(data.sessionId, data.answer)
})

peersocket.onopen = (peer, sessionId) => {
    console.log(`Peer ${sessionId} connected`)
}

peersocket.onmessage = (peer, message, sessionId, details) => {
    console.log(`Message from ${sessionId}: ${message}. Details: ${details}`)
    peer.send(new TextEncoder().encode("Hello from server"))
}

peersocket.onerror = (peer, error, sessionId) => {
    console.error(`Error from ${sessionId}: ${error}`)
}

peersocket.onclose = (peer, sessionId) => {
    console.log(`Peer ${sessionId} disconnected`)
}