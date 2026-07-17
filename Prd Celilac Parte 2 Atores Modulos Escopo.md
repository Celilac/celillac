# **PRD CeliLac — Parte 2** 

# **Atores, Papéis, Escopo e Módulos Funcionais** 

## **1. Objetivo desta Parte** 

Esta parte do PRD detalha os participantes do ecossistema CeliLac, seus papéis, suas permissões principais e os módulos funcionais necessários para sustentar a proposta da plataforma. 

O objetivo é organizar a visão funcional do produto antes do detalhamento dos requisitos. A partir daqui, o CeliLac passa a ser compreendido como um sistema composto por módulos com responsabilidades específicas, integrados para oferecer uma experiência segura e especializada em alimentação restritiva. 

## **2. Atores do Sistema** 

## **2.1 Consumidor** 

O consumidor é o usuário final que busca alimentos compatíveis com suas restrições, alergias, intolerâncias, preferências ou necessidades alimentares. 

### Principais necessidades: 

- Encontrar produtos adequados ao seu perfil alimentar. 

- Reduzir o risco de consumir alimentos incompatíveis. 

- Visualizar informações claras sobre ingredientes e riscos. 

- Comparar estabelecimentos e produtos. 

- Avaliar experiências de consumo. 

- Denunciar informações incorretas ou potencialmente perigosas. 

### Permissões principais: 

- Criar conta. 

- Editar dados pessoais. 

- Criar e editar perfil alimentar. 

- Buscar produtos e parceiros. 

- Visualizar detalhes de produtos. 

- Favoritar produtos ou parceiros. 

- Avaliar produtos e estabelecimentos. 

- Denunciar informações alimentares incorretas. 

- Criar pedidos em fase futura. 

- Consultar histórico de pedidos em fase futura. 

## **2.2 Parceiro Comercial** 

O parceiro comercial representa estabelecimentos, comércios alimentares ou produtores independentes que desejam ofertar produtos na plataforma. 

1 

Esse ator pode assumir diferentes formatos: 

- Restaurante. • Lanchonete. 

- Pizzaria. • Padaria. 

- Cafeteria. 

- Hamburgueria. 

- Mercado. 

- Mercearia. 

- Empório. 

- Loja especializada. 

- Produtor artesanal. 

- Cozinha independente. 

### Principais necessidades: 

- Divulgar produtos especializados. 

- Cadastrar informações alimentares de forma orientada. 

- Alcançar consumidores com necessidades específicas. 

- Gerenciar produtos, preços e disponibilidade. 

- Receber avaliações. 

- Responder ou corrigir informações quando houver denúncia. 

- Gerenciar pedidos em fase futura. 

Permissões principais: 

- Criar cadastro comercial. 

- Editar dados do negócio. 

- Cadastrar produtos. 

- Editar produtos. 

- Informar ingredientes. 

- Informar classificações alimentares. 

- Informar risco de contaminação cruzada. 

- Visualizar avaliações. 

- Visualizar denúncias relacionadas aos próprios produtos, quando permitido. 

- Gerenciar pedidos em fase futura. 

## **2.3 Administrador** 

O administrador é o usuário responsável pela governança da plataforma. 

### Principais necessidades: 

- Manter a qualidade das informações alimentares. 

- Gerenciar cadastros de usuários e parceiros. 

- Revisar produtos e denúncias. 

- Moderar conteúdos inadequados. 

- Organizar categorias, restrições e classificações. 

- Monitorar indicadores de operação e confiança. 

2 

Permissões principais: 

- Acessar painel administrativo. 

- Visualizar usuários cadastrados. 

- Visualizar parceiros cadastrados. 

- Aprovar ou reprovar parceiros. 

- Revisar produtos pendentes. 

- Suspender produtos ou parceiros. 

- Gerenciar denúncias. 

- Gerenciar categorias de produtos. 

- Gerenciar tipos de restrição alimentar. 

- Visualizar indicadores operacionais. 

## **2.4 Visitante** 

O visitante é uma pessoa que acessa a plataforma sem estar autenticada. 

### Principais necessidades: 

- Conhecer a proposta da plataforma. 

- Visualizar produtos ou parceiros públicos, se permitido. 

- Criar conta. 

- Entender os benefícios de configurar um perfil alimentar. 

Permissões possíveis: 

- Visualizar página inicial. 

- Realizar busca limitada, se permitido. 

- Visualizar detalhes públicos de parceiros. 

- Criar conta. 

- Acessar login. 

## **3. Tipos de Parceiros** 

## **3.1 Estabelecimento Alimentício** 

Negócio que prepara e comercializa alimentos prontos ou sob demanda. 

Exemplos: 

- Restaurante sem glúten. 

- Lanchonete com opções sem lactose. 

- Pizzaria com massa sem glúten. 

- Padaria com produtos para celíacos. 

- Cafeteria com opções veganas. 

Características: 

- Pode ter cardápio próprio. 

- Pode trabalhar com retirada, entrega ou consumo local. 

3 

- Pode ter riscos específicos de contaminação cruzada na cozinha. 

- Pode precisar informar processos de preparo. 

## **3.2 Comércio Alimentar** 

Negócio que vende produtos alimentares, normalmente industrializados, embalados ou de terceiros. 

Exemplos: 

- Mercado. 

- Mercearia. 

- Empório natural. 

- Loja de produtos sem glúten. 

- Loja de produtos veganos. 

Características: 

- Pode trabalhar com estoque de produtos. 

- Pode cadastrar marcas e fabricantes. 

- Pode vender produtos embalados com informações de rótulo. 

- Pode ter menos controle sobre produção, mas maior variedade de catálogo. 

## **3.3 Produtor Independente** 

Pessoa ou pequeno negócio que produz alimentos de forma artesanal, local ou especializada. 

Exemplos: 

- Confeiteiro sem lactose. 

- Produtor de pães sem glúten. 

- Cozinha vegana artesanal. 

- Produtor de marmitas especiais. 

Características: 

- Pode trabalhar sob encomenda. 

- Pode ter produção em menor escala. 

- Pode depender fortemente de reputação e confiança. 

- Pode precisar declarar métodos de preparo e cuidados específicos. 

## **4. Escopo Funcional do MVP** 

O MVP deve concentrar-se na validação da proposta central: permitir que consumidores encontrem produtos compatíveis com seus perfis alimentares a partir de dados estruturados e confiáveis. 

## **4.1 Funcionalidades Incluídas no MVP** 

- Cadastro de usuários. 

- Login e autenticação. 

- Cadastro de perfil alimentar do consumidor. 

4 

- Cadastro de restrições alimentares do consumidor. 

- Cadastro de parceiro comercial. 

- Cadastro de produtos. 

- Cadastro de ingredientes. 

- Classificação alimentar dos produtos. 

- Indicação de risco de contaminação cruzada. 

- Busca de produtos por texto e filtros alimentares. 

- Busca de parceiros por tipo e restrições atendidas. 

- Visualização de detalhes do produto. 

- Indicação de compatibilidade com o perfil alimentar. 

- Avaliação simples de produto ou parceiro. 

- Denúncia de informação alimentar incorreta. 

- Painel básico do parceiro. 

- Painel administrativo básico. 

## **4.2 Funcionalidades Não Prioritárias no MVP** 

- Pagamento integrado. 

- Carrinho completo. 

- Entrega própria. 

- Rastreamento em tempo real. 

- Recomendação automática avançada. 

- Auditoria profissional de cozinhas. 

- Certificação laboratorial. 

- Programa de fidelidade. 

- Chat entre consumidor e parceiro. 

- Integração com sistemas externos de estoque. 

## **5. Módulos Funcionais** 

## **5.1 Módulo de Gestão de Usuários** 

Responsável por cadastro, autenticação, autorização e gerenciamento de contas. 

Funcionalidades: 

- Cadastro de usuário. 

- Login. • Logout. 

- Recuperação de senha. 

- Edição de dados pessoais. 

- Definição de papéis. 

- Controle de permissões. 

- Bloqueio ou suspensão de contas. 

Responsabilidades: 

- Garantir que cada usuário tenha identidade própria. 

- Proteger funcionalidades restritas. 

- Controlar acesso conforme papel do usuário. 

- Permitir evolução futura para autenticação social ou multifator. 

5 

Regras importantes: 

- Um e-mail não pode estar associado a mais de uma conta ativa. 

- Senhas devem ser armazenadas de forma segura. 

- Usuários administradores devem ter permissões diferenciadas. 

- Usuários parceiros devem estar vinculados a pelo menos um cadastro comercial para gerenciar produtos. 

## **5.2 Módulo de Perfil Alimentar** 

Responsável por registrar as restrições, alergias, intolerâncias e preferências alimentares do consumidor. 

Funcionalidades: 

- Seleção de restrições alimentares. 

- Registro de alergias. 

- Registro de intolerâncias. 

- Registro de preferências alimentares. 

- Indicação de severidade ou nível de atenção. 

- Edição do perfil alimentar. 

- Uso do perfil na busca e nos alertas. 

Exemplos de restrições: 

- Sem glúten. 

- Sem lactose. 

- Sem leite animal. 

- Sem ovos. 

- Sem soja. 

- Sem amendoim. 

- Sem castanhas. 

- Sem açúcar. 

- Baixo carboidrato. 

- Vegano. 

- Vegetariano. 

Responsabilidades: 

- Representar o perfil alimentar de forma estruturada. 

- Permitir múltiplas restrições por consumidor. 

- Fornecer dados para cálculo de compatibilidade. 

- Apoiar personalização da experiência. 

Regras importantes: 

- O consumidor pode possuir múltiplas restrições simultaneamente. • A severidade pode influenciar o nível dos alertas exibidos. 

- Preferências e restrições de saúde devem poder ser diferenciadas. 

- O perfil alimentar deve ser editável pelo consumidor. 

6 

## **5.3 Módulo de Parceiros** 

Responsável pelo cadastro e gestão de estabelecimentos, comércios alimentares e produtores independentes. 

Funcionalidades: 

- Cadastro de parceiro. 

- Definição do tipo de parceiro. 

- Cadastro de dados comerciais. 

- Cadastro de localização. 

- Definição de área de atendimento. 

- Horários de funcionamento. 

- Status de aprovação. 

- Página pública do parceiro. 

Responsabilidades: 

- Organizar os fornecedores disponíveis na plataforma. 

- Permitir que cada parceiro gerencie seu próprio catálogo. 

- Fornecer dados para busca por estabelecimento ou produtor. 

- Permitir moderação administrativa. 

Regras importantes: 

- Um parceiro deve estar vinculado a um usuário responsável. 

- Um parceiro pode precisar de aprovação antes de publicar produtos. 

- Um parceiro pode ter produtos ativos, inativos ou pendentes. 

- Um parceiro pode atender múltiplas restrições alimentares. 

## **5.4 Módulo de Catálogo de Produtos** 

Responsável pelo cadastro, organização e exibição dos produtos alimentares. 

Funcionalidades: 

- Cadastro de produto. 

- Edição de produto. 

- Inativação de produto. 

- Cadastro de preço. 

- Cadastro de categoria. 

- Upload de imagens. 

- Associação com parceiro. 

- Associação com ingredientes. 

- Associação com classificações alimentares. 

- Indicação de disponibilidade. 

Responsabilidades: 

- Organizar o conjunto de produtos ofertados. 

- Permitir descrição alimentar detalhada. 

7 

- Fornecer dados para busca, compatibilidade e avaliação. 

- Preservar clareza sobre ingredientes e riscos. 

Regras importantes: 

- Todo produto deve pertencer a um parceiro. 

- Todo produto deve ter nome, descrição, categoria e status. 

- Produtos devem conter informações alimentares mínimas para publicação. 

- Produtos incompletos podem ficar pendentes de revisão. 

## **5.5 Módulo de Ingredientes** 

Responsável por estruturar a composição dos produtos. 

Funcionalidades: 

- Cadastro de ingredientes. 

- Associação de ingredientes a produtos. 

- Indicação de alergênicos. 

- Indicação de ingredientes de origem animal. 

- Indicação de ingredientes com glúten, lactose ou outros componentes relevantes. 

Responsabilidades: 

- Evitar dependência exclusiva de descrições textuais. 

- Apoiar classificação alimentar dos produtos. 

- Permitir rastreabilidade básica da composição. 

- Fornecer base para alertas de compatibilidade. 

Regras importantes: 

- Um produto pode ter múltiplos ingredientes. 

- Um ingrediente pode aparecer em múltiplos produtos. 

- Ingredientes podem estar associados a restrições alimentares. 

- Ingredientes críticos devem ser destacados. 

## **5.6 Módulo de Classificação Alimentar** 

Responsável por indicar se um produto contém, não contém, pode conter ou não informa determinada restrição ou substância alimentar. 

Funcionalidades: 

- Cadastro de classificações alimentares. 

- Associação de restrições ao produto. 

- Indicação de presença ou ausência. 

- Indicação de risco de contaminação cruzada. 

- Exibição de selos alimentares. 

- Cálculo de compatibilidade com perfil do consumidor. 

8 

Status possíveis: 

- Contém. 

- Não contém. 

- Pode conter. 

- Não informado. 

Responsabilidades: 

- Representar a informação alimentar de forma padronizada. 

- Diferenciar ausência declarada de risco potencial. 

- Fornecer dados para alertas. 

- Apoiar moderação e auditoria. 

Regras importantes: 

- “Não contém” e “pode conter” não são equivalentes. 

- Produtos com “pode conter” devem gerar alerta. 

- Produtos com informação “não informado” devem ser tratados com cautela. 

- A classificação alimentar deve ser visível para o consumidor. 

## **5.7 Módulo de Compatibilidade Alimentar** 

Responsável por comparar o perfil alimentar do consumidor com as informações do produto. 

Funcionalidades: 

- Comparar restrições do consumidor com classificações do produto. 

- Identificar compatibilidade. 

- Identificar incompatibilidade. 

- Identificar risco potencial. 

- Identificar informação insuficiente. 

- Exibir resultado da análise na interface. 

Possíveis resultados: 

- Compatível. 

- Atenção. 

- Incompatível. 

- Indeterminado. 

Responsabilidades: 

- Traduzir dados alimentares em orientação clara para o consumidor. 

- Apoiar a tomada de decisão. 

- Reduzir esforço manual de análise. 

- Aumentar confiança na navegação. 

Regras importantes: 

- Se o produto contém item restrito ao consumidor, o resultado deve ser incompatível. 

- Se o produto pode conter item restrito, o resultado deve ser atenção. 

9 

• Se não há informação suficiente, o resultado deve ser indeterminado. • Se não há conflito conhecido, o resultado pode ser compatível. 

## **5.8 Módulo de Busca e Descoberta** 

Responsável por permitir que consumidores encontrem produtos e parceiros adequados. 

Funcionalidades: 

- Busca por texto. 

- Filtro por restrição alimentar. 

- Filtro por categoria. 

- Filtro por ingrediente. 

- Filtro por tipo de parceiro. 

- Filtro por localização. 

- Filtro por avaliação. 

- Ordenação por relevância, preço, avaliação ou proximidade. 

Responsabilidades: 

- Facilitar descoberta de produtos compatíveis. 

- Permitir combinação de múltiplos critérios. 

- Priorizar resultados relevantes para o perfil do consumidor. 

- Exibir motivo da compatibilidade ou alerta. 

Regras importantes: 

- A busca deve aceitar múltiplas restrições simultâneas. 

- Produtos incompatíveis podem ser ocultados ou exibidos com alerta, conforme configuração futura. 

- Resultados devem ser paginados. 

- Filtros críticos devem ser claros e acessíveis. 

## **5.9 Módulo de Avaliações** 

Responsável pelo feedback de consumidores sobre produtos e parceiros. 

Funcionalidades: 

- Avaliar produto. 

- Avaliar parceiro. 

- Inserir comentário. 

- Visualizar média de avaliações. 

- Denunciar avaliação inadequada. 

Responsabilidades: 

- Apoiar reputação dos parceiros. 

- Ajudar consumidores na tomada de decisão. 

- Identificar possíveis problemas recorrentes. 

- Gerar sinais de confiança. 

- 

10 

Regras importantes: 

- Avaliações devem estar vinculadas a usuários autenticados. 

- A média de avaliação deve ser recalculada após novas avaliações. 

- Avaliações podem ser moderadas. 

- Em fase futura, avaliações podem depender de compra realizada. 

## **5.10 Módulo de Denúncias** 

Responsável por registrar problemas informados pelos consumidores, especialmente sobre informações alimentares incorretas. 

Funcionalidades: 

- Denunciar produto. 

- Denunciar parceiro. 

- Denunciar informação alimentar. 

- Informar motivo e descrição. 

- Classificar prioridade. 

- Acompanhar status internamente. 

- Encaminhar para análise administrativa. 

Responsabilidades: 

- Proteger confiabilidade do ecossistema. 

- Identificar riscos alimentares. 

- Permitir correção de informações. 

- Apoiar moderação administrativa. 

Regras importantes: 

- Denúncias sobre risco alimentar devem ter prioridade alta. 

- Produtos com múltiplas denúncias podem ser sinalizados automaticamente. 

- Administradores devem poder alterar o status da denúncia. 

- A denúncia deve manter histórico de análise. 

## **5.11 Módulo de Painel do Parceiro** 

Responsável por oferecer ao parceiro uma interface de gestão. 

Funcionalidades: 

- Visualizar resumo do negócio. 

- Editar dados comerciais. 

- Cadastrar produtos. 

- Editar produtos. 

- Gerenciar disponibilidade. 

- Visualizar avaliações. 

- Visualizar denúncias relacionadas aos produtos. 

- Gerenciar pedidos em fase futura. 

11 

Responsabilidades: 

- Simplificar a gestão do catálogo. 

- Orientar o preenchimento de dados alimentares. 

- Reduzir erros de cadastro. 

- Permitir manutenção constante das informações. 

## **5.12 Módulo Administrativo** 

Responsável pela operação, moderação e governança da plataforma. 

Funcionalidades: 

- Gerenciar usuários. 

- Gerenciar parceiros. 

- Aprovar parceiros. 

- Revisar produtos. 

- Gerenciar denúncias. 

- Gerenciar categorias. 

- Gerenciar restrições alimentares. 

- Visualizar indicadores. 

- Suspender contas ou produtos. 

Responsabilidades: 

- Manter integridade da plataforma. 

- Preservar confiança dos consumidores. 

- Organizar dados mestres. 

- Resolver problemas reportados. 

## **5.13 Módulo de Pedidos — Fase Futura** 

Responsável por permitir transações dentro da plataforma. 

Funcionalidades futuras: 

- Carrinho. 

- Criação de pedido. 

- Confirmação pelo parceiro. 

- Status do pedido. 

- Histórico de pedidos. 

- Cancelamento. 

- Registro de observações alimentares. 

Status possíveis: 

- Criado. 

- Aguardando confirmação. 

- Confirmado. 

- Em preparo. 

- Pronto para retirada. 

12 

- Em entrega. • Entregue. • Cancelado. 

Regra crítica: 

- O pedido deve registrar uma cópia das informações alimentares do produto no momento da compra, evitando que alterações futuras no produto modifiquem o histórico. 

## **5.14 Módulo de Pagamentos — Fase Futura** 

Responsável por integração com meios de pagamento. 

Funcionalidades futuras: 

- Pagamento por Pix. 

- Pagamento por cartão. 

- Registro de transação. • Confirmação de pagamento. 

- Reembolso. 

- Conciliação. 

Regras importantes: 

- A plataforma não deve armazenar dados sensíveis de cartão diretamente. 

- O pagamento deve estar vinculado a um pedido. 

- Falhas de pagamento devem ser tratadas sem perda dos dados do pedido. 

## **6. Relação entre Módulos** 

O CeliLac deve ser projetado com separação clara de responsabilidades, mas os módulos precisam trabalhar de forma integrada. 

Relações importantes: 

- Usuários se relacionam com perfis alimentares. 

- Usuários parceiros se relacionam com parceiros comerciais. 

- Parceiros comerciais se relacionam com produtos. 

- Produtos se relacionam com ingredientes. 

- Produtos se relacionam com classificações alimentares. 

- Perfis alimentares se relacionam com restrições. 

- Compatibilidade alimentar compara perfil alimentar e produto. 

- Busca utiliza produtos, parceiros, restrições e compatibilidade. 

- Avaliações se relacionam com consumidores, produtos e parceiros. 

- Denúncias se relacionam com consumidores, produtos, parceiros e administração. 

- Pedidos se relacionam com consumidores, parceiros, produtos e pagamentos. 

13 

## **7. Priorização Funcional** 

## **Prioridade Alta** 

- Gestão de usuários. 

- Perfil alimentar. 

- Cadastro de parceiros. 

- Cadastro de produtos. 

- Classificação alimentar. 

- Compatibilidade alimentar. 

- Busca com filtros. 

- Visualização de produto. 

- Administração básica. 

## **Prioridade Média** 

- Avaliações. 

- Denúncias. 

- Painel do parceiro aprimorado. 

- Moderação de produtos. 

- Indicadores básicos. 

- Favoritos. 

## **Prioridade Baixa no MVP** 

- Pedidos. 

- Pagamentos. 

- Rastreamento. 

- Recomendações avançadas. 

- Selos formais de confiança. 

- Relatórios avançados para parceiros. 

## **8. Síntese da Parte 2** 

A estrutura funcional do CeliLac deve ser organizada em torno de três grandes frentes: consumidores com perfis alimentares, parceiros com produtos classificados e administração responsável pela confiança do ecossistema. 

O núcleo do produto está na integração entre perfil alimentar, catálogo de produtos, classificação alimentar, compatibilidade e busca especializada. Esse conjunto deve ser priorizado, pois representa o diferencial central da plataforma em relação a soluções genéricas de alimentação ou delivery. 

14 

