import Peer from 'simple-peer/simplepeer.min.js';
import { PSSignalNostr } from './signaling/nostr.js';

const ENABLE_DEBUG = false;

function log(...args) {
    if (ENABLE_DEBUG) {
        console.log("[peersocket-client]", ...args);
    }
}

function data_to_array(data) {
    //data already in correct type
    if (data instanceof Uint8Array) {
      return data;  
    }
  
    else if (typeof data === "string") {
      return new TextEncoder().encode(data);
    }
  
    else if (data instanceof ArrayBuffer) {
      return new Uint8Array(data);
    }
  
    //dataview objects or any other typedarray
    else if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer);
    }
  
    throw new TypeError("invalid data type to be sent");
  }

export class Peersocket extends EventTarget {
    constructor(url, protocols = [], options = {}) {
        super();

        this.url = url;
        this.protocols = protocols;
        this.options = options;
        this.binaryType = "blob";

        //legacy event handlers
        this.onopen = () => { };
        this.onerror = () => { };
        this.onmessage = () => { };
        this.onclose = () => { };

        this.CONNECTING = 0;
        this.OPEN = 1;
        this.CLOSING = 2;
        this.CLOSED = 3;
        this.status = this.CONNECTING;

        this.socket = null;
        this.signaling = new PSSignalNostr(url);
        this.connect();
    }

    connect() {
        this.socket = new Peer({trickle: false})
        this.socket.on('error', err => {
            this.status = this.CLOSED;
            let error_event = new Event("error");
            this.dispatchEvent(error_event);
            this.onerror(error_event);

            console.error('[peersocket-client] error in simple-peer', err)
        })

        this.socket.on('signal', (data) => {
            log("Sending answer", data)
            this.signaling.sendAnswer(data)
        })

        this.signaling.getOffer().then(offer => {
            this.socket.signal(offer)
            log("Offer received")
        })

        this.socket.on('connect', () => {
            this.status = this.OPEN;
            let open_event = new Event("open");
            this.onopen(open_event);
            this.dispatchEvent(open_event);

            log("Connected to server")
        })

        this.socket.on('close', () => {
            this.status = this.CLOSED;
            let close_event = new CloseEvent("close");
            this.dispatchEvent(close_event);
            this.onclose(close_event);

            log("Connection closed")
        })

        this.socket.on('data', (data) => {
            let converted;
            if (typeof data === "string") {
                converted = data;
            }
            else { //binary frame received as uint8array
                if (this.binaryType == "blob") {
                    converted = new Blob(data);
                }
                else if (this.binaryType == "arraybuffer") {
                    converted = data.buffer;
                }
                else {
                    throw new TypeError("invalid binaryType string");
                }
            }

            let msg_event = new MessageEvent("message", { data: converted });
            this.onmessage(msg_event);
            this.dispatchEvent(msg_event);

            log("Message received", converted)
        })
    }

    send(data) {
        if (this.status === this.CONNECTING) {
            throw new DOMException("websocket not ready yet");
        }
        if (this.status === this.CLOSED) {
            return;
        }

        if (data instanceof Blob) {
            (async () => {
                let array_buffer = await data.arrayBuffer();
                this.socket.send(new Uint8Array(array_buffer));
            })();
        }
        else if (typeof data === "string") {
            this.socket.send(data);
        }
        else {
            this.socket.send(data_to_array(data));
        }

        log("Message sent")
    }

    close() {
        this.status = this.CLOSING;
        this.socket.destroy();
    }

    get readyState() {
        return this.status;
    }
    get bufferedAmount() {
        return 0;
    }
    get protocol() {
        return this.protocols[0] || "";
    }
    get extensions() {
        return "";
    }
}