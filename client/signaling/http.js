export class PSSignalHttp {
    constructor(url) {
        if (!url) {
            throw new Error('URL is required');
        }

        if (url.startsWith('wss://')) {
            url = url.replace('wss://', 'https://');
        }

        if (url.startsWith('ws://')) {
            url = url.replace('ws://', 'http://');
        }

        this.url = url;
        this.sessionId = null;
    }

    getOffer() {
        const xhr = new XMLHttpRequest();
        const url = new URL(this.url);
        if (url.pathname.endsWith('/')) {
            url.pathname = url.pathname.slice(0, -1) + '/offer';
        } else {
            url.pathname += '/offer';
        }

        xhr.open('GET', url.toString(), false); // false makes it synchronous
        xhr.send();
        
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            this.sessionId = data.sessionId;
            return data.offer;
        }
        throw new Error('Failed to get offer');
    }

    sendAnswer(answer) {
        const xhr = new XMLHttpRequest();
        const url = new URL(this.url);
        if (url.pathname.endsWith('/')) {
            url.pathname = url.pathname.slice(0, -1) + '/answer';
        } else {
            url.pathname += '/answer';
        }
        xhr.open('POST', url.toString(), false); // false makes it synchronous
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        const payload = JSON.stringify({
            sessionId: this.sessionId,
            answer,
        });
        
        xhr.send(payload);
        
        if (xhr.status === 200) {
            return JSON.parse(xhr.responseText);
        }
        throw new Error('Failed to send answer');
    }
}