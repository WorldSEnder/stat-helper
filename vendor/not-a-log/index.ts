// Includes modifications to correct typing informations
/*! not-a-logger. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
import { Console } from 'console'
import { Transform } from 'stream'

const ts = new Transform({ transform: (chunk, _, cb) => cb(null, chunk) })
const logger = new Console({ stdout: ts, stderr: ts, colorMode: false })
const handler = {
  get (_:any , prop: keyof Console): any {
    return new Proxy(logger[prop], handler)
  },
  apply (target: (this: Console, ...args: any) => void, _: any, args: any) {
    target.apply(logger, args)
    return (ts.read() || '').toString()
  }
}

type ReplaceReturnType<T extends (...a: any) => any, TNewReturn> = (...a: Parameters<T>) => TNewReturn;
type Dump = { [K in keyof Console]: Console[K] extends (...args: any) => void ? ReplaceReturnType<Console[K], string> : Console[K] };
/** @type {typeof console} */
const dump: Dump = new Proxy(logger, handler)
export default dump
