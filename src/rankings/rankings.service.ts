import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as momentTimezone from 'moment-timezone';
import * as _ from 'lodash';

import { ClientProxySmartRanking } from 'src/proxyrmq/client-proxy';
import { Categoria } from './interfaces/cartegoria.interface';
import { Partida } from './interfaces/partida.interface';
import { Ranking } from './interfaces/ranking.schema';
import { EventoNome } from './evento-nome.enum';
import {
  RankingResponse,
  Historico,
} from './interfaces/ranking-response.interface';
import { Desafio } from './interfaces/desafio.interface';

@Injectable()
export class RankingsService {
  constructor(
    @InjectModel('Ranking') private readonly desafioModel: Model<Ranking>,
    private clientProxySmartRanking: ClientProxySmartRanking,
  ) {}

  private clientAdminBackend =
    this.clientProxySmartRanking.getClientProxyAdminBackendInstance();

  private clientDesafios =
    this.clientProxySmartRanking.getClientProxyDesafiosInstance();

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
              (evento) => (evento.nome = EventoNome.DERROTA),
            );

            ranking.evento = EventoNome.DERROTA;
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

  async consultarRankings(
    idCategoria: any,
    dataRef: string,
  ): Promise<RankingResponse[] | RankingResponse> {
    try {
      if (!dataRef) {
        dataRef = momentTimezone().tz('America/Sao_Paulo').format('YYYY-MM-DD');
        console.log('dataRef:', dataRef);
      }
      const registrosRanking = await this.desafioModel
        .find()
        .where('categoria')
        .equals(idCategoria)
        .exec();

      const desafios: Desafio[] = await this.clientDesafios
        .send('consultar-desafios-realizados', {
          idCategoria: idCategoria,
          dataRef: dataRef,
        })
        .toPromise();

      _.remove(registrosRanking, function (item) {
        return (
          desafios.filter((desafio) => desafio._id == item.desafio).length == 0
        );
      });

      const resultado = _(registrosRanking)
        .groupBy('jogador')
        .map((items, key) => ({
          jogador: key,
          historico: _.countBy(items, 'evento'),
          pontos: _.sumBy(items, 'pontos'),
        }))
        .value();

      const resultadoOrdenado = _.orderBy(resultado, 'pontos', 'desc');

      const rankingResponseList: RankingResponse[] = [];

      resultadoOrdenado.map(function (item, index) {
        const rankingResponse: RankingResponse = {};

        rankingResponse.jogador = item.jogador;
        rankingResponse.posicao = index + 1;
        rankingResponse.pontuacao = item.pontos;

        const historico: Historico = {};
        historico.vitorias = item.historico.VITORIA
          ? item.historico.VITORIA
          : 0;
        historico.derrotas = item.historico.DERROTA
          ? item.historico.DERROTA
          : 0;

        rankingResponse.historicoPartidas = historico;

        rankingResponseList.push(rankingResponse);
      });

      return rankingResponseList;
    } catch (e) {}
  }
}
