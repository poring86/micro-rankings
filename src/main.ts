import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import * as momentTimezone from 'moment-timezone';

const configService = new ConfigService();

async function bootstrap() {
  const rmqUser = configService.get<string>('RMQ_USER');
  const rmqPassword = configService.get<string>('RMQ_PASSWORD');
  const rmqUrl = configService.get<string>('RMQ_URL');

  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://${rmqUser}:${rmqPassword}@${rmqUrl}`],
      noAck: false,
      queue: 'rankings',
    },
  });

  Date.prototype.toJSON = function () {
    return momentTimezone(this)
      .tz('America/Sao_Paulo')
      .format('YYYY-MM-DD HH:mm:ss.SSS');
  };

  await app.listen();
}
bootstrap();
