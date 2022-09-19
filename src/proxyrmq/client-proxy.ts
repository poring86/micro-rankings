import { Injectable } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClientProxySmartRanking {
  constructor(private configService: ConfigService) {}

  rmqUser = this.configService.get<string>('RMQ_USER');
  rmqPassword = this.configService.get<string>('RMQ_PASSWORD');
  rmqUrl = this.configService.get<string>('RMQ_URL');

  getClientProxyAdminBackendInstance(): ClientProxy {
    return ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${this.rmqUser}:${this.rmqPassword}@${this.rmqUrl}`],
        queue: 'admin-backend',
      },
    });
  }

  getClientProxyDesafiosInstance(): ClientProxy {
    return ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${this.rmqUser}:${this.rmqPassword}@${this.rmqUrl}`],
        queue: 'desafios',
      },
    });
  }

  getClientProxyRankingsInstance(): ClientProxy {
    return ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${this.rmqUser}:${this.rmqPassword}@${this.rmqUrl}`],
        queue: 'rankings',
      },
    });
  }
}
