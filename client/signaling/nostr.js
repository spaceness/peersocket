import '@cmdcode/nostr-emitter'

export class PSSignalNostr {
    constructor(url) {
        if (!url) {
            throw new Error('URL is required');
        }

        this.emitter = new window.NostrEmitter();
        this.url = new URL(url);
        this.sessionId = null;
    }

    async getOffer() {
        try {
            await this.emitter.connect(this.url.origin, this.url.pathname.split('/').pop());
            // create a random 9 digit request ID
            const reqID = Math.floor(Math.random() * 1000000000)
            this.emitter.publish('requestOffer', reqID);
            console.log(`Offer requested with reqID: ${reqID}`);
            return new Promise((resolve, reject) => {
                this.emitter.on('offer', (offer) => {
                    if (offer.reqID === reqID) {
                        this.sessionId = offer.sessionId;                 
                        resolve(offer.offer);
                    }
                });
            });
        } catch (err) {
            console.error(err);
            throw new Error('Failed to get offer');
        }
    }

    async sendAnswer(answer) {
        if (!this.sessionId) {
            throw new Error('Session ID is required');
        }

        try {
            this.emitter.publish('answer', {
                sessionId: this.sessionId,
                answer,
            });
        } catch (err) {
            console.error(err);
            throw new Error('Failed to send answer');
        }
    }
}