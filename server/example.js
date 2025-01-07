import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { PeersocketServer } from './server.js'

const app = new Hono()
app.use(cors())
const peersocket = new PeersocketServer()

app.get('/', (c) => {
    return c.text('Peersocket Server')
})

app.get('/offer', async (c) => {
    const details = await c.req.query("d")
    console.log(`Offer requested with details: ${details}`)
    if (details) {
        const { sessionId, offer } = await peersocket.createOffer({ data: details })
        console.log(`Offer created for ${sessionId}`)
        return c.json({ sessionId, offer })
    } else {
        const { sessionId, offer } = await peersocket.createOffer()
        console.log(`Offer created for ${sessionId}`)
        return c.json({ sessionId, offer })
    }
})

app.post('/answer', async (c) => {
    const data = await c.req.json()
    console.log(`Answer received for ${data.sessionId}`)
    await peersocket.handleAnswer(data.sessionId, data.answer)
    return c.json({ success: true })
})

app.post('/send', async (c) => {
    const data = await c.req.json()
    await peersocket.send(data.sessionId, data.data)
    return c.json({ success: true })
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

serve(app)
console.log('Server running at http://localhost:3000')