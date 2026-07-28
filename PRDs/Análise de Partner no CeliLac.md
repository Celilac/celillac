# **Análise de Partner no CeliLac** 

## **Orientação de DDD e Casos de Uso para Backend e Frontend** 

## **1. Objetivo do Documento** 

Este documento define como o conceito de **Partner** deve ser compreendido no domínio do CeliLac, orientando as equipes de backend e frontend na implementação das funcionalidades relacionadas a parceiros da plataforma. 

O foco está na modelagem de domínio, nas responsabilidades do agregado, nos limites de contexto, nas regras de negócio e nos casos de uso que devem guiar a construção das interfaces, fluxos e comportamentos do sistema. 

Este documento não trata de tecnologias, bibliotecas, frameworks ou detalhes específicos de implementação técnica. Ele deve ser usado como referência conceitual e funcional para manter consistência entre domínio, backend e frontend. 

## **2. Definição de Partner** 

No CeliLac, **Partner** representa um fornecedor alimentar cadastrado na plataforma. 

Um Partner pode ser: 

- um estabelecimento alimentício; • um comércio alimentar; • um produtor independente. 

O Partner é o participante comercial responsável por ofertar produtos alimentares para consumidores com restrições, preferências, intolerâncias, alergias ou necessidades alimentares específicas. 

O Partner não deve ser confundido com o usuário que acessa o sistema. O usuário representa uma identidade de acesso. O Partner representa uma entidade de negócio dentro do ecossistema CeliLac. 

### **Definição resumida** 

Partner é a representação de um negócio, estabelecimento, comércio ou produtor que oferece produtos alimentares na plataforma CeliLac. 

## **3. Diferença entre User e Partner** 

A distinção entre User e Partner é essencial para evitar erros de modelagem. 

1 

## **3.1 User** 

User representa uma pessoa ou identidade que acessa o sistema. 

Responsabilidades principais: 

- autenticação; 

- identificação; 

- permissões; 

- vínculo com papéis de uso; 

- acesso às funcionalidades da plataforma. 

## **3.2 Partner** 

Partner representa uma entidade comercial ou produtiva. 

Responsabilidades principais: 

- representar o negócio fornecedor; 

- armazenar dados comerciais; 

- possuir status de aprovação; 

- possuir status operacional; 

- ofertar produtos; 

- aparecer ou não no catálogo público; 

- receber avaliações; 

- futuramente receber pedidos. 

## **3.3 Relação entre User e Partner** 

Um Partner deve estar associado a pelo menos um usuário responsável. 

No MVP, pode-se admitir a seguinte regra: 

- um usuário responsável pode gerenciar um Partner. 

Para evolução futura, recomenda-se preservar a possibilidade conceitual de: 

- um usuário gerenciar mais de um Partner; 

- um Partner ter mais de um usuário responsável; 

- diferentes usuários terem diferentes permissões dentro do mesmo Partner. 

Essas possibilidades futuras não precisam ser implementadas imediatamente, mas a modelagem não deve impedir essa evolução. 

## **4. Tipos de Partner** 

O domínio deve reconhecer três tipos principais de Partner. 

2 

## **4.1 Estabelecimento Alimentício** 

Representa um local ou negócio que prepara, vende ou serve alimentos. 

Exemplos: 

- restaurante; 

- lanchonete; 

- pizzaria; 

- padaria; 

- cafeteria; 

- hamburgueria; 

- confeitaria; 

- cozinha especializada. 

Características relevantes: 

- pode preparar alimentos no local; 

- pode trabalhar com retirada, entrega ou consumo local; 

- pode ter risco de contaminação cruzada associado ao ambiente de preparo; 

- pode cadastrar produtos prontos ou preparados sob demanda. 

## **4.2 Comércio Alimentar** 

Representa um negócio que comercializa produtos alimentares, geralmente de terceiros ou industrializados. 

Exemplos: 

- mercado; 

- mercearia; 

- empório; 

- loja de produtos naturais; 

- loja especializada em produtos sem glúten, sem lactose, veganos ou similares. 

Características relevantes: 

- pode vender produtos embalados; 

- pode trabalhar com estoque; 

- pode cadastrar produtos de diferentes marcas; 

- pode ter menor controle sobre a produção, mas deve declarar as informações disponíveis sobre o produto. 

## **4.3 Produtor Independente** 

Representa uma pessoa, família, pequeno negócio ou cozinha artesanal que produz alimentos especializados. 

3 

Exemplos: 

- produtor de pães sem glúten; 

- confeiteiro sem lactose; 

- produtor de marmitas veganas; 

- cozinha artesanal para pessoas com restrições alimentares; • pequeno produtor local. 

Características relevantes: 

- pode trabalhar sob encomenda; 

- pode ter produção em pequena escala; • pode depender fortemente de confiança e reputação; 

- pode ter informações mais detalhadas sobre ingredientes e processo de preparo. 

## **5. Partner como Agregado de Domínio** 

No domínio do CeliLac, Partner deve ser tratado como um **agregado próprio** . 

Isso significa que Partner possui identidade, ciclo de vida, regras internas e invariantes que precisam ser protegidas. 

Partner não deve ser apenas um conjunto de campos cadastrais. Ele representa uma entidade de negócio com estados, responsabilidades e decisões relevantes para o funcionamento da plataforma. 

## **5.1 Raiz do Agregado** 

A raiz do agregado é: 

- Partner 

Todas as alterações importantes relacionadas ao cadastro, aprovação, suspensão e operação do parceiro devem ocorrer por meio da raiz do agregado. 

## **5.2 Responsabilidades do Agregado Partner** 

O agregado Partner deve ser responsável por: 

- manter a identidade do parceiro; 

- armazenar dados comerciais principais; 

- definir o tipo de parceiro; 

- controlar o status de aprovação; 

- controlar o status operacional; 

- validar se o parceiro pode ou não publicar produtos; 

- validar se o parceiro pode ou não aparecer publicamente; 

- registrar alterações relevantes de estado; 

- preservar invariantes de consistência. 

4 

## **5.3 O que não deve pertencer ao Agregado Partner** 

O Partner não deve assumir responsabilidades de outros contextos. 

Não devem ficar dentro do agregado Partner: 

- regras de compatibilidade alimentar; 

- regras de ingredientes; 

- regras de alergênicos; 

- regras de pedidos; 

- regras de pagamento; 

- regras de avaliação detalhada; 

- regras de autenticação; 

- regras de autorização geral do sistema. 

O Partner pode ser referenciado por produtos, pedidos e avaliações, mas não deve controlar internamente todos esses objetos como parte do seu agregado. 

## **6. Contexto Delimitado de Partner** 

O Partner pertence a um contexto delimitado que pode ser chamado conceitualmente de: 

#### **Gestão de Parceiros** 

Esse contexto lida com o ciclo de vida do parceiro dentro da plataforma. 

## **6.1 Responsabilidades do Contexto de Gestão de Parceiros** 

O contexto de Gestão de Parceiros é responsável por: 

- criação de cadastro de parceiro; 

- atualização de dados comerciais; 

- submissão para revisão; 

- aprovação; 

- rejeição; 

- suspensão; 

- reativação; 

- controle de visibilidade pública; 

- controle de operação; 

- consulta de parceiros públicos; 

- consulta de parceiros administráveis. 

## **6.2 Relação com outros contextos** 

## **Relação com Identidade e Acesso** 

O contexto de Identidade e Acesso identifica quem é o usuário responsável. 

5 

A Gestão de Parceiros não autentica o usuário. Ela apenas recebe a informação de que determinado usuário tem permissão para executar uma ação sobre determinado Partner. 

## **Relação com Catálogo de Produtos** 

Produtos pertencem comercialmente a um Partner, mas devem ser tratados em um contexto próprio de Catálogo. 

O Partner pode determinar se um parceiro está apto a publicar produtos. Porém, o conteúdo do produto, suas classificações, ingredientes e disponibilidade pertencem ao contexto de Catálogo e Segurança Alimentar. 

## **Relação com Compatibilidade Alimentar** 

A Compatibilidade Alimentar não deve ser responsabilidade do Partner. 

O Partner informa produtos e dados associados, mas a análise de compatibilidade entre produto e perfil alimentar do consumidor deve pertencer a um contexto específico do domínio alimentar. 

## **Relação com Avaliações e Confiança** 

Avaliações podem estar associadas a um Partner, mas o cálculo detalhado de reputação, denúncias, moderação de avaliações e critérios de confiança podem evoluir em contexto próprio. 

## **Relação com Pedidos** 

Pedidos podem referenciar um Partner como fornecedor. Porém, o ciclo de vida do pedido deve pertencer ao contexto de Pedidos. 

## **7. Dados Conceituais de Partner** 

O Partner deve possuir dados suficientes para representar um fornecedor dentro da plataforma. 

## **7.1 Dados de Identificação** 

- identificador do Partner; 

- nome comercial; 

- nome formal ou legal, quando aplicável; 

- tipo de Partner; 

- descrição; 

- imagem ou representação visual, quando aplicável. 

## **7.2 Dados de Responsabilidade** 

- usuário responsável; 

- responsáveis adicionais, em evolução futura; 

- dados de contato; 

6 

• canal de atendimento. 

## **7.3 Dados de Localização ou Atendimento** 

- endereço principal; • cidade; 

- estado; 

- região de atendimento; • observações de atendimento; 

- informação sobre retirada, entrega ou atendimento local, quando aplicável. 

## **7.4 Dados Operacionais** 

- status de aprovação; 

- status operacional; 

- horários de funcionamento, quando aplicável; 

- disponibilidade para aparecer publicamente; • disponibilidade para receber pedidos, em fase futura. 

## **7.5 Dados de Governança** 

- data de criação; 

- data de atualização; 

- motivo de rejeição, quando aplicável; 

- motivo de suspensão, quando aplicável; 

- histórico conceitual de decisões administrativas, em evolução futura. 

## **8. Estados do Partner** 

O Partner possui estados que representam sua situação dentro da plataforma. 

É importante separar dois tipos de estado: 

- status de aprovação; 

- status operacional. 

## **8.1 Status de Aprovação** 

Representa a situação do Partner perante a governança da plataforma. 

Estados sugeridos: 

- rascunho; 

- pendente de revisão; 

- aprovado; 

- rejeitado; 

- suspenso. 

7 

## **8.1.1 Rascunho** 

O Partner foi iniciado, mas ainda não foi enviado para análise. 

Características: 

- pode estar incompleto; 

- não aparece publicamente; 

- não pode publicar produtos publicamente; 

- pode ser editado pelo responsável. 

## **8.1.2 Pendente de Revisão** 

O Partner foi submetido para análise. 

Características: 

- aguarda decisão administrativa; 

- pode ter edição limitada; 

- não deve aparecer publicamente; 

- não deve publicar produtos publicamente até aprovação, se essa for a política adotada. 

## **8.1.3 Aprovado** 

O Partner foi validado pela plataforma. 

Características: 

- pode aparecer publicamente se estiver operacionalmente ativo; 

- pode cadastrar e publicar produtos, conforme regras do Catálogo; 

- pode receber avaliações; 

- futuramente pode receber pedidos. 

## **8.1.4 Rejeitado** 

O Partner foi analisado e não aprovado. 

Características: 

- não aparece publicamente; 

- não pode publicar produtos; 

- deve possuir motivo ou orientação; 

- pode permitir correção e nova submissão, conforme regra do produto. 

## **8.1.5 Suspenso** 

O Partner foi bloqueado pela plataforma após aprovação ou atividade irregular. 

8 

Características: 

- não aparece publicamente; 

- não pode publicar novos produtos; 

- pode ter produtos ocultados ou suspensos; 

- não deve receber novos pedidos; 

- pode ter motivo de suspensão registrado. 

## **8.2 Status Operacional** 

Representa a disponibilidade operacional do Partner. 

Estados sugeridos: 

- ativo; • inativo; 

- temporariamente fechado. 

## **8.2.1 Ativo** 

O Partner está operacionalmente disponível. 

Pode aparecer publicamente apenas se também estiver aprovado. 

## **8.2.2 Inativo** 

O Partner foi desativado pelo responsável ou pela plataforma. 

Não deve aparecer em listagens públicas, mas seu histórico deve ser preservado. 

## **8.2.3 Temporariamente Fechado** 

O Partner está temporariamente indisponível. 

Pode aparecer publicamente, mas deve indicar indisponibilidade para determinadas ações, como pedidos ou atendimento. 

## **9. Invariantes do Agregado Partner** 

Invariantes são regras que devem ser sempre verdadeiras. 

## **9.1 Invariante de Responsável** 

Todo Partner deve possuir pelo menos um usuário responsável. 

Um Partner sem responsável não pode existir como cadastro válido. 

9 

## **9.2 Invariante de Tipo** 

Todo Partner deve possuir um tipo válido. 

O tipo define o papel comercial do Partner dentro do ecossistema. 

## **9.3 Invariante de Nome Comercial** 

Todo Partner deve possuir um nome comercial. 

O nome comercial é necessário para identificação pública e operacional. 

## **9.4 Invariante de Publicação** 

Um Partner não aprovado não pode aparecer como parceiro público ativo. 

## **9.5 Invariante de Operação** 

Um Partner suspenso não pode realizar ações operacionais relevantes, como publicar novos produtos ou receber novos pedidos. 

## **9.6 Invariante de Rejeição** 

Um Partner rejeitado deve possuir motivo ou orientação de rejeição. 

## **9.7 Invariante de Suspensão** 

Um Partner suspenso deve possuir motivo de suspensão. 

## **9.8 Invariante de Alteração Crítica** 

Alterações críticas em dados de Partner podem exigir nova revisão. 

Exemplos de alterações críticas: 

- mudança de tipo de Partner; 

- alteração de dados de identificação formal; 

- mudança significativa de endereço de produção; 

- alteração de informações que impactem confiança ou responsabilidade. 

- 

## **10. Regras de Negócio de Partner** 

## **RN-PARTNER-01 — Partner representa fornecedor alimentar** 

Um Partner sempre representa um fornecedor alimentar do ecossistema CeliLac. 

10 

Ele não representa consumidor, administrador ou usuário comum. 

## **RN-PARTNER-02 — Partner deve ter responsável** 

Todo Partner deve estar vinculado a pelo menos um usuário responsável. 

## **RN-PARTNER-03 — Partner deve ter tipo** 

Todo Partner deve ser classificado como estabelecimento alimentício, comércio alimentar ou produtor independente. 

## **RN-PARTNER-04 — Partner em rascunho não aparece publicamente** 

Um Partner em estado de rascunho não deve aparecer em catálogos públicos. 

## **RN-PARTNER-05 — Partner pendente não aparece publicamente** 

Um Partner pendente de revisão não deve aparecer publicamente até aprovação. 

## **RN-PARTNER-06 — Partner aprovado pode aparecer publicamente** 

Um Partner aprovado pode aparecer no catálogo público, desde que também esteja operacionalmente ativo. 

## **RN-PARTNER-07 — Partner rejeitado não pode publicar produtos** 

Um Partner rejeitado não pode publicar produtos publicamente. 

## **RN-PARTNER-08 — Partner suspenso não pode operar** 

Um Partner suspenso não pode publicar produtos, receber pedidos ou aparecer como parceiro ativo. 

## **RN-PARTNER-09 — Partner inativo não aparece em busca pública** 

Um Partner operacionalmente inativo não deve aparecer como opção ativa na busca pública. 

## **RN-PARTNER-10 — Partner temporariamente fechado pode ser exibido com aviso** 

Um Partner temporariamente fechado pode aparecer publicamente, mas deve exibir aviso claro de indisponibilidade. 

11 

## **RN-PARTNER-11 — Produtos pertencem comercialmente a um** 

## **Partner** 

Todo produto ofertado na plataforma deve estar associado a um Partner. 

## **RN-PARTNER-12 — Partner não decide compatibilidade alimentar** 

O Partner pode declarar informações sobre seus produtos, mas a decisão de compatibilidade alimentar deve pertencer ao domínio alimentar apropriado. 

## **RN-PARTNER-13 — Partner pode receber avaliações** 

Um Partner aprovado e público pode receber avaliações de consumidores, conforme regras do contexto de Avaliações e Confiança. 

## **RN-PARTNER-14 — Partner pode ser denunciado** 

Um Partner pode ser objeto de denúncia quando houver suspeita de informação incorreta, conduta inadequada ou risco ao consumidor. 

## **RN-PARTNER-15 — Alterações críticas podem exigir revisão** 

Determinadas alterações no cadastro do Partner podem exigir nova análise antes de impactar a exibição pública. 

## **11. Casos de Uso de Backend** 

Os casos de uso de backend devem representar ações de negócio. Eles não devem ser pensados como telas, botões ou rotas, mas como operações do domínio. 

## **11.1 Criar Partner** 

## **Objetivo** 

Permitir que um usuário responsável inicie o cadastro de um Partner. 

## **Ator principal** 

Usuário responsável. 

## **Pré-condições** 

O usuário deve estar identificado. 

- 

- O usuário deve possuir permissão para criar um Partner. 

12 

- Os dados mínimos devem ser informados. 

## **Dados necessários** 

- nome comercial; 

- tipo de Partner; 

- descrição, quando disponível; 

- dados de contato; 

- dados de localização ou atendimento, quando aplicável. 

## **Resultado esperado** 

- Partner criado em estado inicial. 

- Partner vinculado ao usuário responsável. 

- Partner ainda não aparece publicamente. 

## **Regras aplicadas** 

- Todo Partner deve ter responsável. 

- Todo Partner deve ter tipo. 

- Todo Partner deve ter nome comercial. 

- Partner recém-criado não deve aparecer publicamente antes de aprovação. 

## **Exceções de negócio** 

- usuário não autorizado; 

- nome comercial ausente; 

- tipo inválido; 

- dados obrigatórios incompletos. 

## **11.2 Atualizar Dados do Partner** 

## **Objetivo** 

Permitir que o responsável atualize dados do Partner. 

## **Ator principal** 

Usuário responsável pelo Partner. 

## **Pré-condições** 

- O Partner deve existir. 

- O usuário deve ter permissão sobre o Partner. 

- O Partner não deve estar bloqueado para edição. 

13 

## **Dados atualizáveis** 

- nome comercial; 

- descrição; 

- contato; 

- endereço; 

- área de atendimento; 

- horários; 

- imagem ou apresentação pública. 

## **Resultado esperado** 

- Dados atualizados. 

- Alterações críticas podem gerar necessidade de nova revisão. 

- Alterações simples podem ser aplicadas diretamente. 

## **Regras aplicadas** 

- Alterações críticas podem exigir revisão. 

- Partner suspenso pode ter edição limitada. 

- O histórico conceitual de alterações relevantes deve ser preservado quando necessário. 

## **Exceções de negócio** 

- Partner inexistente; 

- usuário sem permissão; 

- tentativa de alterar campo protegido; 

- alteração crítica sem submissão para revisão. 

## **11.3 Submeter Partner para Revisão** 

## **Objetivo** 

Permitir que o responsável envie o Partner para análise administrativa. 

## **Ator principal** 

Usuário responsável pelo Partner. 

## **Pré-condições** 

- Partner deve existir. 

- Usuário deve ter permissão. 

- Partner deve possuir dados mínimos completos. 

- Partner deve estar em estado que permita submissão. 

14 

## **Dados mínimos esperados** 

- nome comercial; 

- tipo; 

- contato; 

- descrição ou apresentação mínima; 

- localização ou área de atendimento, quando aplicável. 

## **Resultado esperado** 

- Partner muda para estado pendente de revisão. 

- Administração passa a poder analisar o cadastro. 

## **Regras aplicadas** 

- Partner incompleto não pode ser submetido. 

- Partner já aprovado não deve ser submetido novamente sem alteração crítica. 

- Partner rejeitado pode ser reenviado se a política permitir correção. 

## **Exceções de negócio** 

- dados obrigatórios incompletos; 

- Partner em estado incompatível; 

- usuário sem permissão. 

## **11.4 Aprovar Partner** 

## **Objetivo** 

Permitir que a administração aprove um Partner. 

## **Ator principal** 

Administrador. 

## **Pré-condições** 

- Partner deve existir. 

- Partner deve estar pendente de revisão. 

- Administrador deve possuir permissão. 

## **Resultado esperado** 

- Partner muda para aprovado. 

- Partner pode aparecer publicamente se estiver operacionalmente ativo. 

- Partner pode publicar produtos conforme regras do Catálogo. 

15 

## **Regras aplicadas** 

- Apenas administradores podem aprovar. 

- Apenas Partner pendente deve ser aprovado. 

- Partner aprovado ainda depende do status operacional para aparecer publicamente. 

## **Exceções de negócio** 

- Partner inexistente; 

- Partner não está pendente; 

- usuário sem permissão administrativa. 

## **11.5 Rejeitar Partner** 

## **Objetivo** 

Permitir que a administração rejeite um Partner. 

## **Ator principal** 

Administrador. 

## **Pré-condições** 

- Partner deve existir. 

- Partner deve estar pendente de revisão. 

- Deve haver justificativa ou orientação de rejeição. 

## **Resultado esperado** 

- Partner muda para rejeitado. 

- Motivo da rejeição é registrado. 

- Partner não aparece publicamente. 

- Partner não pode publicar produtos. 

## **Regras aplicadas** 

- Rejeição exige motivo. 

- Partner rejeitado não pode operar. 

- Pode haver possibilidade de correção e nova submissão. 

## **Exceções de negócio** 

- ausência de motivo; 

- Partner inexistente; 

- Partner em estado incompatível; 

- usuário sem permissão. 

16 

## **11.6 Suspender Partner** 

## **Objetivo** 

Permitir que a administração suspenda um Partner por risco, irregularidade ou violação de regras. 

## **Ator principal** 

Administrador. 

## **Pré-condições** 

- Partner deve existir. 

- Administrador deve possuir permissão. 

- Deve haver motivo de suspensão. 

## **Resultado esperado** 

- Partner muda para suspenso. 

- Partner deixa de aparecer como ativo. 

- Partner deixa de publicar produtos. 

- Partner deixa de receber novos pedidos. 

- Produtos associados podem ser ocultados ou sinalizados conforme regras de Catálogo. 

## **Regras aplicadas** 

- Suspensão exige motivo. 

- Partner suspenso não pode operar. 

- Suspensão deve preservar histórico e rastreabilidade. 

## **Exceções de negócio** 

- ausência de motivo; 

- Partner inexistente; 

- usuário sem permissão; 

- tentativa de suspender Partner já suspenso sem nova justificativa. 

- 

## **11.7 Reativar Partner** 

## **Objetivo** 

Permitir que a administração reative um Partner suspenso, quando o motivo da suspensão for resolvido. 

17 

## **Ator principal** 

Administrador. 

## **Pré-condições** 

- Partner deve existir. 

- Partner deve estar suspenso. 

- Administrador deve possuir permissão. 

- Deve haver justificativa de reativação. 

## **Resultado esperado** 

- Partner retorna a um estado operacional permitido. 

- Partner pode voltar a aparecer publicamente, se aprovado e ativo. 

- Produtos podem exigir revisão antes de nova publicação, conforme gravidade da suspensão. 

## **Regras aplicadas** 

- Apenas administração pode reativar Partner suspenso. 

- Reativação exige justificativa. 

- Reativação não deve apagar histórico de suspensão. 

## **Exceções de negócio** 

- Partner não está suspenso; 

- ausência de justificativa; 

- usuário sem permissão. 

## **11.8 Alterar Status Operacional do Partner** 

## **Objetivo** 

Permitir que o responsável ou a administração altere a disponibilidade operacional do Partner. 

## **Ator principal** 

Usuário responsável ou administrador. 

## **Pré-condições** 

- Partner deve existir. 

- Usuário deve possuir permissão. 

- Partner deve estar em estado que permita alteração operacional. 

18 

## **Possíveis alterações** 

- ativo; • inativo; • temporariamente fechado. 

## **Resultado esperado** 

- Status operacional atualizado. • Exibição pública ajustada conforme regras. • Funcionalidades futuras de pedido ou atendimento respeitam o novo status. 

## **Regras aplicadas** 

- Partner inativo não aparece como ativo em busca pública. 

- Partner temporariamente fechado pode aparecer com aviso. 

- Partner suspenso não deve ser reativado operacionalmente por responsável comum. 

## **Exceções de negócio** 

- usuário sem permissão; • Partner suspenso; • status inválido. 

## **11.9 Consultar Partner por Responsável** 

## **Objetivo** 

Permitir que um usuário responsável consulte os dados do seu Partner. 

## **Ator principal** 

Usuário responsável. 

## **Pré-condições** 

- Usuário deve estar identificado. 

- Usuário deve estar vinculado ao Partner. 

## **Resultado esperado** 

- Dados completos do Partner são apresentados ao responsável. 

- Informações administrativas relevantes podem ser exibidas, como status e pendências. 

## **Regras aplicadas** 

- Responsável só pode consultar Partner vinculado a ele. 

19 

• Informações internas da administração podem ser ocultadas, conforme regra de permissão. 

## **Exceções de negócio** 

- Partner inexistente; • usuário sem vínculo; • usuário sem permissão. 

## **11.10 Consultar Partner Público** 

## **Objetivo** 

Permitir que consumidores ou visitantes visualizem dados públicos de um Partner. 

## **Ator principal** 

Consumidor ou visitante. 

## **Pré-condições** 

- Partner deve existir. 

- Partner deve estar aprovado. 

- Partner deve estar operacionalmente apto à exibição pública. 

## **Dados públicos esperados** 

- nome comercial; • descrição; • tipo; 

- localização ou região de atendimento; 

- avaliações públicas; • produtos ativos associados; 

- status de disponibilidade, quando aplicável. 

## **Resultado esperado** 

- O consumidor visualiza a página pública do Partner. 

## **Regras aplicadas** 

- Partner não aprovado não aparece publicamente. 

- Partner suspenso não aparece publicamente como ativo. 

- Partner inativo não aparece em busca pública. 

- Partner temporariamente fechado deve exibir aviso. 

## **Exceções de negócio** 

- Partner inexistente; 

20 

- Partner não público; 

- Partner suspenso; 

- Partner inativo. 

## **11.11 Listar Partners Públicos** 

## **Objetivo** 

Permitir que consumidores encontrem Partners disponíveis na plataforma. 

## **Ator principal** 

Consumidor ou visitante. 

## **Pré-condições** 

- Devem existir Partners aprovados e ativos. 

## **Filtros conceituais possíveis** 

- tipo de Partner; 

- nome; 

- localização; 

- categoria de produtos ofertados; 

- restrições alimentares atendidas indiretamente pelos produtos; 

- avaliação; 

- disponibilidade. 

## **Resultado esperado** 

- Lista de Partners públicos compatíveis com os critérios de busca. 

## **Regras aplicadas** 

- Apenas Partners aprovados e ativos devem aparecer como públicos. 

- Partners temporariamente fechados podem aparecer com aviso. 

- Partners suspensos não devem aparecer como ativos. 

- A compatibilidade alimentar depende dos produtos e não apenas do Partner. 

## **Exceções de negócio** 

- nenhum resultado encontrado; 

- filtros inválidos; 

- critérios incompatíveis. 

21 

## **11.12 Consultar Partners para Administração** 

## **Objetivo** 

Permitir que administradores visualizem Partners em diferentes estados. 

## **Ator principal** 

Administrador. 

## **Pré-condições** 

- Usuário deve possuir permissão administrativa. 

## **Filtros possíveis** 

- status de aprovação; 

- status operacional; 

- tipo de Partner; 

- data de criação; • pendências; • denúncias associadas. 

## **Resultado esperado** 

- Lista administrativa de Partners com dados suficientes para análise e decisão. 

## **Regras aplicadas** 

- Apenas administradores podem consultar visão administrativa. • A listagem administrativa pode incluir Partners não públicos. 

## **Exceções de negócio** 

• usuário sem permissão; • filtros inválidos. 

## **11.13 Verificar se Partner Pode Publicar Produto** 

## **Objetivo** 

Permitir que o domínio informe se determinado Partner está apto a publicar produtos. 

## **Ator principal** 

Sistema, em apoio ao contexto de Catálogo. 

22 

## **Pré-condições** 

- Partner deve existir. 

## **Resultado esperado** 

Retorno indicando se o Partner pode ou não publicar produto. 

## **Regras aplicadas** 

O Partner pode publicar produto se: 

- estiver aprovado; 

- não estiver suspenso; 

- estiver operacionalmente apto; 

- não possuir bloqueios administrativos relevantes. 

## **Exceções de negócio** 

- Partner inexistente; • Partner rejeitado; • Partner pendente; • Partner suspenso; • Partner inativo. 

## **11.14 Verificar se Partner Pode Receber Pedido** 

## **Objetivo** 

Permitir que o domínio informe se determinado Partner está apto a receber novos pedidos. 

## **Ator principal** 

Sistema, em apoio ao contexto de Pedidos. 

## **Pré-condições** 

- Partner deve existir. 

- A funcionalidade de pedidos deve estar disponível. 

## **Resultado esperado** 

Retorno indicando se o Partner pode ou não receber pedido. 

23 

## **Regras aplicadas** 

O Partner pode receber pedido se: 

- estiver aprovado; 

- não estiver suspenso; 

- estiver operacionalmente ativo; 

- não estiver temporariamente fechado; 

- atender às regras operacionais definidas para pedidos. 

## **Exceções de negócio** 

- Partner inexistente; 

- Partner não aprovado; 

- Partner suspenso; 

- Partner inativo; 

- Partner temporariamente fechado. 

## **12. Casos de Uso de Frontend** 

Os casos de uso de frontend devem refletir a jornada do usuário e respeitar as regras do domínio. A interface não deve criar regras próprias que contradigam o backend. 

## **12.1 Criar Cadastro de Partner** 

## **Objetivo da interface** 

Permitir que um usuário responsável preencha os dados iniciais do Partner. 

## **Comportamento esperado** 

A interface deve: 

- apresentar formulário claro; 

- explicar os tipos de Partner; 

- destacar campos obrigatórios; 

- permitir salvar como rascunho, se aplicável; 

- orientar o usuário sobre o processo de revisão; 

- evitar prometer publicação imediata antes da aprovação. 

## **Estados de tela** 

- preenchimento inicial; 

- validação de campos; 

- salvando; 

- cadastro criado; 

24 

- erro de validação; 

- erro de permissão. 

## **Cuidados de UX** 

- explicar a diferença entre estabelecimento, comércio alimentar e produtor independente; 

- deixar claro que dados incorretos podem impedir aprovação; 

- indicar que informações alimentares sensíveis serão tratadas em cadastros de produtos. 

## **12.2 Editar Cadastro de Partner** 

## **Objetivo da interface** 

Permitir que o responsável atualize informações do Partner. 

## **Comportamento esperado** 

A interface deve: 

- carregar dados existentes; 

- indicar status atual do Partner; 

- permitir edição de campos autorizados; 

- alertar quando uma alteração puder exigir nova revisão; 

- impedir edição de campos bloqueados, quando aplicável. 

## **Estados de tela** 

- carregando; 

- edição; 

- salvando; 

- salvo com sucesso; 

- alteração enviada para revisão; 

- erro de validação; 

- erro de permissão. 

## **Cuidados de UX** 

- diferenciar alteração simples de alteração crítica; 

- informar consequências da mudança; 

- não permitir que o usuário interprete Partner suspenso como apenas “inativo”. 

## **12.3 Submeter Partner para Revisão** 

## **Objetivo da interface** 

Permitir que o responsável envie o cadastro para análise. 

25 

## **Comportamento esperado** 

A interface deve: 

- mostrar uma revisão dos dados preenchidos; 

- indicar pendências obrigatórias; 

- impedir submissão se houver dados mínimos ausentes; • pedir confirmação antes do envio; • informar que a publicação depende de aprovação. 

## **Estados de tela** 

- pronto para submissão; 

- pendências encontradas; 

- enviando; • enviado para revisão; • erro na submissão. 

## **Cuidados de UX** 

- apresentar checklist de completude; • explicar que o cadastro ainda não ficará público; • indicar próximos passos após o envio. 

## **12.4 Acompanhar Status do Partner** 

## **Objetivo da interface** 

Permitir que o responsável entenda a situação atual do Partner. 

## **Comportamento esperado** 

A interface deve exibir: 

- status de aprovação; 

- status operacional; 

- pendências; 

- motivo de rejeição, quando houver; 

- motivo de suspensão, quando houver; 

- ações disponíveis para o estado atual. 

## **Estados possíveis** 

- rascunho; 

- pendente de revisão; 

- aprovado; 

- rejeitado; 

- suspenso; 

26 

- ativo; 

- inativo; 

- temporariamente fechado. 

## **Cuidados de UX** 

- usar mensagens claras; 

- evitar termos técnicos; 

- orientar o usuário sobre o que fazer em caso de rejeição; 

- deixar evidente quando o Partner não está visível publicamente. 

## **12.5 Visualizar Partner Público** 

## **Objetivo da interface** 

Permitir que consumidores ou visitantes conheçam um Partner. 

## **Comportamento esperado** 

A interface deve apresentar: 

- nome comercial; 

- tipo de Partner; 

- descrição; 

- localização ou região de atendimento; 

- disponibilidade; 

- avaliações; 

- produtos ativos; 

- avisos de indisponibilidade, quando houver. 

## **Estados de tela** 

- carregando; 

- Partner encontrado; 

- Partner indisponível; 

- Partner temporariamente fechado; 

- Partner não encontrado. 

## **Cuidados de UX** 

- não exibir Partner suspenso como opção ativa; 

- deixar claro quando o Partner está temporariamente fechado; 

- evitar transmitir confiança indevida sobre produtos sem dados alimentares completos; 

- não confundir avaliação do Partner com compatibilidade alimentar dos produtos. 

27 

## **12.6 Listar Partners Públicos** 

## **Objetivo da interface** 

Permitir que consumidores descubram fornecedores disponíveis. 

## **Comportamento esperado** 

A interface deve permitir: 

- busca por nome; 

- filtro por tipo de Partner; 

- filtro por localização; 

- ordenação por critérios disponíveis; 

- visualização resumida de cada Partner; 

- acesso ao detalhe público. 

## **Estados de tela** 

- carregando; 

- lista com resultados; 

- lista vazia; 

- erro de busca; 

- filtros aplicados. 

## **Cuidados de UX** 

- indicar claramente filtros ativos; 

- explicar ausência de resultados; 

- não assumir que um Partner é compatível com o perfil alimentar do consumidor apenas pelo tipo; 

- compatibilidade deve ser derivada dos produtos e informações alimentares. 

## **12.7 Painel do Partner** 

## **Objetivo da interface** 

Permitir que o responsável gerencie o Partner. 

## **Comportamento esperado** 

O painel deve exibir: 

- resumo do Partner; 

- status de aprovação; 

- status operacional; 

- pendências; 

28 

- ações disponíveis; 

- acesso ao cadastro de produtos; 

- alertas administrativos; 

- avaliações e denúncias, quando aplicável. 

## **Cuidados de UX** 

- priorizar pendências que impedem publicação; 

- deixar claro o que depende de aprovação; 

- separar dados do Partner de dados dos produtos; 

- não misturar regras alimentares críticas com simples cadastro comercial. 

## **12.8 Visão Administrativa de Partners** 

## **Objetivo da interface** 

Permitir que administradores gerenciem Partners. 

## **Comportamento esperado** 

A interface deve permitir: 

- listar Partners por status; 

- visualizar detalhes administrativos; 

- aprovar Partner; 

- rejeitar Partner; 

- suspender Partner; 

- reativar Partner; 

- consultar pendências; 

- registrar justificativas. 

## **Estados de tela** 

- lista de pendentes; 

- análise de cadastro; 

- decisão administrativa; 

- confirmação de ação; 

- ação concluída; 

- erro de permissão. 

## **Cuidados de UX** 

- exigir motivo em rejeição e suspensão; 

- pedir confirmação para ações críticas; 

- diferenciar rejeição de suspensão; 

- manter clareza sobre impacto da decisão. 

29 

## **13. Fluxos Principais** 

## **13.1 Fluxo de Criação e Aprovação de Partner** 

1. Usuário inicia cadastro de Partner. 

2. Sistema cria Partner em rascunho. 

3. Usuário completa dados obrigatórios. 

4. Usuário submete para revisão. 

5. Sistema muda status para pendente. 

6. Administrador analisa. 

7. Administrador aprova ou rejeita. 

8. Se aprovado, Partner pode aparecer publicamente quando ativo. 

9. Se rejeitado, responsável visualiza motivo e pode corrigir, se permitido. 

## **13.2 Fluxo de Suspensão de Partner** 

1. Administrador identifica problema. 

2. Administrador acessa Partner. 

3. Administrador informa motivo da suspensão. 

4. Sistema suspende Partner. 

5. Partner deixa de operar. 

6. Produtos associados podem ser ocultados ou sinalizados. 

7. Responsável visualiza status e motivo. 

8. Administração pode reativar após resolução. 

## **13.3 Fluxo de Consulta Pública de Partner** 

1. Consumidor acessa busca ou listagem. 

2. Sistema retorna apenas Partners públicos elegíveis. 

3. Consumidor seleciona Partner. 

4. Sistema exibe dados públicos. 

5. Produtos ativos associados podem ser exibidos. 

6. Alertas de disponibilidade são apresentados quando necessário. 

## **13.4 Fluxo de Alteração Crítica** 

1. Responsável altera dado sensível do Partner. 

2. Sistema identifica que a alteração é crítica. 

3. Sistema informa que a alteração pode exigir revisão. 

4. Alteração é salva como pendente ou bloqueada até aprovação. 

5. Administração analisa. 

6. Alteração é aprovada ou rejeitada. 

7. Exibição pública é atualizada conforme decisão. 

30 

## **14. Orientações de Modelagem para Backend** 

## **14.1 Separar regra de negócio de entrada de dados** 

O backend deve tratar Partner como conceito de domínio, não apenas como cadastro. 

Isso significa que ações como aprovar, rejeitar, suspender e submeter para revisão devem ser modeladas como comportamentos de negócio, não como simples alteração manual de campos. 

## **14.2 Proteger transições de estado** 

As mudanças de status do Partner devem respeitar regras de transição. 

Exemplos: 

- rascunho pode ir para pendente; 

- pendente pode ir para aprovado; 

- pendente pode ir para rejeitado; 

- aprovado pode ir para suspenso; 

- suspenso pode ser reativado por decisão administrativa; 

- rejeitado pode voltar para rascunho ou pendente, conforme regra de correção. 

A equipe deve evitar permitir mudanças arbitrárias de status. 

## **14.3 Manter Partner separado de Product** 

O backend deve evitar que o agregado Partner carregue internamente todos os produtos como parte obrigatória do mesmo agregado. 

Produtos devem referenciar Partner, mas o ciclo de vida do produto deve ser tratado em contexto próprio. 

## **14.4 Validar permissões por intenção de uso** 

A autorização deve considerar a intenção de uso. 

Exemplos: 

- consultar Partner público; 

- editar Partner próprio; 

- aprovar Partner; 

- suspender Partner; 

- listar Partners administrativos. 

Cada ação exige uma interpretação diferente de permissão. 

## **14.5 Usar linguagem do domínio** 

Os nomes dos casos de uso e regras devem refletir o vocabulário do negócio. 

31 

Exemplos adequados: 

- criar Partner; • submeter Partner para revisão; 

- aprovar Partner; 

- rejeitar Partner; • suspender Partner; 

- reativar Partner; 

- alterar status operacional; • consultar Partner público. 

Evitar nomes que reduzam o domínio a operações genéricas sem significado de negócio. 

## **15. Orientações de Modelagem para Frontend** 

## **15.1 Interface deve refletir estados do domínio** 

O frontend deve exibir claramente o estado do Partner. 

O usuário responsável precisa entender se o Partner está: 

- em rascunho; • pendente; • aprovado; • rejeitado; • suspenso; • ativo; • inativo; 

- temporariamente fechado. 

## **15.2 Ações devem depender do estado** 

A interface não deve oferecer ações incompatíveis com o estado atual. 

Exemplos: 

- Partner pendente não deve exibir ação de “enviar para revisão” novamente; 

- Partner suspenso não deve exibir ação comum de ativação para o responsável; 

- Partner rejeitado deve exibir possibilidade de correção apenas se essa regra existir; • Partner aprovado pode permitir gestão operacional. 

## **15.3 Frontend não deve decidir regra crítica sozinho** 

A interface pode orientar, bloquear visualmente e melhorar a experiência, mas a decisão final de regras críticas deve vir do domínio. 

32 

Exemplos: 

- se Partner pode publicar produto; 

- se Partner pode receber pedido; 

- se Partner pode aparecer publicamente; 

- se alteração exige revisão. 

## **15.4 Diferenciar dados do Partner e dados dos Produtos** 

A interface deve evitar misturar cadastro comercial do Partner com informações alimentares específicas dos produtos. 

Partner responde por: 

- identidade comercial; 

- contato; 

- localização; 

- status; 

- apresentação pública. 

Produto responde por: 

- ingredientes; 

- restrições; 

- classificação alimentar; 

- compatibilidade; 

- preço; 

- disponibilidade do item. 

## **15.5 Exibir mensagens orientativas** 

Como o CeliLac envolve confiança e segurança alimentar, a interface deve orientar os responsáveis. 

Exemplos de mensagens: 

- “Seu cadastro ainda está em rascunho e não aparece para consumidores.” 

- “Seu cadastro foi enviado para revisão.” 

- “Seu Partner foi aprovado e pode aparecer publicamente quando estiver ativo.” 

- “Seu Partner foi rejeitado. Verifique o motivo e corrija os dados.” 

- “Seu Partner está suspenso. Algumas funcionalidades estão bloqueadas.” 

- “Esta alteração pode exigir nova revisão administrativa.” 

33 

## **16. Critérios de Aceite por Caso de Uso** 

## **16.1 Criar Partner** 

O caso de uso será aceito quando: 

- um usuário responsável conseguir criar Partner com dados mínimos; 

- Partner for criado vinculado ao responsável; 

- Partner não aparecer publicamente antes de aprovação; 

- dados obrigatórios forem validados; 

- tipo de Partner for obrigatório. 

## **16.2 Submeter Partner para Revisão** 

O caso de uso será aceito quando: 

- Partner completo puder ser submetido; 

- Partner incompleto for impedido; 

- status mudar para pendente; 

- responsável visualizar que aguarda análise. 

## **16.3 Aprovar Partner** 

O caso de uso será aceito quando: 

- apenas administrador conseguir aprovar; 

- Partner pendente mudar para aprovado; 

- Partner aprovado e ativo puder aparecer publicamente; 

- a decisão ficar registrada conceitualmente. 

## **16.4 Rejeitar Partner** 

O caso de uso será aceito quando: 

- apenas administrador conseguir rejeitar; 

- rejeição exigir motivo; 

- Partner rejeitado não aparecer publicamente; 

- responsável conseguir visualizar motivo ou orientação. 

## **16.5 Suspender Partner** 

O caso de uso será aceito quando: 

- apenas administrador conseguir suspender; 

- suspensão exigir motivo; 

- Partner suspenso deixar de operar; 

- Partner suspenso não aparecer como ativo publicamente. 

34 

## **16.6 Consultar Partner Público** 

O caso de uso será aceito quando: 

- consumidores conseguirem visualizar Partners aprovados e ativos; 

- Partners não aprovados não forem exibidos; 

- Partners suspensos não forem exibidos como ativos; 

- Partner temporariamente fechado exibir aviso. 

## **16.7 Verificar se Partner Pode Publicar Produto** 

O caso de uso será aceito quando: 

- Partner aprovado e ativo for considerado apto; 

- Partner pendente for considerado inapto; 

- Partner rejeitado for considerado inapto; 

- Partner suspenso for considerado inapto; 

- Partner inativo for considerado inapto. 

## **17. Decisões de Domínio Recomendadas** 

## **17.1 Partner deve ser agregado próprio** 

Partner deve ter ciclo de vida próprio e não deve ser tratado apenas como extensão de User. 

## **17.2 Product deve ser agregado separado** 

Produto pertence comercialmente a Partner, mas deve ter ciclo de vida próprio. 

## **17.3 Compatibilidade alimentar não pertence a Partner** 

Partner pode fornecer produtos, mas a regra de compatibilidade alimentar deve estar em contexto próprio. 

## **17.4 Partner aprovado não significa produto seguro** 

A aprovação do Partner indica que o fornecedor foi aceito na plataforma. Isso não significa que todos os seus produtos sejam automaticamente compatíveis com todos os consumidores. 

## **17.5 Partner ativo não significa produto disponível** 

Partner ativo significa que o fornecedor pode operar. A disponibilidade de cada produto deve ser tratada no contexto de Catálogo. 

35 

## **17.6 Suspensão de Partner deve impactar a operação** 

Partner suspenso não deve aparecer como ativo, publicar produtos ou receber pedidos. 

## **18. Glossário do Domínio** 

## **Partner** 

Fornecedor alimentar cadastrado na plataforma. 

## **Usuário responsável** 

Usuário que possui permissão para gerenciar um Partner. 

## **Estabelecimento alimentício** 

Partner que prepara ou vende alimentos prontos ou sob demanda. 

## **Comércio alimentar** 

Partner que comercializa produtos alimentares, geralmente de terceiros ou embalados. 

## **Produtor independente** 

Partner que produz alimentos especializados, artesanais ou locais. 

## **Status de aprovação** 

Estado que representa a validação administrativa do Partner. 

## **Status operacional** 

Estado que representa a disponibilidade prática do Partner. 

## **Rascunho** 

Partner iniciado, mas ainda não submetido. 

## **Pendente de revisão** 

Partner enviado para análise administrativa. 

## **Aprovado** 

Partner validado pela plataforma. 

36 

## **Rejeitado** 

Partner não aceito após análise. 

## **Suspenso** 

Partner bloqueado pela administração. 

## **Ativo** 

Partner operacionalmente disponível. 

## **Inativo** 

Partner desativado ou indisponível. 

## **Temporariamente fechado** 

Partner temporariamente indisponível, mas não necessariamente removido da exibição pública. 

## **19. Resumo para a Equipe** 

Partner é o agregado responsável por representar fornecedores alimentares dentro do CeliLac. 

Ele deve ser modelado separadamente de User, Product, Order, Payment e Compatibility. 

O Partner possui tipo, responsável, dados comerciais, status de aprovação e status operacional. Seu ciclo de vida envolve criação, edição, submissão para revisão, aprovação, rejeição, suspensão, reativação, ativação e inativação. 

Para backend, o foco deve estar em proteger invariantes, controlar transições de estado, separar responsabilidades entre contextos e impedir que Partner assuma regras de produto ou compatibilidade alimentar. 

Para frontend, o foco deve estar em representar com clareza os estados do Partner, orientar o responsável durante o cadastro, impedir ações incompatíveis com o estado atual e separar visualmente informações comerciais do Partner das informações alimentares dos produtos. 

A implementação deve preservar a seguinte ideia central: 

Partner é o fornecedor alimentar da plataforma. User é quem acessa o sistema. Product é o item ofertado. Compatibility é a análise alimentar. Order é a transação futura. Admin é o papel de governança. 

37 

Esses conceitos não devem ser misturados. 

38 

