/*export type ArrayMetadata = {
    length: number;
    firstObject: any | undefined;
  };
  export function getArrayMetadata(arr: any[]): ArrayMetadata;*/
  export function webObject(pid: string, decorator: Function, option: object);
  export type PolicyEnum = {NONE: string; SESSION: string; LOCAL: string;};
  export const storepolicy:PolicyEnum;
  //export const localStore: Storage;
  