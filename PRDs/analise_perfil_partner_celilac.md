# Análise da Tela de Perfil para Partner no CeliLac

Sim. Pela imagem e, principalmente, confrontando-a com a documentação que já definimos para o CeliLac, **essa tela está conceitualmente incorreta para um usuário cadastrado como Partner**.

O problema não é apenas de nomenclatura. A tela mistura **dois perfis de domínio diferentes** — Consumer e Partner — e isso contraria explicitamente a modelagem que documentamos.

## O que a imagem mostra

Após entrar como Partner, você recebe uma página chamada **“Meu Perfil”**, porém nela aparecem elementos claramente pertencentes ao consumidor:

- `Status do Consumidor: ATIVO`;
- “Restrições alimentares”;
- seleção de alergênico;
- severidade da restrição;
- tipo de necessidade;
- “Aceito risco de contaminação cruzada (traços)”;
- botão “Desativar Perfil”.

Esses elementos fazem sentido para alguém que utiliza o CeliLac para **descobrir produtos compatíveis com suas necessidades alimentares**, não para alguém que fornece produtos.

Isso está coerente com outra documentação do projeto, que define o consumidor como usuário com restrições, sensibilidades ou estilos alimentares específicos e que precisa cadastrar seu perfil, buscar produtos, aplicar filtros e visualizar informações compatíveis.

---

## 1. O erro fundamental: User não é Partner

Na documentação específica de Partner, fizemos uma separação explícita:

| Conceito | Papel |
|---|---|
| `User` | Identidade utilizada para acessar o sistema |
| `Partner` | Entidade comercial/produtiva que fornece produtos |
| `Consumer` | Usuário que procura, avalia ou compra produtos |
| `Product` | Produto oferecido por um Partner |
| `Admin` | Usuário responsável pela governança |

E há uma definição ainda mais importante:

> Um Partner deve estar vinculado a pelo menos um User responsável, mas o Partner possui ciclo de vida e regras próprias.

Portanto, fazer login como usuário responsável por um Partner **não transforma o Partner em Consumer**.

A aplicação deveria identificar algo conceitualmente parecido com:

```text
User
 └── é responsável por → Partner
```

e não:

```text
User
 └── ConsumerProfile
```

como parece estar acontecendo atualmente.

---

## 2. A própria documentação exige interfaces diferentes

Temos outra regra muito direta nos materiais:

> “Consumidor, parceiro e administrador precisam de interfaces distintas.”

Isso é exatamente o que a tela atual viola.

Não significa necessariamente manter três aplicações independentes, mas significa que **o contexto apresentado e os casos de uso disponíveis precisam respeitar o ator autenticado**.

Para um Partner Owner, a documentação estabelece uma interface própria, denominada conceitualmente **Partner Dashboard**, destinada à gestão do Partner.

---

## 3. O que deveria aparecer para você como Partner

Segundo o documento de domínio, o responsável pelo Partner deveria ter acesso principalmente a:

- criação e atualização do cadastro do Partner;
- dados comerciais;
- tipo do Partner;
- dados de contato;
- localização ou área de atendimento;
- status de aprovação;
- status operacional;
- pendências cadastrais;
- submissão do cadastro para revisão;
- acompanhamento da decisão administrativa;
- gestão operacional;
- posteriormente, produtos, avaliações, denúncias e pedidos.

Portanto, a página mostrada na imagem deveria ter uma natureza muito diferente.

Algo como:

### Meu Partner

**Situação cadastral**

> Aguardando avaliação

ou:

> Cadastro em rascunho

ou:

> Cadastro aprovado

Dependendo do estado real.

Depois:

### Dados do estabelecimento

- Nome comercial
- Tipo do Partner
- Razão social, quando aplicável
- Documento, quando aplicável
- Descrição
- Foto/logotipo

### Contato

- Telefone
- WhatsApp
- E-mail comercial
- Canal de atendimento

### Localização / atendimento

- Endereço
- Cidade
- Estado
- CEP
- Área de atendimento

### Situação operacional

- Ativo
- Inativo
- Temporariamente fechado

### Situação da aprovação

- Draft
- Pending Review
- Approved
- Rejected
- Suspended

### Pendências

Por exemplo:

> Complete o endereço para enviar seu cadastro para avaliação.

Finalmente:

**Salvar alterações**

e, quando o cadastro estiver completo:

**Enviar para avaliação**

Essa organização corresponde diretamente aos casos de uso que definimos para o responsável pelo Partner.

---

## 4. “Pendente de avaliação” está correto, mas está no contexto errado

Há algo interessante na imagem: no topo aparece:

> **Pendente de avaliação**

Esse conceito **faz sentido para Partner**.

Na documentação, temos os estados:

```text
Draft
   ↓
Pending Review
   ↓
Approved
      ou
Rejected
```

e posteriormente:

```text
Approved → Suspended
Suspended → Approved
```

Por isso, aparentemente existe alguma implementação de Partner por trás da tela.

O que parece ter acontecido é uma **mistura de contextos no frontend**:

```text
Partner Approval Status
        +
Consumer Profile Form
```

Isso produz exatamente a inconsistência da imagem:

> “Pendente de avaliação”

ao mesmo tempo que:

> “Status do Consumidor: ATIVO”

Esses dois conceitos não deveriam compor essa mesma visão.

---

## 5. “Restrições alimentares” não pertencem ao Partner

Esse é provavelmente o problema mais importante do ponto de vista de DDD.

Na documentação de Partner fizemos questão de estabelecer:

> regras alimentares devem permanecer fora do Partner.

E o bounded context `Partner Management` explicitamente **não é responsável** por:

- composição alimentar;
- ingredientes;
- alergênicos;
- cálculo de compatibilidade alimentar;
- regras de restrições alimentares.

Portanto, estes campos da imagem:

```text
Glúten
Fatal
Alergia
Aceito risco de contaminação cruzada
```

não deveriam estar no perfil do Partner.

Eles pertencem ao **perfil alimentar do Consumer**.

---

## 6. Cuidado com uma confusão que pode surgir depois

Há uma distinção importante.

O Partner **vai trabalhar com informações alimentares**, mas não através de seu perfil pessoal.

Por exemplo:

```text
PARTNER
Restaurante Coimbra
      │
      ├── Produto A
      │      ├── contém glúten
      │      ├── contém lactose
      │      └── risco de traços
      │
      └── Produto B
             ├── sem lactose
             └── vegano
```

O Partner **declara informações relacionadas aos produtos**.

Já:

```text
CONSUMER
João
   ├── doença celíaca
   ├── alergia a leite
   └── não aceita traços
```

representa as necessidades pessoais utilizadas para verificar compatibilidade.

Isso está alinhado ao que documentamos: o Partner fornece informações sobre seus produtos, enquanto as regras de compatibilidade pertencem ao contexto de segurança alimentar.

Essa separação é fundamental para o CeliLac.

---

## 7. Outro problema: “Desativar Perfil”

Na tela aparece:

> **Desativar Perfil**

Para Consumer isso pode representar algo como:

```text
desativar ConsumerProfile
```

Para Partner, entretanto, já especificamos outra semântica.

O Partner possui:

### Approval Status

```text
Draft
Pending Review
Approved
Rejected
Suspended
```

e, separadamente:

### Operational Status

```text
Active
Inactive
Temporarily Closed
```

Portanto, para um responsável pelo Partner, uma ação genérica chamada **“Desativar Perfil”** é semanticamente ruim.

Ela mistura pelo menos três conceitos possíveis:

- desativar a conta do `User`;
- inativar o `Partner`;
- desativar um `ConsumerProfile`.

No modelo que definimos, deveria existir algo mais explícito, como:

> **Alterar situação operacional**

com:

```text
● Ativo
○ Temporariamente fechado
○ Inativo
```

E a conta do usuário seria outro assunto.

---

## 8. Também vejo uma inconsistência no menu superior

Pela imagem, o menu apresenta:

```text
Início
Dashboard
Favoritos
Estabelecimentos
Parceiro
Perfil
Sair
```

Para um Partner Owner, especialmente itens como **Favoritos** e **Estabelecimentos** parecem pertencer mais diretamente à experiência de consumidor.

Isso não significa necessariamente que um Partner esteja proibido de navegar pelo marketplace. Um mesmo ser humano poderia eventualmente possuir múltiplas capacidades no sistema.

Porém, a aplicação precisa distinguir:

```text
Identidade
        ↓
papéis/capacidades
        ↓
contexto atual da interface
```

Por exemplo:

```text
João — User
 ├── Consumer
 └── Partner Owner de Padaria X
```

Nesse caso, a interface poderia oferecer explicitamente uma troca de contexto:

```text
Usar CeliLac como:

○ Consumidor
● Parceiro — Padaria X
```

Isso seria muito diferente de simplesmente renderizar o perfil Consumer enquanto o usuário acredita estar na área Partner.

---

## 9. Minha avaliação do estado atual

Eu classificaria a situação da seguinte maneira:

| Aspecto observado | Avaliação |
|---|---|
| “Pendente de avaliação” | ✅ Compatível com Partner |
| Nome completo | ⚠️ Pode pertencer ao User, não necessariamente ao Partner |
| Data de nascimento | ❌ Não pertence ao cadastro central do Partner |
| Gênero | ❌ Não pertence ao Partner |
| WhatsApp | ⚠️ Pode existir como contato, mas precisa distinguir pessoal/comercial |
| Foto pessoal | ⚠️ Provavelmente deveria existir logo/foto do Partner |
| Restrições alimentares | ❌ Consumer |
| Glúten/alergia/severidade | ❌ Consumer |
| Aceitação de traços | ❌ Consumer |
| “Status do Consumidor” | ❌ Claramente incorreto |
| “Desativar Perfil” | ❌ Semântica incorreta/ambígua para Partner |
| Status de avaliação | ✅ Domínio Partner |
| Favoritos | ⚠️ Provavelmente contexto Consumer |
| Estabelecimentos | ⚠️ Provavelmente contexto Consumer |
| Parceiro | ✅ Potencialmente correto |

---

## 10. O problema provavelmente é maior que uma tela

Eu **não recomendaria corrigir apenas os textos ou esconder os campos**.

O que a tela sugere é que pode haver um problema estrutural do fluxo:

```text
Autenticação
     ↓
User
     ↓
Perfil genérico
     ↓
ConsumerProfile
```

quando deveríamos ter conceitualmente:

```text
                  ┌── ConsumerProfile
User ─────────────┤
                  └── PartnerOwnership ── Partner
```

E cada contexto deve possuir casos de uso independentes.

Esse ponto está diretamente alinhado ao documento: Partner **não é simplesmente um usuário com papel comercial**; ele representa uma entidade comercial própria, com identidade e ciclo de vida próprios.

---

## 11. Como eu esperaria que o fluxo funcionasse

Para um cadastro como Partner:

```text
Criar conta
   ↓
Escolher atuação como Partner
   ↓
Criar User
   ↓
Criar Partner
   ↓
Vincular User como Partner Owner
   ↓
Partner = Draft
   ↓
Completar cadastro comercial
   ↓
Validar dados mínimos
   ↓
Enviar para avaliação
   ↓
Partner = Pending Review
   ↓
Admin avalia
   ├── Approved
   ├── Rejected
   └── Solicita correção
```

Depois de logado, enquanto estiver `Pending Review`, por exemplo, o Partner Owner deveria encontrar algo como:

```text
PADARIA EXEMPLO

Cadastro aguardando revisão

Dados cadastrais        ✓
Contato                  ✓
Endereço                 ✓
Informações comerciais   ✓

Enviado em: 12/08/2026

Aguarde a análise da equipe CeliLac.
```

E não um formulário de restrições alimentares.

---

## Conclusão

**Sua percepção está correta.**

Com base na documentação existente, a tela apresentada está expondo um **Consumer Profile para alguém que está no fluxo de Partner**, apesar de aparentemente já reconhecer parcialmente o status de aprovação do Partner.

Isso viola três decisões que já documentamos:

1. **Consumer, Partner e Admin possuem responsabilidades e interfaces distintas.**
2. **Partner é uma entidade de negócio própria, vinculada a um User responsável; não é simplesmente um tipo de perfil do usuário.**
3. **Restrições, alergênicos e compatibilidade alimentar não pertencem ao agregado Partner.**

Portanto, eu trataria isso como **inconsistência de modelagem/fluxo entre Identity, Consumer Profile e Partner Management**, e não como mero defeito visual do frontend.

O próximo passo mais adequado é verificarmos **como deve ficar exatamente a experiência do Partner desde o cadastro até o dashboard**, confrontando cadastro, perfil, menu, estados e casos de uso com o DDD que já definimos. A partir daí, conseguimos produzir uma especificação objetiva para backend e frontend corrigirem esse fluxo sem criar remendos.
