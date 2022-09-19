import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientProxySmartRanking } from 'src/proxyrmq/client-proxy';
import { Categoria } from './interfaces/cartegoria.interface';
import { Partida } from './interfaces/partida.interface';
import { Ranking } from './interfaces/ranking.schema';
import { EventoNome } from './evento-nome.enum';

@Injectable()
export class RankingsService {
  constructor(
    @InjectModel('Ranking') private readonly desafioModel: Model<Ranking>,
    private clientProxySmartRanking: ClientProxySmartRanking,
  ) {}

  private clientAdminBackend =
    this.clientProxySmartRanking.getClientProxyAdminBackendInstance();

  async processarPartida(idPartida: string, partida: Partida): Promise<void> {
    try {
      const categoria: Categoria = await this.clientAdminBackend
        .send('consultar-categorias', partida.categoria)
        .toPromise();

      await Promise.all(
        partida.jogadores.map(async (jogador) => {
          const ranking = new this.desafioModel();

          ranking.categoria = partida.categoria;
          ranking.desafio = partida.desafio;
          ranking.partida = idPartida;
          ranking.jogador = jogador;

          if (jogador === partida.def) {
            const eventoFilter = categoria.eventos.find(
              (evento) => (evento.nome = EventoNome.VITORIA),
            );
            ranking.evento = EventoNome.VITORIA;
            ranking.operacao = eventoFilter.operacao;
            ranking.pontos = eventoFilter.valor;
          } else {
            const eventoFilter = categoria.eventos.find(
              (evento) => (evento.nome = EventoNome.VITORIA),
            );

            ranking.evento = EventoNome.VITORIA;
            ranking.operacao = eventoFilter.operacao;
            ranking.pontos = eventoFilter.valor;
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
