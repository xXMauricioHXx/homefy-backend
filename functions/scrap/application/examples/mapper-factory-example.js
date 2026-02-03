const { MapperFactory } = require("../factories/mapper-factory");

/**
 * Exemplo de uso do MapperFactory
 *
 * Este arquivo demonstra como o MapperFactory seleciona automaticamente
 * o mapper correto baseado na URL fornecida.
 */

// Cria uma instância do factory
const factory = new MapperFactory();

console.log("=== Testando MapperFactory ===\n");

// Lista todos os mappers disponíveis
console.log("Mappers disponíveis:", factory.listMappers());
console.log();

// Testa URL da Foxter
const foxterUrl = "https://foxterciaimobiliaria.com.br/imovel/219463";
try {
  const foxterMapper = factory.getMapper(foxterUrl);
  console.log(`✓ URL Foxter reconhecida: ${foxterUrl}`);
  console.log(`  Mapper selecionado: ${foxterMapper.constructor.name}\n`);
} catch (error) {
  console.error(`✗ Erro ao processar URL Foxter: ${error.message}\n`);
}

// Testa URL da Realiza
const realizaUrl =
  "https://www.imoveisrealiza.com/imovel/apartamento-a-venda-com-70m-no-bairro-centro-em-viamao/8224/";
try {
  const realizaMapper = factory.getMapper(realizaUrl);
  console.log(`✓ URL Realiza reconhecida: ${realizaUrl}`);
  console.log(`  Mapper selecionado: ${realizaMapper.constructor.name}\n`);
} catch (error) {
  console.error(`✗ Erro ao processar URL Realiza: ${error.message}\n`);
}

// Testa URL não suportada
const unsupportedUrl = "https://example.com/imovel/123";
try {
  const mapper = factory.getMapper(unsupportedUrl);
  console.log(`✓ URL reconhecida: ${unsupportedUrl}`);
  console.log(`  Mapper selecionado: ${mapper.constructor.name}\n`);
} catch (error) {
  console.error(`✗ URL não suportada: ${unsupportedUrl}`);
  console.error(`  Erro: ${error.message}\n`);
}

console.log("=== Fim dos testes ===");
