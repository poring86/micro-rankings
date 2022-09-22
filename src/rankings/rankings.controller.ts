import { Controller } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { Partida } from './interfaces/partida.interface';
import { RankingResponse } from './interfaces/ranking-response.interface';
import { RankingsService } from './rankings.service';

const ackErros: string[] = ['E11000'];
@Controller()
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @EventPattern('processar-partida')
  async processarPartida(@Payload() data, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const idPartida: string = data.idPartida;
      const partida: Partida = data.partida;

      await this.rankingsService.processarPartida(idPartida, partida);
      await channel.ack(originalMsg);
    } catch (e) {
      const filterAckError = ackErros.filter((ackError) =>
        e.message.includes(ackError),
      );

      if (filterAckError.length > 0) {
        await channel.ack(originalMsg);
      }
    }
  }

  @MessagePattern('consultar-rankings')
  async consultarRankings(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ): Promise<RankingResponse | RankingResponse[]> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const { idCategoria, dataRef } = data;

      return await this.rankingsService.consultarRankings(idCategoria, dataRef);
    } finally {
      await channel.ack(originalMsg);
    }
  }
}
