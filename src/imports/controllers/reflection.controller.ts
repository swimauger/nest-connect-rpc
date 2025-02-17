import { create, DescService } from '@bufbuild/protobuf';
import { Controller } from '@nestjs/common';

import {
  ListServiceResponseSchema,
  ServerReflection,
  ServerReflectionRequest,
  ServerReflectionResponse,
  ServerReflectionResponseSchema,
  ServiceResponseSchema
} from '#imports/protobufs/v1alpha/reflection_pb.js';
import { ConnectRpc } from '#imports/decorators/connect-rpc.js';

@Controller()
export class ReflectionController {
  public static readonly services: DescService[] = [];

  @ConnectRpc(ServerReflection)
  public async * serverReflectionInfo(
    requests: AsyncGenerator<ServerReflectionRequest>
  ): AsyncGenerator<ServerReflectionResponse> {
    for await (const request of requests) {
      switch (request.messageRequest.case) {
        case 'listServices': {
          yield this.listServices(request);
          break;
        }
      }
    }
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
          service: ReflectionController.services.map(service =>
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
