import { DescService } from '@bufbuild/protobuf';

type ConnectRpcRequest<T extends DescService, U extends keyof T['method']> =
  T['method'][U] extends { methodKind: 'unary' } ?
    // @ts-ignore
    Exclude<T['method'][U]['input']['a'], boolean> :
  T['method'][U] extends { methodKind: 'server_streaming' } ?
    // @ts-ignore
    Exclude<T['method'][U]['input']['a'], boolean> :
  T['method'][U] extends { methodKind: 'client_streaming' } ?
    // @ts-ignore
    AsyncGenerator<Exclude<T['method'][U]['input']['a'], boolean>> :
  T['method'][U] extends { methodKind: 'bidi_streaming' } ?
    // @ts-ignore
    AsyncGenerator<Exclude<T['method'][U]['input']['a'], boolean>> :
    void;

type ConnectRpcResponse<T extends DescService, U extends keyof T['method']> =
  T['method'][U] extends { methodKind: 'unary' } ?
    // @ts-ignore
    Exclude<T['method'][U]['output']['a'], boolean> :
  T['method'][U] extends { methodKind: 'server_streaming' } ?
    // @ts-ignore
    Exclude<T['method'][U]['output']['a'], boolean> :
  T['method'][U] extends { methodKind: 'client_streaming' } ?
    // @ts-ignore
    AsyncGenerator<Exclude<T['method'][U]['output']['a'], boolean>> :
  T['method'][U] extends { methodKind: 'bidi_streaming' } ?
    // @ts-ignore
    AsyncGenerator<Exclude<T['method'][U]['output']['a'], boolean>> :
    void;

type ConnectRpcPropertyDescriptor<T extends DescService, U extends keyof T['method']> =
  TypedPropertyDescriptor<(request: ConnectRpcRequest<T, U>) => ConnectRpcResponse<T, U> | Promise<ConnectRpcResponse<T, U>>>;

export function ConnectRpc<T extends DescService>(service: T) {
  return function<U extends keyof T['method']>(
    _target: any,
    _propertyKey: U,
    descriptor: ConnectRpcPropertyDescriptor<T, U>
  ) {
    if (descriptor.value) {
      Reflect.defineMetadata('connect-rpc', service, descriptor.value);
    } else {
      throw new Error('ConnectRpc must be used on a method');
    }
  }
}

ConnectRpc.KEY = 'connect-rpc';
