import type { DescService } from '@bufbuild/protobuf';
import type { ConnectRouter } from '@connectrpc/connect';
import { fastifyConnectPlugin } from '@connectrpc/connect-fastify';
import { DynamicModule, Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService, HttpAdapterHost, MetadataScanner, Reflector } from '@nestjs/core';
import type { FastifyAdapter } from '@nestjs/platform-fastify';

import { ReflectionController } from '#imports/controllers/reflection.controller.js';
import { ConnectRpc } from '#imports/decorators/connect-rpc.js';

@Module({
  controllers: [ ReflectionController ]
})
export class ConnectRpcModule implements OnApplicationBootstrap {
  public static forRoot(): DynamicModule {
    return {
      imports: [ HttpAdapterHost ],
      module: ConnectRpcModule,
      providers: [ DiscoveryService, MetadataScanner, Reflector ]
    };
  }

  private readonly logger = new Logger(ConnectRpcModule.name);

  public constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly httpAdapterHost: HttpAdapterHost<FastifyAdapter>,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector
  ) {}

  public async onApplicationBootstrap() {
    this.httpAdapterHost.httpAdapter.getInstance().removeContentTypeParser('application/json');
    await this.httpAdapterHost.httpAdapter
      .getInstance()
      .register(fastifyConnectPlugin, {
        routes: async (router: ConnectRouter) => {
          for (const [ service, implementation ] of this.getRpcServices()) {
            await router.service(service, implementation);
            ReflectionController.services.push(service);
          }
        }
      });
  }

  private getRpcServices() {
    const services = new Map<DescService, Record<string, any>>();
    for (const controller of this.discoveryService.getControllers()) {
      const controllerPrototype = Object.getPrototypeOf(controller.instance);
      for (const methodName of this.metadataScanner.getAllMethodNames(controllerPrototype)) {
        const service = this.reflector.get(ConnectRpc, controllerPrototype[methodName]);
        if (!service) continue;
        if (services.has(service)) {
          services.get(service)![methodName] = controller.instance[methodName].bind(controller.instance);
        } else {
          services.set(service, { [methodName]: controller.instance[methodName].bind(controller.instance) });
        }
      }
    }
    return services;
  }
}
