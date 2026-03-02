import { PropertyMapper } from "../mappers/PropertyMapper";
import { FoxterMapper } from "../mappers/FoxterMapper";
import { RealizaMapper } from "../mappers/RealizaMapper";
import { AuxiliadoraPredialMapper } from "../mappers/AuxiliadoraPredialMapper";
import { CreditoRealMapper } from "../mappers/CreditoRealMapper";
import { BridgeImoveisMapper } from "../mappers/BridgeImoveisMapper";
import { MultimobMapper } from "../mappers/MultimobMapper";
import { ColnaghiMapper } from "../mappers/ColnaghiMapper";

interface MapperEntry {
  pattern: RegExp;
  mapper: PropertyMapper;
  name: string;
}

export class PropertyFactory {
  private readonly mappers: MapperEntry[];

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

  getMapper(url: string): PropertyMapper {
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

  listMappers(): string[] {
    return this.mappers.map((m) => m.name);
  }
}
