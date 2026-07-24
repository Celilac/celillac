# **PRD CeliLac — Parte 3** 

# **Requisitos Funcionais, Requisitos Não Funcionais e Regras de Negócio** 

## **1. Objetivo desta Parte** 

Esta parte do PRD detalha os requisitos funcionais, requisitos não funcionais e regras de negócio do CeliLac. 

Os requisitos foram organizados para orientar a construção do produto, apoiar a decomposição em histórias de usuário e servir como base para modelagem, implementação, testes e validação do MVP. 

## **2. Requisitos Funcionais** 

## **RF01 — Cadastro de Usuário** 

O sistema deve permitir que visitantes criem uma conta informando dados básicos. 

Dados mínimos: 

- Nome. 

- E-mail. 

- Senha. 

- Tipo inicial de uso, quando aplicável. 

Critérios de aceite: 

- O sistema deve validar campos obrigatórios. 

- O sistema deve validar formato de e-mail. 

- O sistema deve impedir cadastro duplicado com o mesmo e-mail. 

- O sistema deve armazenar senha de forma segura. 

- O usuário deve receber uma conta ativa ou pendente, conforme política definida. 

## **RF02 — Login e Autenticação** 

O sistema deve permitir que usuários cadastrados acessem a plataforma por meio de credenciais válidas. 

Critérios de aceite: 

- Usuário com credenciais válidas deve conseguir acessar o sistema. 

- Credenciais inválidas devem gerar mensagem de erro adequada. 

- O sistema deve criar uma sessão ou token de autenticação. 

- Funcionalidades protegidas devem exigir autenticação. 

- O usuário deve conseguir encerrar a sessão. 

1 

## **RF03 — Recuperação de Senha** 

O sistema deve permitir recuperação de acesso em caso de esquecimento da senha. 

Critérios de aceite: 

- O usuário deve informar o e-mail cadastrado. 

- O sistema deve gerar fluxo seguro de redefinição. 

- O link ou código deve possuir validade limitada. 

- A nova senha deve obedecer aos critérios mínimos de segurança. 

## **RF04 — Gerenciamento de Papéis e Permissões** 

O sistema deve controlar permissões conforme o papel do usuário. 

Papéis iniciais: 

- Consumidor. 

- Parceiro. 

- Administrador. 

Critérios de aceite: 

- Consumidores não devem acessar recursos administrativos. 

- Parceiros devem gerenciar apenas seus próprios dados e produtos. 

- Administradores devem acessar recursos de moderação e gestão. 

- Rotas e ações sensíveis devem validar permissão. 

## **RF05 — Cadastro de Perfil Alimentar** 

O sistema deve permitir que consumidores registrem suas restrições, alergias, intolerâncias e preferências alimentares. 

Critérios de aceite: 

- O consumidor deve poder selecionar múltiplas restrições. 

- O consumidor deve poder editar o perfil posteriormente. 

- O perfil deve estar vinculado ao usuário autenticado. 

- O perfil deve ser usado na busca e na análise de compatibilidade. 

## **RF06 — Cadastro de Restrição Alimentar no Perfil** 

O sistema deve permitir associar restrições alimentares ao perfil do consumidor. 

Exemplos: 

- Doença celíaca. 

- Intolerância à lactose. 

- Alergia à proteína do leite. 

- Alergia a amendoim. 

2 

- Alergia a castanhas. 

- Dieta vegana. 

- Dieta vegetariana. 

- Restrição de açúcar. 

Critérios de aceite: 

- O usuário deve poder adicionar restrições. 

- O usuário deve poder remover restrições. 

- O sistema deve permitir classificação por tipo, como alergia, intolerância, preferência ou restrição médica. 

- O sistema deve permitir indicar observações. 

## **RF07 — Cadastro de Parceiro Comercial** 

O sistema deve permitir que usuários cadastrem um parceiro comercial. 

Dados mínimos: 

- Nome comercial. 

- Tipo de parceiro. 

- Descrição. 

- Telefone ou contato. 

- Endereço ou área de atendimento. 

- Responsável. 

Critérios de aceite: 

- O parceiro deve estar vinculado a um usuário responsável. 

- O parceiro deve possuir tipo definido. 

- O cadastro deve possuir status. 

- O administrador deve conseguir visualizar parceiros pendentes. 

## **RF08 — Aprovação de Parceiro** 

O sistema deve permitir que administradores aprovem, reprovem ou solicitem ajustes em cadastros de parceiros. 

Critérios de aceite: 

- Administradores devem visualizar cadastros pendentes. 

- Administradores devem alterar status do parceiro. 

- Parceiros aprovados podem publicar produtos, conforme política definida. 

- Parceiros reprovados devem receber motivo ou orientação. 

## **RF09 — Cadastro de Produto** 

O sistema deve permitir que parceiros cadastrem produtos alimentares. 

3 

Dados mínimos: 

- Nome. 

- Descrição. 

- Preço. 

- Categoria. 

- Imagem, quando disponível. 

- Parceiro responsável. 

- Status de disponibilidade. 

### Critérios de aceite: 

- O produto deve estar vinculado ao parceiro autenticado. 

- Campos obrigatórios devem ser validados. 

- O produto deve permitir inclusão de informações alimentares. 

- O produto deve possuir status de publicação. 

## **RF10 — Edição de Produto** 

O sistema deve permitir que parceiros editem produtos cadastrados. 

Critérios de aceite: 

- O parceiro deve editar apenas seus próprios produtos. 

- Alterações em informações alimentares críticas podem exigir nova revisão. 

- O sistema deve registrar data de atualização. 

- O produto editado deve refletir as alterações na visualização pública. 

## **RF11 — Inativação de Produto** 

O sistema deve permitir que parceiros inativem produtos. 

### Critérios de aceite: 

- Produto inativo não deve aparecer em buscas públicas, salvo em histórico. 

- Produto inativo deve permanecer registrado para fins administrativos. 

- O parceiro deve poder reativar o produto, conforme regras da plataforma. 

## **RF12 — Cadastro de Ingredientes** 

O sistema deve permitir cadastrar ingredientes associados a produtos. 

### Critérios de aceite: 

- Um produto deve poder ter múltiplos ingredientes. 

- Um ingrediente pode estar associado a múltiplos produtos. 

- Ingredientes podem indicar alergênicos ou componentes críticos. 

- Ingredientes devem ser exibidos na página do produto quando cadastrados. 

4 

## **RF13 — Classificação Alimentar do Produto** 

O sistema deve permitir classificar produtos conforme restrições alimentares. 

Estados mínimos: 

- Contém. 

- Não contém. 

- Pode conter. 

- Não informado. 

Critérios de aceite: 

- Um produto deve permitir múltiplas classificações. 

- O sistema deve distinguir presença, ausência, risco e ausência de informação. 

- Classificações devem ser exibidas ao consumidor. 

- Classificações devem ser usadas no cálculo de compatibilidade. 

## **RF14 — Registro de Contaminação Cruzada** 

O sistema deve permitir informar risco de contaminação cruzada. 

Critérios de aceite: 

- O parceiro deve poder indicar se há risco de contaminação cruzada. 

- O risco deve estar associado a uma restrição ou substância específica. 

- O consumidor deve visualizar o alerta. 

- Produtos com risco devem gerar status de atenção na compatibilidade. 

## **RF15 — Visualização de Produto** 

O sistema deve permitir que consumidores visualizem detalhes completos de um produto. 

Informações exibidas: 

- Nome. 

- Descrição. 

- Imagem. 

- Preço. 

- Parceiro. 

- Categoria. 

- Ingredientes. 

- Classificações alimentares. 

- Alertas de risco. 

- Avaliações. 

Critérios de aceite: 

- Informações críticas devem ter destaque visual. 

- O sistema deve exibir compatibilidade com o perfil do consumidor autenticado. 

5 

- Usuários não autenticados podem visualizar informações públicas, conforme política definida. 

## **RF16 — Busca de Produtos** 

O sistema deve permitir buscar produtos por texto e filtros. 

Filtros mínimos: 

- Nome ou termo textual. 

- Categoria. 

- Restrição alimentar. 

- Tipo de parceiro. 

- Avaliação. 

- Localização, quando disponível. 

Critérios de aceite: 

- A busca deve aceitar múltiplos filtros simultâneos. 

- A busca deve retornar resultados paginados. 

- Resultados devem indicar compatibilidade quando possível. 

- Produtos incompatíveis devem ser tratados conforme configuração definida. 

## **RF17 — Busca por Perfil Alimentar** 

O sistema deve permitir que consumidores autenticados busquem produtos com base em seu perfil alimentar. 

Critérios de aceite: 

- O sistema deve considerar as restrições do perfil. 

- Produtos compatíveis devem ser destacados. 

- Produtos com risco devem exibir alerta. 

- Produtos incompatíveis devem ser sinalizados ou ocultados, conforme regra definida. 

## **RF18 — Busca de Parceiros** 

O sistema deve permitir buscar estabelecimentos, comércios e produtores. 

Critérios de aceite: 

- O usuário deve poder buscar por nome. 

- O usuário deve poder filtrar por tipo de parceiro. 

- O usuário deve poder filtrar por restrições atendidas. 

- A listagem deve exibir avaliação média e resumo do parceiro. 

## **RF19 — Favoritos** 

O sistema deve permitir que consumidores favoritem produtos ou parceiros. 

6 

Critérios de aceite: 

- O usuário autenticado deve poder favoritar. 

- O usuário deve poder remover favorito. 

- A lista de favoritos deve ser acessível no perfil. 

- Favoritos devem estar vinculados ao usuário. 

## **RF20 — Avaliação de Produto** 

O sistema deve permitir que consumidores avaliem produtos. 

### Critérios de aceite: 

- A avaliação deve conter nota. 

- A avaliação pode conter comentário. 

- A avaliação deve estar vinculada ao usuário. 

- A média do produto deve ser atualizada. 

## **RF21 — Avaliação de Parceiro** 

O sistema deve permitir que consumidores avaliem parceiros. 

### Critérios de aceite: 

- A avaliação deve conter nota. 

- A avaliação pode conter comentário. 

- A avaliação deve estar vinculada ao usuário. 

- A média do parceiro deve ser atualizada. 

## **RF22 — Denúncia de Informação Alimentar** 

O sistema deve permitir que consumidores denunciem informações alimentares incorretas ou suspeitas. 

Critérios de aceite: 

- A denúncia deve estar vinculada ao produto ou parceiro. 

- O usuário deve informar motivo. 

- O usuário pode inserir descrição complementar. 

- Denúncias devem ser encaminhadas ao painel administrativo. 

## **RF23 — Gestão de Denúncias** 

O sistema deve permitir que administradores analisem denúncias. 

Critérios de aceite: 

- Administradores devem visualizar denúncias pendentes. 

- Administradores devem alterar status da denúncia. 

- Administradores devem registrar decisão. 

7 

- Produtos denunciados podem ser suspensos temporariamente. 

## **RF24 — Painel do Parceiro** 

O sistema deve disponibilizar painel para parceiros gerenciarem seu negócio. 

Funcionalidades mínimas: 

- Visualizar dados do parceiro. 

- Editar cadastro comercial. 

- Listar produtos. 

- Criar produto. 

- Editar produto. 

- Inativar produto. 

- Visualizar avaliações. 

- Visualizar alertas ou pendências. 

Critérios de aceite: 

- O parceiro deve acessar apenas seus próprios dados. 

- O painel deve destacar produtos incompletos. 

- O painel deve informar pendências de revisão. 

## **RF25 — Painel Administrativo** 

O sistema deve disponibilizar painel para administração da plataforma. 

Funcionalidades mínimas: 

- Listar usuários. 

- Listar parceiros. 

- Aprovar parceiros. 

- Listar produtos. 

- Moderar produtos. 

- Listar denúncias. 

- Gerenciar categorias. 

- Gerenciar restrições alimentares. 

Critérios de aceite: 

- Apenas administradores devem acessar o painel. 

- Ações administrativas devem ser registradas. 

- A interface deve permitir filtragem por status. 

## **RF26 — Criação de Pedido — Fase Futura** 

O sistema deve permitir que consumidores criem pedidos. 

8 

Critérios de aceite: 

- O consumidor deve adicionar produtos ao carrinho. 

- O sistema deve exibir alertas alimentares antes da confirmação. 

- O pedido deve registrar itens, quantidades e valores. 

- O pedido deve registrar status inicial. 

## **RF27 — Pagamento — Fase Futura** 

O sistema deve permitir pagamento de pedidos por meio de integração externa. 

### Critérios de aceite: 

- O usuário deve selecionar método de pagamento. 

- O sistema deve registrar status da transação. 

- O pedido deve refletir o status do pagamento. 

- Falhas devem ser tratadas sem perda do pedido. 

## **RF28 — Histórico de Pedidos — Fase Futura** 

O sistema deve permitir que consumidores visualizem pedidos anteriores. 

### Critérios de aceite: 

- O usuário deve visualizar lista de pedidos. 

- Cada pedido deve exibir status, data, itens e valor. 

- O pedido deve preservar informações alimentares do momento da compra. 

## **3. Requisitos Não Funcionais** 

## **RNF01 — Segurança** 

O sistema deve proteger dados pessoais, credenciais, permissões e operações sensíveis. 

### Critérios: 

- Senhas devem ser armazenadas com hash seguro. 

- Rotas privadas devem exigir autenticação. 

- Permissões devem ser verificadas no backend. 

- Dados de pagamento não devem ser armazenados diretamente pela plataforma. 

- Ações administrativas devem ser protegidas. 

## **RNF02 — Confiabilidade da Informação Alimentar** 

O sistema deve tratar informações alimentares como dados críticos. 

### Critérios: 

- Informações de risco devem ter destaque. 

9 

- Produtos incompletos devem ser sinalizados. 

- Denúncias alimentares devem ser priorizadas. 

- Alterações críticas devem ser rastreáveis em versão futura. 

## **RNF03 — Usabilidade** 

A interface deve ser simples e orientada, mesmo quando o domínio for complexo. 

### Critérios: 

- Formulários devem ser divididos em etapas quando necessário. 

- Campos alimentares devem apresentar exemplos. 

- Alertas devem ser claros. 

- Filtros devem ser fáceis de compreender. 

## **RNF04 — Acessibilidade** 

A plataforma deve seguir boas práticas de acessibilidade. 

### Critérios: 

- Contraste adequado. 

- Labels claros em formulários. 

- Navegação por teclado na interface web. 

- Mensagens compreensíveis. 

- Tamanho adequado de elementos interativos. 

## **RNF05 — Performance** 

O sistema deve responder adequadamente em operações frequentes. 

### Critérios: 

- Buscas devem utilizar paginação. 

- Filtros frequentes devem ser otimizados. 

- Consultas sobre produtos, restrições e parceiros devem possuir índices adequados. 

- Imagens devem ser carregadas de forma otimizada. 

## **RNF06 — Escalabilidade** 

O sistema deve permitir crescimento de usuários, parceiros, produtos e pedidos. 

### Critérios: 

- Módulos devem possuir responsabilidades separadas. 

- Busca deve poder evoluir para mecanismo especializado. 

- Pedidos e pagamentos devem poder evoluir sem afetar o núcleo alimentar. 

- O domínio alimentar deve permanecer organizado e isolado. 

10 

## **RNF07 — Manutenibilidade** 

O sistema deve ser organizado de forma clara para facilitar evolução. 

### Critérios: 

- Separação entre apresentação, aplicação, domínio e persistência. 

- Regras alimentares centralizadas no domínio. 

- Casos de uso organizados por módulo. 

- Persistência isolada por repositórios ou camada equivalente. 

## **RNF08 — Auditabilidade** 

O sistema deve permitir rastrear ações relevantes. 

### Critérios: 

- Ações administrativas devem registrar responsável e data. 

- Denúncias devem manter histórico de tratamento. 

- Alterações críticas em produtos devem ser rastreáveis em versão futura. 

- Aprovações e reprovações devem registrar justificativa. 

## **RNF09 — Privacidade** 

O sistema deve proteger dados pessoais dos usuários. 

### Critérios: 

- Coletar apenas dados necessários. 

- Permitir edição de dados pessoais. 

- Proteger informações sensíveis. 

- Informar finalidade de uso dos dados. 

## **RNF10 — Disponibilidade** 

A plataforma deve permanecer disponível para consumidores e parceiros dentro de parâmetros aceitáveis. 

### Critérios: 

- O sistema deve tratar erros de forma controlada. 

- Falhas externas não devem comprometer dados internos. 

- Operações críticas devem ter mensagens claras em caso de indisponibilidade. 

## **4. Regras de Negócio** 

## **RN01 — Múltiplas Restrições por Consumidor** 

Um consumidor pode possuir múltiplas restrições alimentares simultaneamente. 

11 

Exemplo: 

Um mesmo consumidor pode ser celíaco, intolerante à lactose e vegetariano. 

## **RN02 — Restrição, Preferência e Alergia são Conceitos Diferentes** 

O sistema deve diferenciar restrições médicas, alergias, intolerâncias e preferências alimentares. 

Justificativa: 

O nível de risco pode ser diferente. Uma preferência alimentar pode permitir exceções, enquanto uma alergia pode representar risco grave. 

## **RN03 — Produto Deve Pertencer a um Parceiro** 

Todo produto cadastrado deve estar associado a um parceiro comercial. 

## **RN04 — Produto Pode Ter Múltiplas Classificações** 

Um produto pode ser simultaneamente sem lactose, sem glúten e vegano, ou pode atender apenas uma dessas classificações. 

## **RN05 — “Não Contém” e “Pode Conter” Não São Equivalentes** 

O sistema deve tratar “não contém” e “pode conter” como estados diferentes. 

Implicação: 

Produtos marcados como “pode conter” devem gerar alerta para consumidores que possuem restrição relacionada. 

## **RN06 — Informação Não Declarada Deve Gerar Cautela** 

Quando a informação sobre determinada restrição não estiver disponível, o sistema deve tratar o resultado como indeterminado ou incompleto. 

## **RN07 — Contaminação Cruzada Deve Ser Sinalizada** 

Produtos com risco de contaminação cruzada devem exibir alerta, mesmo que o ingrediente restrito não esteja presente na composição principal. 

## **RN08 — Compatibilidade Depende do Perfil Alimentar** 

A compatibilidade de um produto deve ser calculada com base nas restrições registradas pelo consumidor. 

12 

Resultados possíveis: 

- Compatível. 

- Atenção. 

- Incompatível. 

- Indeterminado. 

## **RN09 — Produto Incompatível Deve Ser Claramente Identificado** 

Se um produto contiver ingrediente ou classificação incompatível com o perfil do consumidor, o sistema deve exibir aviso claro. 

## **RN10 — Produto com Risco Deve Gerar Atenção** 

Se um produto puder conter item restrito ou apresentar risco de contaminação cruzada, o sistema deve exibir status de atenção. 

## **RN11 — Produto com Informação Insuficiente Deve Ser Indeterminado** 

Se o sistema não possuir dados suficientes para avaliar compatibilidade, deve informar que a compatibilidade não pode ser determinada. 

## **RN12 — Parceiro é Responsável pela Informação Declarada** 

O parceiro comercial é responsável pelas informações alimentares cadastradas em seus produtos. 

## **RN13 — Administração Pode Suspender Produto** 

Administradores podem suspender produtos com informações suspeitas, denúncias críticas ou risco potencial ao consumidor. 

## **RN14 — Denúncias Alimentares Têm Prioridade** 

Denúncias relacionadas à segurança alimentar devem ter prioridade sobre denúncias genéricas. 

## **RN15 — Histórico do Pedido Deve Preservar Snapshot Alimentar** 

Em fase de pedidos, o sistema deve registrar as informações alimentares do produto no momento da compra. 

Justificativa: 

Se o parceiro alterar o produto depois, o histórico do consumidor não deve ser modificado retroativamente. 

13 

## **RN16 — Parceiros Pendentes Podem Ter Acesso Limitado** 

Parceiros ainda não aprovados podem acessar o painel, mas podem ter restrição para publicar produtos. 

## **RN17 — Produtos Incompletos Podem Ficar Pendentes** 

Produtos sem informações mínimas de classificação alimentar podem ficar pendentes de revisão ou publicação. 

## **RN18 — Usuário Só Pode Avaliar Autenticado** 

Avaliações devem ser realizadas por usuários autenticados. 

## **RN19 — Avaliações Podem Ser Moderadas** 

Avaliações com conteúdo inadequado, ofensivo ou falso podem ser ocultadas ou removidas por administradores. 

## **RN20 — Dados Mestres Devem Ser Controlados** 

Categorias, restrições alimentares e classificações padronizadas devem ser gerenciadas pela administração para evitar duplicidade e inconsistência. 

## **5. Matriz de Prioridade dos Requisitos** 

## **Alta Prioridade para MVP** 

- RF01 — Cadastro de usuário. • RF02 — Login e autenticação. 

- RF04 — Papéis e permissões. 

- RF05 — Cadastro de perfil alimentar. 

- RF06 — Cadastro de restrições no perfil. 

- RF07 — Cadastro de parceiro. • RF09 — Cadastro de produto. 

- RF12 — Cadastro de ingredientes. 

- RF13 — Classificação alimentar. • RF14 — Contaminação cruzada. 

- RF15 — Visualização de produto. 

- RF16 — Busca de produtos. 

- RF17 — Busca por perfil alimentar. 

- RF24 — Painel do parceiro básico. • RF25 — Painel administrativo básico. 

## **Média Prioridade para MVP ou Pós-MVP Imediato** 

- RF08 — Aprovação de parceiro. • RF10 — Edição de produto. 

14 

- RF11 — Inativação de produto. 

- RF18 — Busca de parceiros. 

- RF19 — Favoritos. 

- RF20 — Avaliação de produto. 

- RF21 — Avaliação de parceiro. • RF22 — Denúncia de informação alimentar. • RF23 — Gestão de denúncias. 

## **Prioridade Pós-MVP** 

- RF26 — Criação de pedido. • RF27 — Pagamento. • RF28 — Histórico de pedidos. 

## **6. Síntese da Parte 3** 

Os requisitos do CeliLac demonstram que o produto deve priorizar a construção de um núcleo confiável de dados alimentares. O sistema não deve apenas listar produtos; deve interpretar informações de ingredientes, restrições e riscos para orientar o consumidor. 

A maior complexidade do produto está na classificação alimentar e na compatibilidade com o perfil do consumidor. Por isso, essas regras precisam ser tratadas como parte central do domínio e não como simples campos descritivos. 

15 

