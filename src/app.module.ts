import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RankingsModule } from './rankings/rankings.module';
import { ProxyRMQModule } from './proxyrmq/proxyrmq.module';

@Module({
  imports: [
    RankingsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      'mongodb://localhost:27017/srranking?directConnection=true',
      {
        useUnifiedTopology: true,
      },
    ),
    ProxyRMQModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
