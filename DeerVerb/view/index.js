
const DEV_MODE = false;
const DEV_URL = "http://localhost:3000";

class MyView extends HTMLElement
{
    state = {};
    constructor (patchConnection)
    {
       super(); 
       this.patchConnection = patchConnection;
       this.patchConnection.name = "cheese";
       this.innerHTML = this.getHTML();
       
    }

    connectedCallback()
    {        
        // receive message from the react app
        window.addEventListener("message", (event) => {
            if (event?.data?.type === 'param') {
                this.patchConnection.sendEventOrValue(event.data.id, event.data.value)
            }
        });

        // Listen for state from cmajor
        this.statusListener = event => {
            this.state = event;
            const frame = this.querySelector("#react-iframe");
            frame.contentWindow.postMessage({
                type: 'state',
                ...event
            }, '*');
            updateStyle(this);
        };
        this.patchConnection.addStoredStateValueListener(this.statusListener);
        this.patchConnection.requestFullStoredState(this.statusListener);
        
        // Listen for param changes from cmajor
        this.paramListener = event => {
            this.state = event;
            updateStyle(this);
            const frame = this.querySelector("#react-iframe");
            frame.contentWindow.postMessage({
                type: 'param',
                ...event
            }, '*');
        };
        this.patchConnection.addAllParameterListener(this.paramListener);

        // Tell the react app to boot up
        setTimeout(() => {
            const frame = this.querySelector("#react-iframe");
            frame.contentWindow.postMessage({
                type: 'command',
                command: 'boot'
            }, '*');
        }, 1000);
    }

    disconnectedCallback()
    {
        this.patchConnection.removeAllParameterListener (this.paramListener);
    }

    getState() {
        return JSON.stringify(this.state);
    }

    getUrl() {
        const base = new URL (".", import.meta.url);
        const url =  new URL ("./react-build/index.html", base);
        return DEV_MODE ? DEV_URL : url;
    }
    getHTML()
    {
        return `
            <style>
                .react-container {
                    font-family: Verdana, sans-serif;
                    text-align: center;
                    display: block;
                    width: 550px;
                    height: 700px;
                    padding: 0px;
                    overflow: auto;
                    flex-direction: column;
                    align-items: center;
                    background-color: black;
                    overflow: hidden;
                }
                #react-iframe {
                    width: 550px;
                    height: 700px;
                    border: none;
                    overflow: hidden;
                }
            </style>
            <body>
                <div class="react-container">
                    
                    <iframe id="react-iframe" src="${this.getUrl()}"></iframe>
                </div>
            </body>
        `;   
    }
}

window.customElements.define ("my-view", MyView);

export default function createPatchView (patchConnection)
{
    return new MyView (patchConnection);
}