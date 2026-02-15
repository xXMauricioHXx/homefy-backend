const {
  AuxiliadoraPredialMapper,
} = require("../mappers/auxiliadora-predial-mapper");
const { BridgeImoveisMapper } = require("../mappers/bridge-imoveis-mapper");
const { ColnaghiMapper } = require("../mappers/colnaghi-mapper");
const { CreditoRealMapper } = require("../mappers/credito-real-mapper");
const { FoxterMapper } = require("../mappers/foxter-mapper");
const { MultimobMapper } = require("../mappers/multimob-mapper");
const { RealizaMapper } = require("../mappers/realiza-mapper");

class MapperFactory {
  constructor() {
    this.mappers = [
      {
        pattern: /foxterciaimobiliaria\.com\.br/i,
        mapper: new FoxterMapper(),
        name: "Foxter",
      },
      {
        pattern: /imoveisrealiza\.com/i,
        mapper: new RealizaMapper(),
        name: "Realiza",
      },
      {
        pattern: /auxiliadorapredial\.com\.br/i,
        mapper: new AuxiliadoraPredialMapper(),
        name: "Auxiliadora Predial",
      },
      {
        pattern: /creditoreal\.com\.br/i,
        mapper: new CreditoRealMapper(),
        name: "Credito Real",
      },
      {
        pattern: /bridgeimoveis\.com\.br/i,
        mapper: new BridgeImoveisMapper(),
        name: "Bridge Imóveis",
      },
      {
        pattern: /multiimob\.com\.br/i,
        mapper: new MultimobMapper(),
        name: "Multi imob",
      },
      {
        pattern: /colnaghi\.com\.br/i,
        mapper: new ColnaghiMapper(),
        name: "Colnaghi",
      },
    ];
  }

  /**
   * Retorna o mapper apropriado baseado na URL fornecida
   * @param {string} url - URL do imóvel
   * @returns {Object} Mapper correspondente
   * @throws {Error} Se nenhum mapper for encontrado para a URL
   */
  getMapper(url) {
    if (!url || typeof url !== "string") {
      throw new Error("URL inválida fornecida ao MapperFactory");
    }

    for (const { pattern, mapper, name } of this.mappers) {
      if (pattern.test(url)) {
        console.log(`[INFO] - Mapper selecionado: ${name}`);
        return mapper;
      }
    }

    throw new Error(
      `Nenhum mapper encontrado para a URL: ${url}. ` +
        `Mappers disponíveis: ${this.mappers.map((m) => m.name).join(", ")}`,
    );
  }

  /**
   * Registra um novo mapper
   * @param {RegExp} pattern - Padrão regex para identificar a URL
   * @param {Object} mapper - Instância do mapper
   * @param {string} name - Nome do mapper
   */
  registerMapper(pattern, mapper, name) {
    if (!(pattern instanceof RegExp)) {
      throw new Error("O padrão deve ser uma expressão regular");
    }

    if (!mapper || typeof mapper.map !== "function") {
      throw new Error("O mapper deve ter um método 'map'");
    }

    this.mappers.push({ pattern, mapper, name });
    console.log(`[INFO] - Novo mapper registrado: ${name}`);
  }

  /**
   * Lista todos os mappers disponíveis
   * @returns {Array<string>} Lista com os nomes dos mappers
   */
  listMappers() {
    return this.mappers.map((m) => m.name);
  }
}

module.exports = {
  MapperFactory,
};
