import { DescService } from '@bufbuild/protobuf';
import { Reflector } from '@nestjs/core';

export const ConnectRpc = Reflector.createDecorator<DescService>({
  key: 'connect-rpc'
});
