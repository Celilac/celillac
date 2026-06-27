# ARCHITECTURE.md - Clean Architecture no CeLiLac

## Camadas do Sistema

1. **Domain (Núcleo):** Contém Entidades, Value Objects e Regras de Negócio Puras. Não tem dependências externas.
2. **Application (Casos de Uso):** Orquestra o fluxo de dados. Depende apenas do Domínio.
3. **Infrastructure:** Implementações técnicas (PostgreSQL, Express, Bibliotecas externas).
4. **Interfaces/Adapters:** Converte dados entre o formato externo e o formato interno.

## Regra de Ocupação (Dependency Rule)
As dependências devem sempre apontar para o **centro** (Domínio). 
- Um Caso de Uso pode usar uma Entidade.
- Um Repositório na Infraestrutura pode implementar uma Interface definida no Domínio.
- **Proibido:** O Domínio nunca deve importar nada da Infraestrutura ou da Interface.
