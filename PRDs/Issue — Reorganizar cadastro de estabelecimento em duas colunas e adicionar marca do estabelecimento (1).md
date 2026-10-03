# Issue — Reorganizar cadastro de estabelecimento em duas colunas e adicionar marca do estabelecimento

## Contexto

A tela atual de cadastro de estabelecimento apresenta os campos de forma predominantemente vertical. Em resoluções desktop, isso provoca um aproveitamento inadequado da área horizontal disponível, aumenta desnecessariamente a altura do formulário e exige mais rolagem do usuário.

Além da reorganização visual, o cadastro deve passar a permitir que o Partner informe uma imagem representando a identidade visual do estabelecimento.

A proposta é reorganizar o formulário priorizando agrupamento semântico das informações, melhor aproveitamento da tela e preparação da identidade visual do estabelecimento para utilização posterior dentro do CeliLac.

## Objetivo

Alterar o layout da tela de cadastro de estabelecimento para:

- utilizar duas colunas em resoluções desktop;
- agrupar informações relacionadas;
- reduzir a extensão vertical do formulário;
- adicionar o envio da marca do estabelecimento;
- apresentar uma pré-visualização da imagem selecionada;
- manter comportamento responsivo adequado em tablets e dispositivos móveis;
- preservar uma ordem de leitura coerente independentemente da resolução utilizada.

---

## 1. Estrutura geral do formulário

Em desktop, o card principal do cadastro deve utilizar uma largura maior que a atual, aproveitando melhor o espaço horizontal disponível.

Como referência visual, o formulário pode trabalhar com uma largura aproximada entre 950 px e 1100 px, respeitando os limites e padrões gerais da aplicação.

O conteúdo deve ser organizado inicialmente em duas áreas principais:

### Coluna esquerda — Identificação do estabelecimento

Agrupar:

- Nome Fantasia;
- Tipo de Fornecedor;
- CNPJ;
- Descrição Comercial.

Essa coluna concentra as informações relacionadas à identificação e caracterização comercial do estabelecimento.

### Coluna direita — Marca e contato

Agrupar:

- Marca do estabelecimento;
- componente para envio da imagem;
- pré-visualização da imagem selecionada;
- Telefone / WhatsApp.

A área destinada à marca deverá ocupar posição de destaque suficiente para que o usuário compreenda claramente que está cadastrando a identidade visual do estabelecimento.

---

## 2. Localização e atendimento

Após o primeiro agrupamento em duas colunas, deverá existir uma segunda seção destinada às informações de localização.

Essa seção deve utilizar toda a largura disponível do formulário.

Agrupar:

- Endereço Completo;
- Cidade;
- Estado;
- Região de Atendimento/Entrega.

Cidade e Estado podem ser apresentados lado a lado em resoluções desktop.

O campo Endereço Completo deve utilizar a largura integral da seção.

O campo Região de Atendimento/Entrega também pode utilizar a largura integral disponível, considerando que seu conteúdo pode ser textual e relativamente extenso.

---

## 3. Marca do estabelecimento

Adicionar ao cadastro um novo campo conceitualmente denominado:

**Marca do estabelecimento**

Evitar denominações genéricas como "Foto", uma vez que a imagem representa a identidade visual do negócio.

Apresentar junto ao componente o seguinte contexto ao usuário:

> Envie o logotipo ou imagem que representa seu estabelecimento. Ela poderá ser exibida no CeliLac junto às informações do negócio.

A marca não deve ser tratada como obrigatoriamente quadrada, pois estabelecimentos podem possuir logotipos horizontais, verticais ou com diferentes proporções.

---

## 4. Componente para envio da marca

O componente deve permitir que o usuário:

- selecione uma imagem do dispositivo;
- visualize a imagem antes de concluir o cadastro;
- substitua a imagem selecionada;
- remova a imagem selecionada antes de salvar o cadastro.

Antes de existir uma imagem selecionada, apresentar uma área visual de upload contendo indicação de que o usuário pode selecionar uma imagem.

Uma apresentação possível:

**Adicione a marca do negócio**

**Arraste uma imagem ou clique para selecionar**

O componente pode permitir drag and drop caso esse comportamento esteja alinhado aos componentes já utilizados na aplicação.

---

## 5. Formatos da imagem

O upload deve aceitar, no mínimo:

- PNG;
- JPG/JPEG;
- WebP.

Deve existir validação de tipo de arquivo.

Também deve existir limite de tamanho para o arquivo enviado.

Como referência inicial de interface, pode ser informado ao usuário:

**PNG, JPG ou WebP • Máx. 5 MB**

Caso exista uma política global da aplicação para tamanho máximo de imagens, utilizar a regra global em vez de criar uma exceção específica para esta tela.

---

## 6. Pré-visualização da marca

Após a seleção da imagem, o formulário deve apresentar sua pré-visualização.

A imagem não deve ser deformada para preencher o espaço disponível.

A visualização deve:

- manter a proporção original;
- permanecer integralmente visível;
- utilizar comportamento equivalente a `contain`;
- possuir uma área de fundo neutro;
- funcionar adequadamente com marcas quadradas, horizontais e verticais.

Abaixo ou próximo da imagem poderão ser disponibilizadas as ações:

- Alterar imagem;
- Remover.

Opcionalmente, o nome do arquivo selecionado também poderá ser apresentado.

---

## 7. Hierarquia visual

A tela deve manter uma organização visual que deixe claros os seguintes agrupamentos:

### Identificação do estabelecimento

Dados que descrevem quem é o estabelecimento e sua atuação.

### Marca e contato

Identidade visual e principal meio de contato.

### Localização e atendimento

Dados relacionados à localização física e área atendida pelo estabelecimento.

Evitar apenas distribuir campos alternadamente entre duas colunas sem considerar seu significado.

A organização deve refletir grupos conceituais, e não somente economia de espaço.

---

## 8. Ações do formulário

As ações principais devem permanecer ao final do formulário.

Manter:

- Voltar;
- Cadastrar Estabelecimento.

Em desktop, os botões podem permanecer alinhados ao final da área do formulário, mantendo destaque maior para a ação principal.

O novo layout não deve alterar o significado ou comportamento das ações já existentes.

---

## 9. Comportamento responsivo

### Desktop

Em resoluções desktop, utilizar duas colunas para a parte superior do formulário.

Estrutura conceitual:

- coluna esquerda: identificação do estabelecimento;
- coluna direita: marca e contato;
- seção inferior: localização e atendimento em largura integral.

### Tablet e dispositivos móveis

Em resoluções nas quais duas colunas prejudiquem a leitura ou interação, o formulário deve passar automaticamente para uma única coluna.

A ordem deve permanecer semanticamente coerente:

1. Identificação do estabelecimento;
2. Marca do estabelecimento;
3. Contato;
4. Localização;
5. Região de atendimento;
6. Ações do formulário.

Nenhuma informação ou funcionalidade deve desaparecer em função da resolução.

---

## 10. Comportamento esperado no desktop

A composição geral esperada deve seguir aproximadamente a seguinte distribuição:

**Parte superior**

Coluna esquerda:

- Nome Fantasia;
- Tipo de Fornecedor;
- CNPJ;
- Descrição Comercial.

Coluna direita:

- Marca do estabelecimento;
- Upload/preview da imagem;
- Telefone / WhatsApp.

**Parte inferior**

Largura integral:

- Endereço Completo;
- Cidade + Estado;
- Região de Atendimento/Entrega.

**Rodapé do formulário**

- Voltar;
- Cadastrar Estabelecimento.

---

## 11. Resultado esperado

Após a alteração, espera-se que a tela:

- aproveite melhor a largura disponível em desktop;
- apresente menor extensão vertical;
- reduza a necessidade de rolagem;
- facilite a identificação dos grupos de informações;
- deixe evidente que os dados cadastrados pertencem a um estabelecimento;
- permita cadastrar a identidade visual do negócio;
- apresente uma experiência consistente entre desktop, tablet e mobile;
- mantenha boa legibilidade e hierarquia visual.

---

## Critérios de aceite

- [ ] O formulário utiliza duas colunas em resoluções desktop adequadas.
- [ ] Os campos de identificação estão agrupados na coluna esquerda.
- [ ] Marca e contato estão agrupados na coluna direita.
- [ ] Existe um campo denominado "Marca do estabelecimento".
- [ ] O usuário consegue selecionar uma imagem para representar o estabelecimento.
- [ ] PNG é aceito.
- [ ] JPG/JPEG é aceito.
- [ ] WebP é aceito.
- [ ] Existe validação do tamanho máximo permitido para a imagem.
- [ ] A imagem selecionada possui pré-visualização antes da conclusão do cadastro.
- [ ] A pré-visualização não distorce a proporção original da imagem.
- [ ] O usuário consegue substituir uma imagem selecionada.
- [ ] O usuário consegue remover uma imagem selecionada.
- [ ] Endereço utiliza a largura disponível da seção de localização.
- [ ] Cidade e Estado aparecem lado a lado quando houver espaço disponível.
- [ ] Região de Atendimento/Entrega possui espaço adequado para conteúdo textual.
- [ ] Em telas menores, o formulário é reorganizado para uma única coluna.
- [ ] A reorganização responsiva mantém uma ordem semântica coerente.
- [ ] Nenhum campo atualmente existente é perdido com a alteração.
- [ ] As ações "Voltar" e "Cadastrar Estabelecimento" permanecem disponíveis.
- [ ] O layout final reduz o excesso de espaço vertical observado na versão atual.