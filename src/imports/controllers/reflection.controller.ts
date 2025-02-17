import { create, toBinary } from '@bufbuild/protobuf';
import { Controller } from '@nestjs/common';

import {
  FileDescriptorResponseSchema,
  ListServiceResponseSchema,
  ServerReflection,
  ServerReflectionRequest,
  ServerReflectionResponse,
  ServerReflectionResponseSchema,
  ServiceResponseSchema
} from '#imports/protobufs/v1alpha/reflection_pb.js';
import { ConnectRpc } from '#imports/decorators/connect-rpc.js';
import { registry } from '#imports/registry.js';
import { FileDescriptorProtoSchema } from '@bufbuild/protobuf/wkt';

@Controller()
export class ReflectionController {
  @ConnectRpc(ServerReflection)
  public async * serverReflectionInfo(
    requests: AsyncGenerator<ServerReflectionRequest>
  ): AsyncGenerator<ServerReflectionResponse> {
    for await (const request of requests) {
      switch (request.messageRequest.case) {
        case 'fileContainingSymbol': {
          yield this.fileContainingSymbol(request);
          break;
        }
        case 'listServices': {
          yield this.listServices(request);
          break;
        }
      }
    }
  }

  private fileContainingSymbol(request: ServerReflectionRequest): ServerReflectionResponse {
    return create(ServerReflectionResponseSchema, {
      $typeName: 'grpc.reflection.v1alpha.ServerReflectionResponse',
      validHost: request.host,
      originalRequest: request,
      messageResponse: {
        case: 'fileDescriptorResponse',
        value: create(FileDescriptorResponseSchema, {
          fileDescriptorProto: Array.from(registry)
            .filter(value => value.proto.$typeName === request.messageRequest.value)
            .map(value => toBinary(FileDescriptorProtoSchema, value.file.proto))
        })
      }
    });
  }

  private listServices(request: ServerReflectionRequest): ServerReflectionResponse {
    return create(ServerReflectionResponseSchema, {
      $typeName: 'grpc.reflection.v1alpha.ServerReflectionResponse',
      validHost: request.host,
      originalRequest: request,
      messageResponse: {
        case: 'listServicesResponse',
        value: create(ListServiceResponseSchema, {
          $typeName: 'grpc.reflection.v1alpha.ListServiceResponse',
          service: Array.from(registry).filter(value => value.kind === 'service').map(service =>
            create(ServiceResponseSchema, {
              $typeName: 'grpc.reflection.v1alpha.ServiceResponse',
              name: service.proto.$typeName
            })
          )
        })
      }
    });
  }
}
