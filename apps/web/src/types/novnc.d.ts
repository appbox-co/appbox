declare module "@novnc/novnc" {
  interface RfbCredentials {
    password?: string
  }

  interface RfbOptions {
    credentials?: RfbCredentials
  }

  export default class RFB extends EventTarget {
    constructor(target: Element, url: string, options?: RfbOptions)
    disconnect(): void
    focus(): void
    clipboardPasteFrom(text: string): void
    sendKey(keysym: number, code?: string, down?: boolean): void
    resizeSession: boolean
    scaleViewport: boolean
    viewOnly: boolean
    focusOnClick: boolean
  }
}
