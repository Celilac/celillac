# **Análise de Usuário Consumidor no CeliLac** 

## **Orientação de DDD e Casos de Uso para Backend e Frontend** 

## **1. Objetivo do Documento** 

Este documento define como o usuário consumidor deve ser compreendido no domínio do CeliLac, com foco na pessoa que utiliza a plataforma para encontrar produtos alimentares adequados às suas necessidades alimentares específicas. 

O objetivo é orientar as equipes de backend e frontend na implementação das funcionalidades relacionadas ao consumidor, seu perfil alimentar, suas restrições, suas preferências, sua jornada de busca e sua interação com produtos, parceiros, avaliações e pedidos futuros. 

Este documento não trata de tecnologias, bibliotecas, frameworks ou detalhes técnicos de implementação. O foco está na modelagem de domínio, nas responsabilidades, nas regras de negócio, nos casos de uso e nas experiências que devem ser respeitadas pelo sistema. 

# **2. Terminologia Recomendada** 

Embora seja comum usar a expressão “pessoa com necessidades especiais”, no contexto do CeliLac recomenda-se usar uma terminologia mais precisa: 

### **pessoa com necessidades alimentares específicas** 

ou 

### **consumidor com restrições alimentares** 

Isso evita confusão com deficiência, acessibilidade física ou outros tipos de necessidades especiais que não fazem parte do núcleo inicial do produto. 

No CeliLac, esse consumidor pode ter: 

- doença celíaca; 

- intolerância à lactose; 

- alergias alimentares; 

- restrição a açúcar; 

- restrição a carboidratos; 

- dieta vegetariana; 

- dieta vegana; 

- restrições médicas; 

- preferências alimentares; 

- necessidade de evitar contaminação cruzada; 

- outras restrições associadas à alimentação. 

1 

# **3. Definição de Usuário Consumidor** 

No CeliLac, o **Usuário Consumidor** é a pessoa que acessa a plataforma para encontrar, avaliar, salvar, comparar ou futuramente comprar produtos alimentares adequados ao seu perfil alimentar. 

Ele é o principal beneficiário da proposta da plataforma. 

O consumidor não busca apenas alimentos por preço, localização ou categoria. Ele busca segurança, confiança, clareza e compatibilidade com suas necessidades alimentares. 

## **Definição resumida** 

Usuário Consumidor é a pessoa cadastrada na plataforma que possui ou informa necessidades alimentares específicas e utiliza o CeliLac para encontrar produtos e parceiros compatíveis com seu perfil alimentar. 

# **4. Diferença entre User, Consumer e Food Profile** 

É importante separar três conceitos: 

- User; • Consumer; • Food Profile. 

Eles não devem ser tratados como a mesma coisa. 

## **4.1 User** 

User representa a identidade de acesso ao sistema. 

Responsabilidades principais: 

- identificar a pessoa; 

- permitir autenticação; 

- permitir controle de acesso; 

- armazenar dados básicos de conta; 

- representar o usuário perante a plataforma. 

Exemplos de dados associados ao User: 

- nome; 

- e-mail; 

- telefone; 

- status da conta; 

- papéis de acesso. 

2 

O User responde à pergunta: 

### **Quem acessa o sistema?** 

## **4.2 Consumer** 

Consumer representa o papel da pessoa como consumidora dentro do CeliLac. 

Responsabilidades principais: 

- representar a pessoa enquanto usuária dos serviços de busca e consumo; • manter preferências gerais de experiência; 

- permitir relação com favoritos, avaliações, denúncias e pedidos futuros; • relacionar-se com um perfil alimentar. 

O Consumer responde à pergunta: 

### **Como essa pessoa participa do ecossistema CeliLac enquanto consumidora?** 

## **4.3 Food Profile** 

Food Profile representa as necessidades alimentares específicas do consumidor. 

Responsabilidades principais: 

- armazenar restrições; 

- armazenar intolerâncias; 

- armazenar alergias; 

- 

- armazenar preferências alimentares; 

- indicar severidade ou nível de risco; 

- 

- apoiar análise de compatibilidade; • orientar alertas e filtros. 

O Food Profile responde à pergunta: 

### **Quais cuidados alimentares essa pessoa precisa que o sistema considere?** 

# **5. Relação entre User, Consumer e Food Profile** 

A modelagem deve preservar a separação entre identidade, papel de consumidor e perfil alimentar. 

Uma forma conceitual adequada é: 

- um User pode possuir um perfil de Consumer; • um Consumer pode possuir um Food Profile; 

3 

• um Food Profile pode conter várias restrições alimentares. 

No MVP, a estrutura pode ser simplificada, mas a separação conceitual deve ser mantida. 

## **Relação conceitual** 

User representa acesso. Consumer representa atuação como consumidor. Food Profile representa necessidades alimentares. 

Essa separação evita que regras de alimentação fiquem misturadas com autenticação ou dados básicos da conta. 

# **6. Consumer como Agregado de Domínio** 

O Consumer pode ser tratado como agregado próprio ou como parte de um contexto de consumidores, dependendo da profundidade escolhida para o MVP. 

Para o CeliLac, recomenda-se tratar o Consumer como um agregado relevante, pois ele concentra comportamentos próprios da jornada do consumidor. 

## **6.1 Raiz do Agregado** 

A raiz do agregado pode ser: 

### **Consumer** 

## **6.2 Responsabilidades do Agregado Consumer** 

O agregado Consumer deve ser responsável por: 

- representar o consumidor dentro da plataforma; 

- vincular o consumidor a um usuário de acesso; 

- controlar se o consumidor possui perfil alimentar configurado; 

- permitir atualização de preferências gerais; 

- permitir vínculo com favoritos; 

- permitir vínculo com avaliações e denúncias; 

- permitir vínculo futuro com pedidos. 

## **6.3 O que não deve pertencer ao Agregado Consumer** 

Não devem ser responsabilidades diretas do Consumer: 

- autenticação; 

- aprovação de parceiros; 

- cadastro de produtos; 

- regras internas de produto; 

4 

- cálculo detalhado de compatibilidade alimentar; 

- processamento de pedido; 

- processamento de pagamento. 

O Consumer usa essas partes do sistema, mas não deve controlar suas regras internas. 

# **7. Food Profile como Conceito Central** 

Embora o consumidor seja importante, o grande diferencial do CeliLac está no **Food Profile** . 

O Food Profile é o elemento que permite personalizar a experiência do consumidor. 

Sem ele, o CeliLac se aproxima de um catálogo comum. Com ele, a plataforma consegue filtrar, alertar, recomendar e orientar decisões com base em necessidades alimentares específicas. 

## **7.1 Responsabilidades do Food Profile** 

O Food Profile deve ser responsável por: 

- registrar restrições alimentares; 

- registrar alergias; 

- registrar intolerâncias; 

- registrar preferências; 

- registrar nível de severidade; 

- indicar se o consumidor aceita ou não risco de contaminação cruzada; 

- apoiar a busca por produtos; 

- apoiar a exibição de alertas; 

- apoiar a análise de compatibilidade. 

## **7.2 Tipos de Necessidade Alimentar** 

O sistema deve diferenciar os tipos de necessidade alimentar. 

Exemplos: 

- alergia; 

- intolerância; 

- restrição médica; 

- preferência alimentar; 

- estilo de vida alimentar. 

Essa diferenciação é importante porque nem toda restrição tem o mesmo nível de risco. 

Uma preferência alimentar pode ser flexível. 

Uma alergia pode representar risco grave. 

A doença celíaca pode exigir cuidado especial com contaminação cruzada. 

A intolerância pode variar em severidade de pessoa para pessoa. 

5 

# **8. Contextos Delimitados Relacionados ao Consumidor** 

O consumidor se relaciona com diferentes contextos do CeliLac. 

## **8.1 Identidade e Acesso** 

Responsável por identificar quem é o usuário. 

Esse contexto responde por: 

- login; • conta; 

- autenticação; • papéis; • status de acesso. 

Não deve conter regra alimentar. 

## **8.2 Gestão de Consumidores** 

Responsável por representar o consumidor como participante da plataforma. 

Esse contexto responde por: 

- criação do perfil de consumidor; 

- 

- preferências gerais; 

- dados básicos da jornada de consumo; 

- vínculo com favoritos, avaliações, denúncias e pedidos futuros. 

- 

## **8.3 Perfil Alimentar** 

Responsável por representar restrições, alergias, intolerâncias e preferências alimentares. 

Esse contexto responde por: 

- cadastro de restrições; 

- classificação da necessidade alimentar; 

- 

- severidade; 

- 

- tolerância a riscos; 

- 

- atualização do perfil alimentar; 

- 

- preparação de dados para compatibilidade. 

- 

6 

## **8.4 Compatibilidade Alimentar** 

Responsável por analisar a relação entre o perfil alimentar do consumidor e os produtos cadastrados. 

Esse contexto responde por: 

- compatível; • atenção; • incompatível; • indeterminado. 

O consumidor informa suas necessidades. 

A compatibilidade interpreta essas necessidades em relação aos produtos. 

## **8.5 Catálogo e Busca** 

Responsável por permitir que o consumidor descubra produtos e parceiros. 

Esse contexto responde por: 

- busca por texto; • filtros; 

- listagem de produtos; 

- listagem de parceiros; 

- exibição de resultados; 

- ordenação. 

## **8.6 Avaliações e Confiança** 

Responsável por permitir que o consumidor avalie, denuncie e contribua para a confiabilidade da plataforma. 

Esse contexto responde por: 

- avaliação de produto; 

- avaliação de parceiro; 

- denúncia de informação incorreta; 

- denúncia de risco alimentar; 

- reputação. 

## **8.7 Pedidos** 

Contexto futuro responsável por compras. 

7 

Esse contexto responderá por: 

- carrinho; • criação de pedido; • acompanhamento; • histórico; • cancelamento. 

# **9. Dados Conceituais do Consumidor** 

## **9.1 Dados de Identificação** 

Esses dados pertencem mais diretamente ao User. 

Exemplos: 

- identificador; • nome; • e-mail; • telefone; • status da conta. 

## **9.2 Dados do Consumer** 

Esses dados representam o papel de consumidor. 

Exemplos: 

- identificador do consumidor; 

- 

- vínculo com User; 

- preferências gerais de experiência; 

- data de criação; 

- data de atualização; 

- indicação se perfil alimentar está completo; • configurações de exibição de alertas, se aplicável. 

## **9.3 Dados do Food Profile** 

Esses dados representam necessidades alimentares. 

Exemplos: 

- restrições alimentares; • alergias; 

- intolerâncias; 

8 

- preferências alimentares; 

- severidade; 

- observações; 

- tolerância ou não a risco de contaminação cruzada; 

- restrições críticas; 

- data da última atualização. 

# **10. Estados Relevantes do Consumidor** 

O Consumer pode possuir estados relacionados à experiência na plataforma. 

## **10.1 Conta Criada** 

O usuário criou acesso, mas ainda não configurou perfil alimentar. 

## **10.2 Perfil Alimentar Incompleto** 

O consumidor iniciou configuração alimentar, mas ainda não possui dados suficientes para personalização confiável. 

## **10.3 Perfil Alimentar Configurado** 

O consumidor possui restrições e preferências mínimas definidas. 

## **10.4 Perfil Alimentar Crítico** 

O consumidor possui uma ou mais restrições de alto risco, como alergias severas ou doença celíaca com necessidade de evitar contaminação cruzada. 

## **10.5 Consumidor Ativo** 

O consumidor usa a plataforma para buscar, visualizar, favoritar, avaliar ou comprar produtos. 

## **10.6 Consumidor Inativo** 

O consumidor possui conta, mas não utiliza ou desativou sua participação. 

# **11. Invariantes do Domínio do Consumidor** 

## **11.1 Invariante de Identidade** 

Todo Consumer deve estar associado a um User. 

O consumidor não deve existir isoladamente sem identidade de acesso. 

9 

## **11.2 Invariante de Perfil Alimentar** 

Um Food Profile deve pertencer a um Consumer. 

Não deve existir perfil alimentar sem consumidor. 

## **11.3 Invariante de Restrição Válida** 

Toda restrição associada ao Food Profile deve ser reconhecida pelo domínio. 

O sistema não deve aceitar restrições completamente livres sem categorização mínima. 

## **11.4 Invariante de Severidade** 

Quando uma restrição for classificada como crítica, o sistema deve tratá-la com maior rigor na exibição de alertas. 

## **11.5 Invariante de Contaminação Cruzada** 

Quando o consumidor indicar que não aceita risco de contaminação cruzada, produtos com “pode conter” ou risco declarado devem gerar alerta forte ou incompatibilidade, conforme política de domínio. 

## **11.6 Invariante de Informação Insuficiente** 

Quando o sistema não possuir dados suficientes para avaliar um produto em relação ao perfil alimentar, não deve apresentá-lo como seguro. 

Nesse caso, o resultado deve ser tratado como indeterminado ou exigir atenção. 

# **12. Regras de Negócio do Consumidor** 

## **RN-CONSUMER-01 — Consumer representa pessoa consumidora** 

Consumer representa uma pessoa que usa a plataforma para encontrar produtos alimentares adequados. 

## **RN-CONSUMER-02 — Consumer deve estar vinculado a User** 

Todo Consumer deve estar vinculado a uma identidade de acesso. 

## **RN-CONSUMER-03 — Consumer pode ter múltiplas restrições** 

Um consumidor pode possuir várias restrições alimentares simultaneamente. 

10 

Exemplo: 

Uma mesma pessoa pode ser celíaca, intolerante à lactose e vegetariana. 

## **RN-CONSUMER-04 — Restrição e preferência são diferentes** 

O sistema deve diferenciar restrição alimentar de preferência alimentar. 

Exemplo: 

Evitar lactose por intolerância não é equivalente a preferir evitar lactose. 

## **RN-CONSUMER-05 — Alergia deve ser tratada como condição** 

## **crítica** 

Quando uma necessidade alimentar for marcada como alergia, os alertas devem ser mais rigorosos. 

## **RN-CONSUMER-06 — Doença celíaca exige atenção à contaminação cruzada** 

Quando o consumidor declarar doença celíaca, o sistema deve considerar risco de contaminação cruzada como informação crítica. 

## **RN-CONSUMER-07 — Perfil incompleto não deve gerar falsa segurança** 

Se o consumidor não configurou perfil alimentar completo, o sistema não deve afirmar que um produto é plenamente seguro para ele. 

## **RN-CONSUMER-08 — Produto sem informação suficiente não deve ser exibido como seguro** 

A ausência de informação alimentar não deve ser interpretada como compatibilidade. 

## **RN-CONSUMER-09 — Consumidor pode alterar o perfil alimentar** 

O consumidor deve poder atualizar suas restrições e preferências quando necessário. 

## **RN-CONSUMER-10 — Alterações no perfil impactam buscas futuras** 

Alterações no Food Profile devem impactar novas buscas, alertas e análises de compatibilidade. 

11 

## **RN-CONSUMER-11 — Histórico futuro deve preservar contexto** 

Em funcionalidades futuras de pedido, o sistema deve preservar as informações alimentares consideradas no momento da compra. 

## **RN-CONSUMER-12 — Consumidor pode favoritar produtos e parceiros** 

O consumidor pode salvar produtos e parceiros para consulta posterior. 

## **RN-CONSUMER-13 — Consumidor pode avaliar produtos e parceiros** 

O consumidor pode contribuir com reputação da plataforma por meio de avaliações. 

## **RN-CONSUMER-14 — Consumidor pode denunciar informações alimentares** 

O consumidor pode denunciar produtos ou parceiros quando identificar risco ou inconsistência. 

## **RN-CONSUMER-15 — Denúncia alimentar deve ter prioridade** 

Denúncias relacionadas à segurança alimentar devem ser tratadas como mais críticas que reclamações comuns. 

# **13. Casos de Uso de Backend** 

Os casos de uso de backend devem representar ações de negócio relacionadas ao consumidor e seu perfil alimentar. 

## **13.1 Criar Consumer** 

## **Objetivo** 

Criar o perfil de consumidor associado a um usuário. 

## **Ator principal** 

Usuário. 

## **Pré-condições** 

- O usuário deve existir. 

12 

- O usuário deve possuir permissão para atuar como consumidor. • Ainda não deve existir Consumer duplicado para o mesmo usuário, se essa for a regra do MVP. 

## **Resultado esperado** 

- Consumer criado. • Consumer associado ao User. • Food Profile pode ser iniciado posteriormente. 

## **Regras aplicadas** 

- Consumer deve estar vinculado a User. 

- Consumer não deve ser confundido com Partner. • Consumer não deve possuir permissões administrativas por padrão. 

## **Exceções de negócio** 

- usuário inexistente; • usuário já possui Consumer; • usuário sem permissão; • dados mínimos ausentes. 

## **13.2 Consultar Dados do Consumer** 

## **Objetivo** 

Permitir que o consumidor consulte seus dados de perfil. 

## **Ator principal** 

Consumidor. 

## **Pré-condições** 

- Consumidor deve estar identificado. 

- Consumer deve existir. 

## **Resultado esperado** 

- Dados do Consumer são retornados. 

- Estado do perfil alimentar é informado. • Pendências de configuração podem ser indicadas. 

## **Regras aplicadas** 

- Consumidor só deve consultar seus próprios dados. • Dados sensíveis devem ser protegidos. 

- Perfil alimentar deve ser exibido com clareza. 

13 

## **Exceções de negócio** 

- Consumer inexistente; 

- usuário sem permissão; 

- tentativa de consultar dados de outro consumidor. 

## **13.3 Atualizar Dados do Consumer** 

## **Objetivo** 

Permitir que o consumidor atualize preferências gerais de uso. 

## **Ator principal** 

Consumidor. 

## **Pré-condições** 

- Consumer deve existir. 

- Consumidor deve ter permissão sobre o próprio perfil. 

## **Dados atualizáveis** 

- preferências gerais; 

- configurações de notificação; 

- preferências de exibição; 

- dados não críticos associados à experiência. 

## **Resultado esperado** 

- Dados atualizados. 

- Preferências passam a ser consideradas nas próximas interações. 

## **Regras aplicadas** 

- Consumidor só atualiza seus próprios dados. 

- Alterações de Food Profile devem ser tratadas em caso de uso próprio. 

## **Exceções de negócio** 

- usuário sem permissão; 

- dados inválidos; 

- Consumer inexistente. 

14 

## **13.4 Criar Food Profile** 

## **Objetivo** 

Criar o perfil alimentar do consumidor. 

## **Ator principal** 

Consumidor. 

## **Pré-condições** 

- Consumer deve existir. • Consumer ainda não deve possuir Food Profile ativo, se essa for a regra adotada. 

## **Resultado esperado** 

• Food Profile criado. • Consumidor pode adicionar restrições, intolerâncias, alergias e preferências. 

## **Regras aplicadas** 

- Food Profile deve pertencer a Consumer. • Perfil alimentar vazio não deve gerar compatibilidade segura. • Food Profile deve poder evoluir ao longo do tempo. 

## **Exceções de negócio** 

- Consumer inexistente; • Food Profile já existente; 

- usuário sem permissão. 

## **13.5 Atualizar Food Profile** 

## **Objetivo** 

Permitir que o consumidor altere seu perfil alimentar. 

## **Ator principal** 

Consumidor. 

## **Pré-condições** 

- Consumer deve existir. • Food Profile deve existir. 

15 

• Consumidor deve ter permissão. 

## **Resultado esperado** 

- Perfil alimentar atualizado. 

• Buscas futuras e alertas passam a considerar as alterações. • Sistema pode indicar necessidade de revisar favoritos ou pedidos futuros. 

## **Regras aplicadas** 

- Consumidor pode alterar restrições. 

- Alterações impactam compatibilidade futura. • O sistema deve evitar falsa segurança em perfis incompletos. 

## **Exceções de negócio** 

- Food Profile inexistente; • restrição inválida; • usuário sem permissão. 

## **13.6 Adicionar Restrição Alimentar ao Perfil** 

## **Objetivo** 

Permitir que o consumidor adicione uma restrição ao seu Food Profile. 

## **Ator principal** 

Consumidor. 

## **Pré-condições** 

- Food Profile deve existir. 

- Restrição deve ser reconhecida pelo domínio. 

## **Dados necessários** 

- tipo de necessidade alimentar; 

- restrição; 

- severidade; 

- observação, quando aplicável; 

- aceitação ou não de risco de contaminação cruzada, quando aplicável. 

## **Resultado esperado** 

- Restrição adicionada ao perfil. 

- Sistema passa a considerar essa restrição em buscas e alertas. 

16 

## **Regras aplicadas** 

- Consumidor pode possuir múltiplas restrições. • Restrição crítica deve gerar alertas mais rigorosos. 

- Restrições duplicadas devem ser evitadas. 

## **Exceções de negócio** 

- restrição inexistente; 

- restrição duplicada; 

- severidade inválida; 

- usuário sem permissão. 

## **13.7 Remover Restrição Alimentar do Perfil** 

## **Objetivo** 

Permitir que o consumidor remova uma restrição do seu Food Profile. 

## **Ator principal** 

Consumidor. 

## **Pré-condições** 

- Food Profile deve existir. 

- Restrição deve estar associada ao perfil. 

## **Resultado esperado** 

- Restrição removida. 

- Buscas e alertas futuros deixam de considerar essa restrição. 

## **Regras aplicadas** 

- Consumidor pode atualizar o perfil alimentar. 

- Remoção pode impactar compatibilidade futura. 

- O sistema pode alertar que a alteração modifica recomendações e avisos. 

## **Exceções de negócio** 

- restrição não encontrada no perfil; 

- usuário sem permissão; 

- Food Profile inexistente. 

- 

17 

## **13.8 Consultar Compatibilidade de Produto para Consumer** 

## **Objetivo** 

Permitir verificar a compatibilidade entre um produto e o perfil alimentar do consumidor. 

## **Ator principal** 

Consumidor ou sistema em apoio à busca. 

## **Pré-condições** 

- Produto deve existir. 

- Consumer deve existir. 

- Food Profile deve existir ou o sistema deve tratar ausência de perfil. 

## **Resultado esperado** 

O sistema deve retornar uma das classificações: 

- compatível; 

- atenção; 

- incompatível; 

- indeterminado. 

## **Regras aplicadas** 

- Produto que contém item restrito deve ser incompatível. 

- Produto que pode conter item restrito deve gerar atenção ou incompatibilidade, conforme severidade. 

- Produto sem informação suficiente deve ser indeterminado. 

- Perfil alimentar incompleto não deve gerar falsa segurança. 

- 

## **Exceções de negócio** 

- produto inexistente; 

- Consumer inexistente; • perfil alimentar ausente; • informações insuficientes. 

## **13.9 Buscar Produtos Compatíveis para Consumer** 

## **Objetivo** 

Permitir que o consumidor encontre produtos considerando seu perfil alimentar. 

18 

## **Ator principal** 

Consumidor. 

## **Pré-condições** 

- Consumer deve existir. 

- Catálogo deve possuir produtos disponíveis. • Food Profile pode existir ou estar incompleto. 

## **Resultado esperado** 

- Lista de produtos retornada. • Produtos compatíveis destacados. 

- Produtos com risco sinalizados. 

- Produtos incompatíveis ocultados ou marcados, conforme regra de experiência. 

- Produtos indeterminados apresentados com cautela, se exibidos. 

## **Regras aplicadas** 

- Busca deve considerar múltiplas restrições. • Compatibilidade depende do Food Profile. 

- Ausência de informação não significa segurança. 

- 

- Alertas devem ser claros. 

## **Exceções de negócio** 

- nenhum produto encontrado; • perfil alimentar incompleto; • filtros inválidos. 

## **13.10 Favoritar Produto** 

## **Objetivo** 

Permitir que o consumidor salve um produto para consulta posterior. 

## **Ator principal** 

Consumidor. 

## **Pré-condições** 

- Consumer deve existir. 

- Produto deve existir. 

- Produto deve estar disponível para visualização. 

19 

## **Resultado esperado** 

- Produto adicionado à lista de favoritos do consumidor. 

## **Regras aplicadas** 

- Favorito deve pertencer ao consumidor. 

- Produto duplicado não deve ser favoritado repetidamente. • Favoritar não significa que o produto é seguro ou compatível. 

## **Exceções de negócio** 

• produto inexistente; • produto já favoritado; • usuário sem permissão. 

## **13.11 Remover Produto dos Favoritos** 

## **Objetivo** 

Permitir que o consumidor remova um produto salvo. 

## **Ator principal** 

Consumidor. 

## **Pré-condições** 

- Produto deve estar favoritado pelo consumidor. 

## **Resultado esperado** 

- Produto removido dos favoritos. 

## **Regras aplicadas** 

- Consumidor só remove favoritos próprios. 

## **Exceções de negócio** 

- favorito inexistente; 

- usuário sem permissão. 

20 

## **13.12 Favoritar Partner** 

## **Objetivo** 

Permitir que o consumidor salve um Partner para consulta posterior. 

## **Ator principal** 

Consumidor. 

## **Pré-condições** 

- Consumer deve existir. 

- Partner deve existir. 

- Partner deve estar disponível para visualização pública. 

## **Resultado esperado** 

- Partner adicionado aos favoritos. 

## **Regras aplicadas** 

- Favoritar Partner não significa que todos os produtos dele são compatíveis. • Favorito pertence ao consumidor. 

## **Exceções de negócio** 

- Partner inexistente; 

- Partner não público; • Partner já favoritado; 

- usuário sem permissão. 

## **13.13 Avaliar Produto** 

## **Objetivo** 

Permitir que o consumidor avalie um produto. 

## **Ator principal** 

Consumidor. 

## **Pré-condições** 

- Consumer deve existir. 

- Produto deve existir. 

21 

- Consumidor deve possuir permissão para avaliar. 

## **Resultado esperado** 

- Avaliação registrada. 

- Produto passa a considerar a avaliação em sua reputação. 

## **Regras aplicadas** 

- Avaliação deve estar vinculada ao consumidor. 

- Avaliação deve possuir nota válida. 

- Comentário pode ser opcional. 

- Avaliação não substitui informação alimentar oficial do produto. 

## **Exceções de negócio** 

- produto inexistente; 

- nota inválida; 

- usuário sem permissão; 

- avaliação duplicada, se não permitida. 

## **13.14 Avaliar Partner** 

## **Objetivo** 

Permitir que o consumidor avalie um Partner. 

## **Ator principal** 

Consumidor. 

## **Pré-condições** 

- Consumer deve existir. 

- Partner deve existir. 

- Partner deve estar público ou ter relação válida com o consumidor. 

## **Resultado esperado** 

- Avaliação registrada. 

- Partner passa a considerar a avaliação em sua reputação. 

## **Regras aplicadas** 

- Avaliação de Partner não equivale à avaliação de todos os produtos. 

- Nota deve ser válida. 

- Avaliação deve estar vinculada ao consumidor. 

22 

## **Exceções de negócio** 

- Partner inexistente; 

- Partner não avaliável; 

- nota inválida; 

- usuário sem permissão. 

## **13.15 Denunciar Produto** 

## **Objetivo** 

Permitir que o consumidor denuncie produto com informação incorreta, suspeita ou risco alimentar. 

## **Ator principal** 

Consumidor. 

## **Pré-condições** 

- Consumer deve existir. 

- Produto deve existir. 

## **Dados necessários** 

- motivo da denúncia; 

- descrição; 

- indicação se envolve risco alimentar. 

## **Resultado esperado** 

- Denúncia registrada. 

- Denúncia encaminhada para análise. 

- Produtos com risco alimentar podem receber prioridade. 

## **Regras aplicadas** 

- Denúncia alimentar deve ter prioridade. 

- Denúncia deve possuir motivo. 

- Denúncia não altera automaticamente a compatibilidade, mas pode acionar moderação. 

## **Exceções de negócio** 

- produto inexistente; 

- motivo ausente; 

- usuário sem permissão. 

23 

## **13.16 Denunciar Partner** 

## **Objetivo** 

Permitir que o consumidor denuncie um Partner. 

## **Ator principal** 

Consumidor. 

## **Pré-condições** 

- Consumer deve existir. • Partner deve existir. 

## **Resultado esperado** 

- Denúncia registrada. • Administração pode analisar a conduta ou confiabilidade do Partner. 

## **Regras aplicadas** 

- Denúncias envolvendo segurança alimentar devem ter prioridade. • Denúncia deve possuir motivo. 

- Denunciar Partner não equivale a denunciar todos os produtos, salvo quando o motivo envolver prática geral. 

## **Exceções de negócio** 

- Partner inexistente; 

- motivo ausente; 

- usuário sem permissão. 

## **13.17 Criar Pedido como Consumer — Futuro** 

## **Objetivo** 

Permitir que consumidor crie um pedido. 

## **Ator principal** 

Consumidor. 

## **Pré-condições** 

- Consumer deve existir. 

24 

- Produto deve estar disponível. 

- Partner deve poder receber pedido. 

- Compatibilidade alimentar deve ser apresentada antes da confirmação. 

## **Resultado esperado** 

- Pedido criado. 

- Dados alimentares relevantes preservados no momento da compra. 

- Alertas foram exibidos ao consumidor antes da confirmação. 

## **Regras aplicadas** 

- Consumidor deve ser alertado sobre risco. 

- Pedido deve preservar snapshot alimentar. 

- Produto incompatível pode exigir confirmação especial ou ser bloqueado, conforme regra definida. 

## **Exceções de negócio** 

- produto indisponível; 

- Partner indisponível; 

- risco crítico; 

- dados alimentares insuficientes; 

- usuário sem permissão. 

# **14. Casos de Uso de Frontend** 

Os casos de uso de frontend devem refletir a jornada do consumidor e comunicar riscos alimentares de maneira clara. 

## **14.1 Cadastro ou Entrada do Consumidor** 

## **Objetivo da interface** 

Permitir que a pessoa acesse a plataforma como consumidor. 

## **Comportamento esperado** 

A interface deve: 

- apresentar proposta da plataforma; 

- permitir entrada ou cadastro; 

- orientar que a experiência melhora com o perfil alimentar; 

- não exigir configuração alimentar completa antes de qualquer navegação, salvo decisão de produto. 

25 

## **Estados de tela** 

- formulário inicial; 

- validação; 

- cadastro criado; 

- erro de dados; 

- erro de acesso. 

## **Cuidados de UX** 

- evitar linguagem alarmista; 

- explicar benefícios do perfil alimentar; 

- deixar claro que a plataforma ajuda a avaliar produtos, mas depende de informações cadastradas. 

## **14.2 Configurar Perfil Alimentar** 

## **Objetivo da interface** 

Permitir que o consumidor informe suas necessidades alimentares. 

## **Comportamento esperado** 

A interface deve: 

- apresentar categorias de necessidade alimentar; 

- permitir múltiplas seleções; 

- permitir informar severidade; 

- explicar contaminação cruzada quando relevante; 

- permitir salvar e editar depois; 

- indicar se o perfil está completo ou incompleto. 

## **Estados de tela** 

- perfil vazio; 

- preenchimento; 

- salvando; 

- salvo; 

- perfil incompleto; 

- erro de validação. 

## **Cuidados de UX** 

- usar linguagem clara; 

- diferenciar alergia, intolerância, restrição e preferência; 

- destacar que informações críticas impactam alertas; 

- não tornar o formulário excessivamente complexo no primeiro uso. 

26 

## **14.3 Editar Perfil Alimentar** 

## **Objetivo da interface** 

Permitir que o consumidor atualize suas restrições. 

## **Comportamento esperado** 

A interface deve: 

- exibir restrições atuais; 

- permitir adicionar novas restrições; • permitir remover restrições; • alertar que mudanças afetam buscas e alertas futuros; • salvar alterações com confirmação clara. 

## **Estados de tela** 

- carregando; • edição; • salvando; • salvo; • erro; • alteração com impacto relevante. 

## **Cuidados de UX** 

- indicar que o perfil alimentar é sensível; 

- • permitir revisão antes de salvar; • evitar remoção acidental de restrições críticas. 

## **14.4 Buscar Produtos** 

## **Objetivo da interface** 

Permitir que o consumidor encontre produtos adequados. 

## **Comportamento esperado** 

A interface deve: 

- permitir busca textual; 

- permitir filtros por restrição; 

- considerar o Food Profile quando disponível; 

- destacar produtos compatíveis; 

- sinalizar produtos com atenção; 

- evitar exibir produtos indeterminados como seguros. 

27 

## **Estados de tela** 

- carregando; • resultados encontrados; 

- nenhum resultado; • filtros aplicados; 

- erro de busca; • perfil alimentar ausente ou incompleto. 

## **Cuidados de UX** 

- exibir filtros ativos; 

- 

- explicar por que um produto aparece como compatível, atenção, incompatível ou indeterminado; 

- permitir que o consumidor refine a busca; • indicar quando a ausência de perfil limita a análise. 

## **14.5 Visualizar Detalhes do Produto** 

## **Objetivo da interface** 

Permitir que o consumidor analise um produto antes de decidir. 

## **Comportamento esperado** 

A interface deve exibir: 

- nome; 

- descrição; 

- Partner responsável; 

- ingredientes; 

- classificações alimentares; 

- risco de contaminação cruzada; 

- compatibilidade com perfil; 

- avaliações; 

- opção de favoritar; 

- opção de denunciar. 

## **Estados de tela** 

- carregando; 

- produto disponível; 

- produto indisponível; 

- produto com informação incompleta; 

- produto incompatível; 

- produto com risco; 

- erro. 

28 

## **Cuidados de UX** 

- alertas alimentares devem ser visíveis; 

- não esconder informações críticas; 

- não afirmar segurança quando houver incerteza; 

- diferenciar “não contém” de “pode conter”. 

## **14.6 Visualizar Alerta Alimentar** 

## **Objetivo da interface** 

Comunicar claramente ao consumidor o resultado da compatibilidade. 

## **Possíveis mensagens conceituais** 

## **Compatível** 

O produto não apresenta conflito conhecido com o perfil alimentar informado. 

## **Atenção** 

O produto possui risco potencial, possibilidade de contaminação cruzada ou informação que exige cautela. 

## **Incompatível** 

O produto contém ou declara conter algo incompatível com o perfil alimentar informado. 

## **Indeterminado** 

Não há informações suficientes para avaliar a compatibilidade com segurança. 

## **Cuidados de UX** 

- usar linguagem direta; 

- evitar termos ambíguos; 

- permitir que o consumidor veja o motivo do alerta; 

- destacar restrições críticas; 

- não substituir decisão médica ou orientação profissional. 

29 

## **14.7 Favoritar Produto ou Partner** 

## **Objetivo da interface** 

Permitir que o consumidor salve itens de interesse. 

## **Comportamento esperado** 

A interface deve: 

- permitir favoritar produto; 

- permitir favoritar Partner; 

- permitir remover favoritos; 

- exibir lista de favoritos; 

- indicar quando um favorito mudou de status ou passou a apresentar risco. 

## **Cuidados de UX** 

- favoritar não deve ser apresentado como validação de segurança; 

- se o perfil alimentar mudar, favoritos podem precisar ser reavaliados; 

- produtos indisponíveis devem ser sinalizados. 

## **14.8 Avaliar Produto ou Partner** 

## **Objetivo da interface** 

Permitir que o consumidor registre sua experiência. 

## **Comportamento esperado** 

A interface deve: 

- permitir nota; 

- permitir comentário; 

- diferenciar avaliação de produto e Partner; 

- permitir relato de experiência alimentar, se aplicável; 

- orientar que denúncias críticas devem usar canal de denúncia, não apenas avaliação. 

## **Cuidados de UX** 

- avaliação não deve substituir denúncia de risco; 

- comentários devem ser claros; 

- experiência individual não deve ser confundida com certificação. 

30 

## **14.9 Denunciar Produto ou Partner** 

## **Objetivo da interface** 

Permitir que o consumidor reporte informação incorreta ou risco. 

## **Comportamento esperado** 

A interface deve: 

- permitir selecionar motivo; 

- permitir descrição; 

- destacar opção de risco alimentar; 

- confirmar envio; 

- informar que a denúncia será analisada. 

## **Estados de tela** 

- formulário de denúncia; 

- enviando; 

- denúncia registrada; 

- erro; 

- campos obrigatórios ausentes. 

## **Cuidados de UX** 

- tratar denúncia alimentar com seriedade; 

- evitar exposição desnecessária do consumidor; 

- permitir relato objetivo; 

- não prometer resolução imediata. 

## **14.10 Jornada de Pedido — Futuro** 

## **Objetivo da interface** 

Permitir que o consumidor compre produtos com clareza sobre riscos alimentares. 

## **Comportamento esperado** 

Antes da confirmação, a interface deve: 

- apresentar itens do pedido; 

- exibir compatibilidade alimentar; 

- destacar riscos; 

- exigir confirmação em casos de atenção; 

- bloquear ou alertar fortemente em casos incompatíveis, conforme regra definida; 

- preservar a informação considerada no momento da compra. 

31 

## **Cuidados de UX** 

- não permitir que o consumidor confirme sem visualizar alertas críticos; • deixar claro quando a informação é insuficiente; 

- preservar confiança e transparência. 

# **15. Fluxos Principais** 

## **15.1 Fluxo de Configuração Alimentar** 

1. Usuário acessa a plataforma. 

2. Sistema identifica ou cria Consumer. 

3. Consumidor acessa configuração alimentar. 

4. Consumidor seleciona restrições. 

5. Consumidor informa severidade. 

6. Consumidor define observações. 

7. Sistema salva Food Profile. 

8. Buscas futuras passam a considerar o perfil. 

## **15.2 Fluxo de Busca com Perfil Alimentar** 

1. Consumidor acessa busca. 

2. Sistema identifica Food Profile. 

Consumidor informa filtros ou termo de busca. 

3. 

4. Sistema consulta produtos. 

5. Sistema avalia compatibilidade. 

6. Interface exibe resultados classificados. 

7. Consumidor acessa detalhe do produto. 

## **15.3 Fluxo de Produto com Risco** 

1. Consumidor acessa produto. 

Sistema compara produto com Food Profile. 

2. 

3. Resultado indica atenção ou incompatibilidade. 

4. Interface exibe alerta. 

5. Consumidor visualiza motivo. 

6. Consumidor decide não consumir, denunciar, favoritar ou prosseguir conforme regras. 

## **15.4 Fluxo de Perfil Incompleto** 

- Consumidor acessa busca sem perfil completo. 

1. 

- Sistema permite navegação, se essa for a política. 

2. 

- Interface indica que a análise é limitada. 

3. 

4. Produtos não devem ser apresentados como plenamente seguros. 

32 

5. Sistema convida consumidor a completar perfil alimentar. 

## **15.5 Fluxo de Denúncia Alimentar** 

1. Consumidor identifica possível risco. 

2. Consumidor aciona denúncia. 

3. Informa motivo e descrição. 

4. Sistema registra denúncia. 

5. Administração recebe denúncia. 

6. Produto ou Partner pode ser revisado. 

# **16. Orientações de Modelagem para Backend** 

## **16.1 Separar identidade de perfil alimentar** 

Dados de acesso não devem conter regras alimentares. 

O backend deve manter separados: 

- quem é o usuário; 

- como ele participa como consumidor; 

- quais necessidades alimentares ele possui. 

## **16.2 Tratar perfil alimentar como dado sensível de domínio** 

As informações do Food Profile impactam diretamente a experiência do consumidor e podem envolver saúde alimentar. 

Alterações devem ser tratadas com cuidado, clareza e rastreabilidade suficiente. 

## **16.3 Não assumir compatibilidade por ausência de informação** 

Se um produto não informa glúten, lactose, alergênicos ou risco, o backend não deve assumir compatibilidade. 

Ausência de informação deve gerar resultado indeterminado ou atenção. 

## **16.4 Preservar regras críticas no domínio** 

Regras como compatibilidade, severidade, risco e contaminação cruzada não devem ser tratadas apenas como filtros simples. 

Elas devem ser regras explícitas do domínio. 

33 

## **16.5 Garantir que casos de uso expressem intenção** 

Casos de uso devem representar ações de negócio. 

Exemplos adequados: 

- configurar perfil alimentar; 

- adicionar restrição alimentar; 

- buscar produtos compatíveis; 

- consultar compatibilidade; 

- denunciar produto; • favoritar produto. 

Evitar nomes que escondam a intenção do domínio. 

# **17. Orientações de Modelagem para Frontend** 

## **17.1 Interface deve educar o consumidor** 

O CeliLac lida com decisões alimentares. A interface deve explicar termos importantes de forma simples. 

Exemplos: 

- contém; • não contém; 

- pode conter; 

- contaminação cruzada; • informação insuficiente; • compatível; • atenção; • incompatível. 

## **17.2 Alertas devem ser visíveis** 

Alertas alimentares não devem ficar escondidos em detalhes secundários. 

O consumidor deve visualizar alertas antes de tomar decisões importantes. 

## **17.3 Evitar falsa sensação de segurança** 

A interface não deve usar mensagens absolutas quando o sistema não tiver dados suficientes. 

Evitar expressões como: 

- “produto seguro”; 

- “garantido”; 

34 

- “sem risco”. 

Preferir expressões como: 

- “compatível com as informações disponíveis”; • “não há conflito conhecido”; • “informação insuficiente”; 

- “atenção: pode conter”. 

## **17.4 Separar avaliação de compatibilidade** 

Avaliação de consumidores não substitui análise alimentar. 

Um produto bem avaliado pode ser incompatível com determinado perfil. 

Um produto compatível pode ter avaliação baixa por outros motivos. 

## **17.5 Perfil alimentar deve ser fácil de revisar** 

O consumidor deve conseguir entender e editar seu perfil com facilidade. 

A interface deve evitar que a configuração seja feita uma única vez e depois esquecida. 

# **18. Critérios de Aceite por Caso de Uso** 

## **18.1 Criar Consumer** 

O caso será aceito quando: 

- um User puder ser associado a um Consumer; 

- Consumer não for confundido com Partner; • Consumer puder iniciar jornada de perfil alimentar. 

## **18.2 Criar Food Profile** 

O caso será aceito quando: 

- Consumer puder criar perfil alimentar; • perfil estiver vinculado ao Consumer; • perfil vazio não gerar compatibilidade segura. 

## **18.3 Adicionar Restrição** 

O caso será aceito quando: 

- consumidor puder selecionar restrição válida; 

- consumidor puder informar tipo e severidade; 

35 

- restrição passar a impactar buscas e alertas. 

## **18.4 Buscar Produtos Compatíveis** 

O caso será aceito quando: 

- sistema considerar múltiplas restrições; 

- produtos compatíveis forem destacados; 

- produtos com risco forem sinalizados; 

- produtos incompatíveis ou indeterminados não forem apresentados como seguros. 

## **18.5 Visualizar Alerta** 

O caso será aceito quando: 

- alerta for claro; 

- motivo do alerta puder ser consultado; 

- risco de contaminação cruzada for destacado quando aplicável; 

- informação insuficiente for tratada com cautela. 

## **18.6 Denunciar Produto** 

O caso será aceito quando: 

- consumidor puder informar motivo; 

- denúncia alimentar for registrada; 

- denúncia puder ser priorizada; 

- consumidor receber confirmação de envio. 

# **19. Decisões de Domínio Recomendadas** 

## **19.1 Consumer deve ser separado de User** 

User representa acesso. Consumer representa o papel de consumo. 

## **19.2 Food Profile deve ser separado de Consumer** 

Consumer representa a pessoa no ecossistema. Food Profile representa necessidades alimentares. 

## **19.3 Compatibilidade alimentar deve ser contexto próprio** 

A análise de compatibilidade não deve ser simples campo do consumidor nem simples campo do produto. 

Ela surge da relação entre Food Profile e Product. 

36 

## **19.4 Ausência de informação não é compatibilidade** 

Se o sistema não sabe se um produto contém determinado risco, não deve tratá-lo como compatível. 

## **19.5 Restrições críticas exigem alertas mais fortes** 

Alergias, doença celíaca e restrições severas devem impactar o nível de alerta. 

## **19.6 Favorito não significa seguro** 

Favoritar produto ou Partner não deve ser interpretado como validação de compatibilidade. 

## **19.7 Avaliação não substitui informação alimentar** 

Avaliações ajudam reputação, mas não substituem dados estruturados de ingredientes, restrições e risco. 

# **20. Glossário do Domínio** 

## **User** 

Identidade de acesso ao sistema. 

## **Consumer** 

Pessoa que utiliza a plataforma para buscar, avaliar, salvar ou futuramente comprar produtos alimentares. 

## **Food Profile** 

Perfil alimentar do consumidor, contendo restrições, alergias, intolerâncias e preferências. 

## **Restrição alimentar** 

Necessidade que limita o consumo de determinados ingredientes ou produtos. 

## **Alergia alimentar** 

Condição crítica associada a reação adversa a determinado alimento ou ingrediente. 

## **Intolerância alimentar** 

Condição em que o organismo possui dificuldade de processar determinado componente alimentar. 

37 

## **Preferência alimentar** 

Escolha do consumidor por estilo de vida, gosto ou convicção. 

## **Severidade** 

Nível de atenção associado a uma restrição alimentar. 

## **Contaminação cruzada** 

Possibilidade de um produto ter contato com ingrediente restrito durante preparo, armazenamento ou manipulação. 

## **Compatível** 

Resultado em que não há conflito conhecido entre produto e perfil alimentar. 

## **Atenção** 

Resultado em que há risco potencial ou informação que exige cuidado. 

## **Incompatível** 

Resultado em que produto contém algo conflitante com o perfil alimentar. 

## **Indeterminado** 

Resultado em que não há informação suficiente para avaliar a compatibilidade. 

# **21. Resumo para a Equipe** 

O usuário consumidor no CeliLac deve ser modelado como a pessoa que busca produtos alimentares adequados às suas necessidades alimentares específicas. 

A equipe deve separar claramente: 

User é quem acessa o sistema. Consumer é quem participa como consumidor. Food Profile é o conjunto de necessidades alimentares. Compatibility é a análise entre perfil alimentar e produto. Product é o item ofertado. Partner é o fornecedor do produto. 

A implementação deve evitar misturar autenticação, dados do consumidor, perfil alimentar e compatibilidade em um único conceito. 

38 

O ponto mais importante é garantir que o sistema nunca produza falsa sensação de segurança. Produto sem informação suficiente não deve ser tratado como seguro. Produto com risco de contaminação cruzada deve ser sinalizado. Restrições críticas devem gerar alertas mais fortes. 

Para backend, o foco deve estar em proteger regras de domínio, diferenciar conceitos e garantir que os casos de uso expressem intenções reais do negócio. 

Para frontend, o foco deve estar em clareza, orientação, prevenção de ambiguidade e comunicação adequada dos alertas alimentares. 

A experiência do consumidor deve ser construída em torno de confiança, transparência e respeito à complexidade das necessidades alimentares. 

39 

