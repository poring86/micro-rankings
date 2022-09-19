import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Partida } from './interfaces/partida.interface';
import { Ranking } from './interfaces/ranking.schema';

@Injectable()
export class RankingsService {
  constructor(
    @InjectModel('Ranking') private readonly desafioModel: Model<Ranking>,
  ) {}

  async processarPartida(idPartida: string, partida: Partida): Promise<void> {
    try {
      await Promise.all(
        partida.jogadores.map(async (jogador) => {
          const ranking = new this.desafioModel();

          ranking.categoria = partida.categoria;
          ranking.desafio = partida.desafio;
          ranking.partida = idPartida;
          ranking.jogador = jogador;

          if (jogador === partida.def) {
            ranking.evento = 'VITORIA';
            ranking.pontos = 30;
            ranking.operacao = '+';
          } else {
            ranking.evento = 'DERROTA';
            ranking.pontos = 0;
            ranking.operacao = '+';
          }

          console.log('ranking:', JSON.stringify(ranking));
          await ranking.save();
        }),
      );
    } catch (e) {
      throw new RpcException(e.message);
    }
  }
}
