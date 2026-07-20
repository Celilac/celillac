# **PRD CeliLac — Parte 4** 

# **Jornadas, Modelo Conceitual, Backlog, Épicos e Próximos Artefatos** 

## **1. Objetivo desta Parte** 

Esta parte do PRD organiza as jornadas principais dos usuários, propõe um modelo conceitual inicial de dados, apresenta épicos e histórias de usuário e define recomendações para continuidade do projeto. 

O objetivo é transformar a visão funcional do CeliLac em uma base mais operacional, preparada para derivar protótipos, diagramas, backlog técnico e planejamento de MVP. 

## **2. Jornada do Consumidor** 

## **2.1 Cadastro e Configuração Inicial** 

1. O visitante acessa a plataforma. 

2. Cria uma conta informando nome, e-mail e senha. 

3. Acessa a área de configuração do perfil alimentar. 

4. Seleciona restrições, alergias, intolerâncias ou preferências alimentares. 

5. Salva o perfil. 

6. O sistema passa a usar esse perfil para personalizar buscas e alertas. 

Resultado esperado: 

O consumidor possui uma conta ativa e um perfil alimentar estruturado, permitindo uma experiência personalizada. 

## **2.2 Busca de Produtos Compatíveis** 

1. O consumidor acessa a área de busca. 

2. Informa termo textual ou seleciona filtros. 

3. O sistema considera o perfil alimentar do consumidor. 

4. Produtos compatíveis são destacados. 

5. Produtos com risco exibem alerta. 

6. Produtos incompatíveis são sinalizados ou ocultados, conforme regra definida. 

7. O consumidor seleciona um produto para visualizar detalhes. 

Resultado esperado: 

O consumidor encontra opções alinhadas ao seu perfil alimentar com menor esforço e maior segurança. 

1 

## **2.3 Análise de Detalhes do Produto** 

1. O consumidor abre a página de um produto. 

2. Visualiza nome, descrição, imagem, preço e parceiro. 

3. Visualiza ingredientes cadastrados. 

4. Visualiza classificações alimentares. 

5. Visualiza alerta de compatibilidade. 

6. Analisa avaliações e comentários. 

7. Decide favoritar, avaliar, denunciar ou comprar em fase futura. 

Resultado esperado: 

O consumidor consegue tomar decisão informada com base em dados alimentares claros. 

## **2.4 Denúncia de Informação Alimentar** 

1. O consumidor identifica possível inconsistência ou risco. 

2. Aciona a opção de denúncia no produto. 

3. Seleciona o motivo. 

4. Descreve o problema. 

5. Envia a denúncia. 

6. O sistema registra a denúncia e encaminha para análise administrativa. 

Resultado esperado: 

A plataforma recebe sinalização estruturada para investigar uma possível falha de confiabilidade. 

## **2.5 Pedido — Fase Futura** 

1. O consumidor seleciona um produto. 

2. Adiciona ao carrinho. 

3. Visualiza alertas alimentares antes da confirmação. 

4. Confirma o pedido. 

5. Realiza pagamento. 

6. Acompanha status. 

7. Consulta histórico posteriormente. 

Resultado esperado: 

O consumidor realiza uma compra preservando o registro das informações alimentares no momento da decisão. 

## **3. Jornada do Parceiro Comercial** 

## **3.1 Cadastro do Parceiro** 

1. O usuário cria conta ou acessa conta existente. 

2. Solicita cadastro como parceiro comercial. 

3. Informa tipo de parceiro. 

4. Preenche dados comerciais. 

2 

5. Informa localização ou área de atendimento. 

6. Envia cadastro. 

7. Aguarda aprovação ou liberação conforme política definida. 

Resultado esperado: 

O parceiro passa a ter um cadastro comercial vinculado à sua conta. 

## **3.2 Cadastro de Produto** 

1. O parceiro acessa o painel. 

2. Seleciona a opção de criar produto. 

3. Preenche nome, descrição, categoria, preço e imagens. 

4. Informa ingredientes. 

5. Informa classificações alimentares. 

6. Indica risco de contaminação cruzada. 

7. Salva o produto. 

8. O produto fica ativo, pendente ou incompleto. 

Resultado esperado: 

O produto é cadastrado de forma estruturada e pode ser encontrado por consumidores. 

## **3.3 Manutenção de Produtos** 

1. O parceiro acessa a lista de produtos. 

2. Identifica produtos ativos, inativos, pendentes ou incompletos. 

3. Edita informações quando necessário. 

4. Atualiza preço ou disponibilidade. 

5. Corrige informações alimentares. 

6. Envia para revisão, caso a alteração exija moderação. 

Resultado esperado: 

O parceiro mantém o catálogo atualizado e confiável. 

## **3.4 Resposta a Pendências e Denúncias** 

1. O parceiro recebe aviso sobre pendência ou denúncia. 

2. Acessa o produto relacionado. 

3. Revisa as informações cadastradas. 

4. Corrige dados ou apresenta justificativa. 

5. Aguarda análise administrativa. 

Resultado esperado: 

A plataforma permite correção de informações e melhoria contínua da confiança. 

3 

## **4. Jornada do Administrador** 

## **4.1 Aprovação de Parceiros** 

1. O administrador acessa o painel. 

2. Visualiza parceiros pendentes. 

3. Analisa dados comerciais. 

4. Aprova, reprova ou solicita ajuste. 

5. O sistema registra a decisão. 

Resultado esperado: 

A plataforma mantém controle sobre quem pode ofertar produtos. 

## **4.2 Moderação de Produtos** 

1. O administrador acessa produtos pendentes ou denunciados. 

2. Analisa informações alimentares. 

3. Verifica denúncias, histórico e dados do parceiro. 

4. Decide aprovar, suspender, solicitar ajuste ou remover. 

5. O sistema registra a ação administrativa. 

Resultado esperado: 

Produtos com risco ou informação inconsistente recebem tratamento adequado. 

## **4.3 Gestão de Dados Mestres** 

1. O administrador acessa cadastros auxiliares. 

2. Gerencia categorias de produtos. 

3. Gerencia restrições alimentares. 

4. Gerencia tipos de alergênicos. 

5. Evita duplicidades e inconsistências. 

Resultado esperado: 

O sistema preserva padronização das informações usadas na busca e na compatibilidade. 

## **4.4 Acompanhamento de Indicadores** 

1. O administrador acessa o dashboard. 

2. Visualiza métricas de usuários, parceiros e produtos. 

3. Analisa denúncias e pendências. 

4. Identifica gargalos de qualidade ou operação. 

5. Toma decisões de melhoria. 

Resultado esperado: 

A gestão da plataforma é orientada por dados. 

4 

## **5. Modelo Conceitual Inicial de Dados** 

## **5.1 Usuário** 

Representa qualquer pessoa com conta no sistema. 

Campos sugeridos: 

- id 

- nome 

- email 

- senha_hash 

- telefone 

- tipo_usuario 

- status 

- criado_em 

- atualizado_em 

Relacionamentos: 

- Pode possuir um perfil alimentar. 

- Pode ser responsável por um ou mais parceiros. 

- Pode realizar avaliações. 

- Pode registrar denúncias. 

- Pode realizar pedidos em fase futura. 

## **5.2 Perfil Alimentar** 

Representa o conjunto de restrições e preferências de um consumidor. 

Campos sugeridos: 

- id 

- usuario_id 

- observacoes 

- criado_em 

- atualizado_em 

Relacionamentos: 

- Pertence a um usuário. 

- Possui várias restrições associadas. 

## **5.3 Restrição Alimentar** 

Representa uma restrição, alergia, intolerância ou preferência alimentar padronizada. 

Campos sugeridos: 

- id 

5 

- nome 

- descricao 

- tipo 

- nivel_risco_padrao 

- ativo 

Exemplos de tipo: 

- alergia 

- intolerancia 

- restricao_medica 

- preferencia 

- estilo_de_vida 

## **5.4 PerfilRestricao** 

Tabela associativa entre perfil alimentar e restrições. 

Campos sugeridos: 

- id 

- perfil_alimentar_id 

- restricao_alimentar_id 

- severidade 

- observacao 

- criado_em 

## **5.5 Parceiro** 

Representa estabelecimento, comércio alimentar ou produtor independente. 

Campos sugeridos: 

- id 

- usuario_responsavel_id 

- nome_comercial 

- tipo_parceiro 

- descricao 

- documento 

- telefone 

- email_comercial 

- status_aprovacao 

- criado_em 

- atualizado_em 

Tipos possíveis: 

- estabelecimento 

- comercio_alimentar 

- produtor_independente 

6 

## **5.6 Endereço** 

Representa a localização do parceiro. 

Campos sugeridos: 

- id • parceiro_id • logradouro 

- numero • complemento • bairro • cidade • estado • cep • latitude • longitude 

## **5.7 Categoria de Produto** 

Representa categorias usadas para organizar produtos. 

Campos sugeridos: 

- id • nome • descricao • ativo 

Exemplos: 

- pães • bolos • refeições • bebidas • congelados • massas • doces • produtos industrializados 

## **5.8 Produto** 

Representa um item alimentar ofertado por um parceiro. 

Campos sugeridos: 

- id 

- parceiro_id 

- categoria_id 

- nome 

7 

- descricao 

- preco 

- imagem_url 

- status 

- disponibilidade 

- criado_em 

- atualizado_em 

Status possíveis: 

- ativo 

- inativo 

- pendente 

- incompleto 

- suspenso 

## **5.9 Ingrediente** 

Representa ingrediente padronizado. 

Campos sugeridos: 

- id 

- nome 

- descricao 

- potencial_alergenico 

- ativo 

## **5.10 ProdutoIngrediente** 

Tabela associativa entre produto e ingrediente. 

Campos sugeridos: 

- id 

- produto_id • ingrediente_id 

- observacao 

## **5.11 ProdutoClassificacaoAlimentar** 

Representa a relação entre produto e restrição alimentar. 

Campos sugeridos: 

- id 

- produto_id 

- restricao_alimentar_id 

- status_classificacao 

- risco_contaminacao_cruzada 

8 

- fonte_informacao 

- observacao 

- atualizado_em 

Status de classificação: 

- contem 

- nao_contem 

- pode_conter 

- nao_informado 

## **5.12 Avaliação** 

Representa avaliação feita por consumidor. 

Campos sugeridos: 

- id • usuario_id • produto_id • parceiro_id • nota 

- comentario 

- tipo_avaliacao • status • criado_em 

## **5.13 Denúncia** 

Representa denúncia feita por usuário. 

Campos sugeridos: 

- id 

- usuario_id • produto_id • parceiro_id • motivo • descricao • prioridade • status • decisao_admin • criado_em 

- resolvido_em 

Status possíveis: 

- pendente • em_analise • procedente 

- improcedente 

9 

- resolvida 

## **5.14 Pedido — Fase Futura** 

Representa compra realizada pelo consumidor. 

Campos sugeridos: 

- id 

- consumidor_id 

- parceiro_id 

- status 

- valor_total 

- observacoes 

- criado_em 

- atualizado_em 

## **5.15 ItemPedido — Fase Futura** 

Representa item dentro de um pedido. 

Campos sugeridos: 

- id 

- pedido_id • produto_id 

- nome_produto_snapshot • preco_unitario • quantidade • classificacao_alimentar_snapshot 

## **5.16 Pagamento — Fase Futura** 

Representa transação financeira associada ao pedido. 

Campos sugeridos: 

- id 

- pedido_id 

- provedor 

- metodo 

- status 

- valor 

- identificador_externo 

- criado_em 

- atualizado_em 

10 

## **6. Épicos do Produto** 

## **Épico 1 — Identidade e Acesso** 

Como usuário da plataforma, quero criar conta e acessar recursos conforme meu papel, para utilizar o CeliLac de forma segura e personalizada. 

Abrange: 

- Cadastro. • Login. • Permissões. 

- Papéis. 

- Recuperação de senha. 

## **Épico 2 — Perfil Alimentar** 

Como consumidor, quero registrar minhas restrições alimentares, para receber resultados e alertas compatíveis com minhas necessidades. 

Abrange: 

- Restrições. • Alergias. • Intolerâncias. 

- Preferências. 

- Severidade. 

## **Épico 3 — Gestão de Parceiros** 

Como parceiro comercial, quero cadastrar e gerenciar meu negócio, para disponibilizar produtos especializados na plataforma. 

Abrange: 

- Cadastro comercial. • Tipo de parceiro. • Endereço. • Aprovação. • Página pública. 

## **Épico 4 — Catálogo de Produtos** 

Como parceiro, quero cadastrar produtos com informações detalhadas, para que consumidores possam encontrá-los e avaliá-los corretamente. 

Abrange: 

- Produto. 

11 

- Categoria. 

- Imagem. 

- Preço. 

- Disponibilidade. 

- Status. 

## **Épico 5 — Ingredientes e Classificação Alimentar** 

Como consumidor, quero visualizar ingredientes, restrições e riscos alimentares, para tomar decisões com segurança. 

Abrange: 

- Ingredientes. 

- Restrições. 

- Alergênicos. 

- Contaminação cruzada. 

- Status “contém”, “não contém”, “pode conter” e “não informado”. 

## **Épico 6 — Compatibilidade Alimentar** 

Como consumidor, quero saber se um produto é compatível com meu perfil, para evitar produtos inadequados. 

Abrange: 

- Cálculo de compatibilidade. 

- Alertas. 

- Status de risco. 

- Resultado indeterminado. 

## **Épico 7 — Busca Especializada** 

Como consumidor, quero buscar produtos e parceiros usando múltiplos filtros alimentares, para encontrar opções adequadas rapidamente. 

Abrange: 

- Busca textual. 

- Filtros. 

- Ordenação. 

- Paginação. 

- Priorização por perfil alimentar. 

## **Épico 8 — Avaliações e Reputação** 

Como consumidor, quero avaliar produtos e parceiros, para contribuir com a confiança da plataforma. 

12 

Abrange: 

- Avaliação de produto. 

- Avaliação de parceiro. 

- Comentários. 

- Média de notas. 

- Moderação de avaliações. 

## **Épico 9 — Denúncias e Moderação** 

Como consumidor, quero denunciar informações incorretas, e como administrador, quero analisá-las, para preservar a confiabilidade do ecossistema. 

### Abrange: 

- Denúncias. 

- Priorização. 

- Análise administrativa. 

- Suspensão de produtos. 

- Registro de decisão. 

## **Épico 10 — Pedidos e Pagamentos — Fase Futura** 

Como consumidor, quero comprar produtos pela plataforma, para concluir minha jornada dentro do CeliLac. 

Abrange: 

- Carrinho. 

- Pedido. 

- Status. 

- Pagamento. 

- Histórico. 

## **7. Histórias de Usuário Iniciais** 

## **HU01 — Criar Conta** 

Como visitante, quero criar uma conta, para acessar recursos personalizados da plataforma. 

Critérios de aceite: 

- Deve ser possível informar nome, e-mail e senha. 

- O sistema deve validar campos obrigatórios. 

- O sistema deve impedir e-mail duplicado. 

- A conta deve ser criada com sucesso. 

13 

## **HU02 — Realizar Login** 

Como usuário cadastrado, quero realizar login, para acessar minha conta. 

Critérios de aceite: 

- Deve ser possível informar e-mail e senha. 

- Credenciais válidas devem permitir acesso. 

- Credenciais inválidas devem exibir erro. 

- O usuário deve ser direcionado conforme seu papel. 

## **HU03 — Configurar Perfil Alimentar** 

Como consumidor, quero selecionar minhas restrições alimentares, para receber alertas personalizados. 

Critérios de aceite: 

- Deve ser possível selecionar múltiplas restrições. 

- Deve ser possível salvar o perfil. 

- Deve ser possível editar posteriormente. 

- O perfil deve impactar a busca. 

## **HU04 — Cadastrar Parceiro** 

Como parceiro comercial, quero cadastrar meu negócio, para disponibilizar produtos na plataforma. 

Critérios de aceite: 

- Deve ser possível informar dados básicos. 

- Deve ser possível informar tipo de parceiro. 

- O cadastro deve ser salvo com status. 

- O administrador deve conseguir visualizar o cadastro. 

## **HU05 — Aprovar Parceiro** 

Como administrador, quero aprovar parceiros, para controlar quem pode publicar produtos. 

Critérios de aceite: 

- Deve ser possível listar parceiros pendentes. 

- Deve ser possível aprovar ou reprovar. 

- A decisão deve alterar o status do parceiro. 

- A decisão deve ser registrada. 

## **HU06 — Cadastrar Produto** 

Como parceiro, quero cadastrar um produto, para que consumidores possam encontrá-lo. 

14 

Critérios de aceite: 

- O produto deve ter nome, descrição, categoria e preço. 

- O produto deve estar vinculado ao parceiro. 

- O produto deve permitir ingredientes. 

- O produto deve permitir classificação alimentar. 

## **HU07 — Informar Ingredientes** 

Como parceiro, quero informar os ingredientes do produto, para dar transparência ao consumidor. 

### Critérios de aceite: 

- Deve ser possível associar múltiplos ingredientes. 

- Ingredientes devem aparecer no detalhe do produto. 

- Ingredientes críticos devem ser destacados. 

## **HU08 — Informar Classificação Alimentar** 

Como parceiro, quero classificar o produto conforme restrições alimentares, para orientar consumidores. 

### Critérios de aceite: 

- Deve ser possível informar se o produto contém, não contém, pode conter ou não informa determinada restrição. 

- Deve ser possível indicar risco de contaminação cruzada. 

- As informações devem aparecer na tela do produto. 

## **HU09 — Buscar Produto por Restrição** 

Como consumidor, quero buscar produtos por restrição alimentar, para encontrar opções adequadas. 

### Critérios de aceite: 

- Deve ser possível selecionar uma ou mais restrições. 

- A busca deve retornar produtos compatíveis ou relacionados. 

- Produtos com risco devem exibir alerta. 

- Resultados devem ser paginados. 

## **HU10 — Visualizar Compatibilidade** 

Como consumidor, quero ver se um produto é compatível com meu perfil, para decidir com mais segurança. 

Critérios de aceite: 

- O sistema deve comparar produto e perfil alimentar. 

- O resultado deve indicar compatível, atenção, incompatível ou indeterminado. 

- O alerta deve ser claro. 

15 

- O motivo deve ser exibido quando possível. 

## **HU11 — Denunciar Informação Alimentar** 

Como consumidor, quero denunciar informação alimentar incorreta, para ajudar a manter a plataforma confiável. 

### Critérios de aceite: 

- Deve ser possível selecionar motivo. 

- Deve ser possível descrever o problema. 

- A denúncia deve chegar ao painel administrativo. 

- A denúncia deve possuir status. 

## **HU12 — Analisar Denúncia** 

Como administrador, quero analisar denúncias, para corrigir ou remover informações problemáticas. 

Critérios de aceite: 

- Deve ser possível listar denúncias pendentes. 

- Deve ser possível alterar status. 

- Deve ser possível registrar decisão. 

- Deve ser possível suspender produto, se necessário. 

## **HU13 — Avaliar Produto** 

Como consumidor, quero avaliar um produto, para compartilhar minha experiência. 

### Critérios de aceite: 

- Deve ser possível atribuir nota. 

- Deve ser possível inserir comentário. 

- A avaliação deve aparecer no produto. 

- A média deve ser recalculada. 

## **HU14 — Favoritar Produto** 

Como consumidor, quero favoritar produtos, para encontrá-los facilmente depois. 

### Critérios de aceite: 

- Deve ser possível favoritar. 

- Deve ser possível remover dos favoritos. 

- Favoritos devem aparecer em uma lista própria. 

16 

## **8. Critérios Gerais de Aceite do MVP** 

O MVP será considerado funcional quando: 

- Consumidores conseguirem criar conta. 

- Consumidores conseguirem configurar perfil alimentar. 

- Parceiros conseguirem cadastrar negócio. 

- Parceiros conseguirem cadastrar produtos. 

- Produtos conseguirem registrar ingredientes. 

- Produtos conseguirem registrar classificações alimentares. 

- A busca permitir filtros por restrições alimentares. 

- O sistema indicar compatibilidade, atenção, incompatibilidade ou indeterminação. 

- Produtos exibirem alertas alimentares claros. 

- Administradores conseguirem visualizar e moderar cadastros básicos. 

- Consumidores conseguirem avaliar ou denunciar produtos. 

## **9. Roadmap Sugerido** 

## **Fase 1 — Núcleo Alimentar** 

Entregas: 

- Usuários. 

- Perfil alimentar. • Restrições. 

- Parceiros. 

- Produtos. 

- Ingredientes. 

- Classificação alimentar. 

- Compatibilidade. 

- Busca básica. 

Objetivo: 

Validar a proposta central do CeliLac. 

## **Fase 2 — Confiança e Governança** 

Entregas: 

- Avaliações. 

- Denúncias. 

- Moderação. 

- Aprovação de parceiros. 

- Produtos pendentes. 

- Dashboard administrativo básico. 

Objetivo: 

Aumentar confiabilidade da informação alimentar. 

17 

## **Fase 3 — Experiência Comercial** 

Entregas: 

- Favoritos. 

- Páginas públicas aprimoradas. 

- Disponibilidade de produtos. 

- Indicadores para parceiros. 

- Melhorias de busca e filtros. 

Objetivo: 

Melhorar experiência e engajamento sem ainda exigir transação completa. 

## **Fase 4 — Pedidos e Pagamentos** 

Entregas: 

- Carrinho. • Criação de pedidos. • Status de pedido. 

- Pagamento. 

- Histórico. 

Objetivo: 

Transformar o CeliLac em marketplace transacional. 

## **Fase 5 — Escala, Inteligência e Auditoria** 

Entregas: 

- Recomendações. • Selos de confiança. • Auditoria avançada. 

- Relatórios. • Notificações. 

- Busca avançada. 

Objetivo: 

Ampliar diferenciação competitiva e maturidade operacional. 

## **10. Riscos e Mitigações** 

## **10.1 Informação Alimentar Incorreta** 

Risco: 

18 

Parceiros podem cadastrar informações incompletas ou incorretas. 

Mitigações: 

- Campos estruturados. 

- Validações obrigatórias. 

- Moderação. 

- Denúncias. 

- Histórico de alterações. 

- Selos de confiança futuros. 

## **10.2 Complexidade para Parceiros** 

Risco: 

Parceiros podem achar difícil cadastrar informações alimentares detalhadas. 

Mitigações: 

- Formulários guiados. 

- Exemplos de preenchimento. 

- Cadastro progressivo. 

- Indicadores de completude. 

- Sugestões automáticas futuras. 

## **10.3 Busca Ineficiente** 

Risco: 

A combinação de múltiplas restrições pode tornar a busca lenta ou confusa. 

Mitigações: 

- Modelagem adequada. 

- Índices no banco. 

- Paginação. 

- Filtros bem definidos. 

- Motor de busca especializado em fase futura. 

## **10.4 Responsabilidade Jurídica** 

Risco: 

Informações incorretas podem gerar responsabilidade para a plataforma. 

Mitigações: 

- Termos de uso claros. 

- Registro da origem da informação. 

19 

- Declaração de responsabilidade do parceiro. 

- Moderação. 

- Denúncias. 

- Auditoria. 

## **10.5 Baixa Adoção Inicial** 

Risco: 

Consumidores ou parceiros podem não aderir à plataforma no início. 

Mitigações: 

- Foco geográfico inicial. 

- Parcerias locais. 

- MVP com proposta clara. 

- Validação com públicos específicos. 

- Conteúdo educativo sobre segurança alimentar. 

## **11. Perguntas em Aberto** 

- O MVP será apenas catálogo especializado ou já incluirá pedidos? 

- A plataforma iniciará em uma cidade específica? 

- Parceiros precisarão de aprovação antes de publicar produtos? 

- Haverá verificação documental dos parceiros? 

- Como será tratada a responsabilidade pelas informações alimentares declaradas? 

- Produtos artesanais terão regras diferentes de produtos industrializados? 

- O consumidor poderá configurar tolerância para produtos “pode conter”? 

- Produtos incompatíveis serão ocultados ou exibidos com alerta? 

- Haverá integração com pagamento no MVP? 

- Haverá entrega, retirada ou apenas contato com o parceiro na primeira versão? 

## **12. Artefatos Recomendados na Continuidade** 

A partir deste PRD, recomenda-se produzir os seguintes artefatos: 

## **12.1 Artefatos de Produto** 

- Backlog priorizado. 

- Mapa de jornadas. 

- Matriz de personas. 

- Protótipos de baixa fidelidade. 

- Protótipos navegáveis. 

- Definição do MVP. 

- Métricas de validação. 

## **12.2 Artefatos de Arquitetura** 

- Diagrama de contexto. 

- Diagrama de containers. 

20 

- Diagrama de componentes. 

- Modelo de domínio. 

- Diagrama de entidades. 

- Diagrama de casos de uso. 

- Diagrama de sequência dos fluxos críticos. 

## **12.3 Artefatos Técnicos** 

- Definição da stack. 

- Estrutura inicial de repositórios. 

- Padrão de camadas. 

- Contratos de API. 

- Modelo inicial de banco de dados. 

- Estratégia de autenticação. 

- Estratégia de testes. 

## **12.4 Artefatos de Governança** 

- Política de moderação. 

- Termos de uso. 

- Política de privacidade. 

- Política de responsabilidade sobre informações alimentares. 

- Fluxo de denúncia e revisão. 

- Critérios para aprovação de parceiros. 

## **13. Síntese Final do PRD** 

O CeliLac deve ser desenvolvido como uma plataforma alimentar especializada, orientada por dados estruturados e confiança. Seu diferencial central está na capacidade de relacionar perfis alimentares de consumidores com produtos classificados por ingredientes, restrições, riscos e compatibilidade. 

A primeira versão deve evitar excesso de funcionalidades transacionais e priorizar o domínio que torna o produto único: restrições alimentares, ingredientes, classificação, busca especializada e alertas de compatibilidade. 

Pedidos, pagamentos e recursos avançados devem ser tratados como evolução natural, após validação do núcleo alimentar e da confiança entre consumidores e parceiros. 

Com essa estrutura, o CeliLac pode ser usado tanto como proposta real de produto quanto como estudo de caso robusto para arquitetura de software, modelagem de domínio, sistemas corporativos, desenvolvimento em camadas e evolução incremental de plataformas digitais. 

21 

