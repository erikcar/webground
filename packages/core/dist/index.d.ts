/*export type ArrayMetadata = {
    length: number;
    firstObject: any | undefined;
  };
  export function getArrayMetadata(arr: any[]): ArrayMetadata;*/
/*
this.pid = pid;
    this.decorator = decorator || donothing;
    this.option = option || {};
    this.data = null;
    this.store = { save: donothing, getData: donothing };
    this.initialized = false;
    this.local = false;
    this.syncronize = false;
 */

import { AxiosRequestConfig } from "axios";

//export type PolicyEnum = { NONE: string; SESSION: string; LOCAL: string; };
//export const storepolicy: PolicyEnum;

export interface deferredAction {
  offset: number;
  timer: null;
  waiting: boolean;
  execute: () => void;
  setOffset: (value: number) => void;
}

export interface deferredActionConstructor {
  new(action: Function, offset?: number): deferredAction;
}

export var deferredAction: deferredActionConstructor;

export interface waitAction {
  time: number;
  action: Function;
  deferred: deferredAction;
  execute: () => void;
  executeNow: () => void;
}

export interface waitActionConstructor {
  new(action: Function, wait?: number): waitAction;
}

export var waitAction: waitActionConstructor;

export interface lifeCycle {
  load: (fn:Function) => void;
  unload: (fn:Function) => void;
}

export interface webground {
  getCookie: (name: string) => string | null;
  lifeCycle: lifeCycle;
} 

export interface wostore {
  save: (object: webObject) => void;
  getData: (object: webObject) => object;
}

export const localStore: wostore;
export const sessionStore: wostore;

export type Decorator = (instance: webObject, option: object) => number;

export interface webObject {
  data: object;
  initialized: boolean;
  local: boolean;
  option: object;
  pid: string;
  store: wostore;
  syncronize: boolean;
  decorator: Decorator;
  init: (option: object) => object;
  save: () => void;
  setField: (name: string, value: any) => void;
  setOption: (option: object, reset: boolean) => void;
  sync: () => Promise<object>;
  syncOnNextLoad: () => void;
  toJSON: () => string;
}

export interface webObjectConstructor {
  new(pid: string, decorator?: Decorator, option?: object): webObject;
}

export var webObject: webObjectConstructor;
//export function webObject(pid: string, decorator: Function, option: object);

export type onbreakpoint = (info: object, media: string, breakpoint: string) => void;
  

export interface wgsession extends webObject {
  logged: string;
  onReady: Array<Function>;
  onresize: waitAction;
  polyfilled: boolean;
  time: number;
  user: webObject;

  onbreakpoint: onbreakpoint;
  ready: (fn: Function) => void;
  resize: () => void;
  start: () => void;
}

export const session: wgsession;

/**
 * Apix Definition
 */
interface apixOption extends AxiosRequestConfig {

}

interface apixCall { 
  id: string; 
  option: apixOption;
  resolve: (result: object) => void; 
  reject: (reason: object) => void;
}

interface apix {
  apiUrl: string;
  call_queue: Array<apixCall>;
  channel: object;
  dataOp: string;
  method: string;
  option: apixOption;
  parser: null;
  queryOp: string;
  retry: IRetry;
  call: (op: string, data: object, opt: apixOption) => Promise<object>;
  callMany: () => Promise<object>;
  CanExecute: (id: string, mode: string) => boolean;
  checkQueue: (config: apixOption) => void;
  findCall: (id: string) => apixCall;
  formatOption: (opt: apixOption) => void;
  rawCall: (opt: apixOption, resolve: (result: object) => void, reject: (reason: object) => void) => void;
  syncCall: () => void;
}

interface apixConstructor {
  new(pid: string, decorator?: Decorator, option?: apixOption): webObject;
}

export const Apix: apix;

export interface IRetry{
  count: number;
  apply: (er: string) => null;
  canApply: (er: string) => boolean;// && er.type !== "RESPONSE";
  reset: () => null;
}

export interface callRetry extends IRetry {
  attempts: number;
  onApply: Function;
  wait: number;
}

interface callRetryConstructor {
  new(num?: number, wait?: number): callRetry;
}

export var callRetry: callRetryConstructor;

export interface IApixChannel {
  send: (opt: apixOption) => Promise<any>;
}

export interface axiosChannel extends IApixChannel{
  baseUrl: string;
}

interface axiosChannelConstructor {
  new(baseUrl?: string): axiosChannel;
}

export var axiosChannel: axiosChannelConstructor;

export var isString: (value: string) => boolean;
