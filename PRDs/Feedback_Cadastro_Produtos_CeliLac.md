Ampliação das restrições alimentares, segurança, evidências e galeria de imagens

## Síntese

A tela atual é um bom ponto de partida, porém está excessivamente centrada em glúten. A recomendação é evoluir o cadastro para representar composição alimentar, restrições, alergênicos, risco de contaminação cruzada, características do produto, certificações, origem das informações e uma galeria de imagens com valor funcional para o consumidor.

## 1. Identificação do produto

Manter os campos atuais e complementar com informações que melhorem a identificação e o ciclo de vida do produto.

- Estabelecimento produtor/fornecedor.

- Nome do produto.

- Marca / linha.

- Categoria.

- Preço sugerido/unitário.

- Descrição curta.

- Quantidade, peso ou volume e respectiva unidade de medida.

- Código/SKU interno, opcional.

- Código de barras/EAN, opcional.

- Status do produto: rascunho, publicado ou indisponível.

- Origem comercial: fabricado pelo estabelecimento ou revendido/fornecido por terceiro.

A distinção entre fabricação própria e revenda é relevante porque altera a origem e o grau de confiança das informações declaradas.

## 2. Ingredientes

A lista completa de ingredientes deve permanecer obrigatória, porém cercada por informações estruturadas que evitem depender apenas de inferência automática.

- Ingredientes conforme rótulo.

- Campo específico para a declaração 
pode conter
, quando aplicável.

- Observações sobre composição.

- Preparação do domínio para, futuramente, cadastrar ingredientes individualmente de forma estruturada.

O motor de segurança alimentar pode analisar o texto, mas as informações críticas também devem ser explicitamente declaradas pelo estabelecimento.


## 3. Segurança e restrições alimentares

Substituir o bloco específico “Contém Glúten?” por uma seção abrangente de Segurança e Restrições Alimentares. A lista deve ser orientada pelas restrições efetivamente suportadas pelo domínio CeliLac.

## Exemplos de restrições/alérgenos

- Glúten

- Leite

- Lactose

- Ovo

- Soja

- Amendoim

- Castanhas/nozes

- Peixes

- Crustáceos

- Gergelim

Para cada item, recomenda-se trabalhar com quatro estados:

| Restrição | Situação |
| --- | --- |
| Glúten | Não contém |
| Lactose | Contém |
| Amendoim | Pode conter |
| Soja | Não informado |

Os estados “Não contém”, “Contém”, “Pode conter” e “Não informado” são semanticamente superiores a um simples switch, pois distinguem presença de ingrediente, traços potenciais, ausência declarada e falta de informação.

## 4. Contaminação cruzada

Criar um bloco independente chamado “Ambiente e risco de contaminação cruzada”, evitando uma declaração única que trate o ambiente como totalmente seguro ou inseguro.

Produção exclusiva: Produto preparado em ambiente exclusivo para determinada restrição.

Produção compartilhada com protocolo de controle: O ambiente manipula o item restritivo, mas adota procedimentos de separação e higienização.

Ambiente compartilhado: Existe manipulação do item restritivo no mesmo ambiente.

Risco desconhecido/não informado: Não há evidência suficiente para classificar o risco.

O risco deve poder ser registrado por restrição. Um ambiente pode ser livre de glúten e, ao mesmo tempo, manipular leite, ovos ou amendoim.

## 5. Características alimentares

Separar restrições/alergênicos das características declaradas do produto.

- Sem glúten


- Sem lactose

- Sem leite

- Vegano

- Vegetariano

- Sem açúcar adicionado

- Sem açúcar

- Kosher

- Halal

- Orgânico

Algumas propriedades são meramente declarativas, enquanto outras podem exigir comprovação. A interface não deve tratá-las como equivalentes.

## 6. Certificações e evidências

Criar uma seção de certificações/comprovações para sustentar declarações relevantes.

- Tipo da certificação.

- Entidade certificadora.

- Número ou código.

- Validade.

- Documento comprobatório.

- Fotografia do selo ou rótulo.

- Observações.

Essa estrutura permitirá distinguir, no futuro, “declarado pelo estabelecimento” de “documentação verificada pelo CeliLac”, aumentando a transparência e a confiança na informação apresentada.

## 7. Galeria de imagens do produto

A galeria deve ser tratada como parte funcional do cadastro, e não apenas como um campo estético de imagem principal.

- Upload de múltiplas imagens.

- Imagem principal/capa.

- Arrastar e soltar arquivos.

- Reordenação das imagens.

- Exclusão e substituição.

- Legenda opcional.

- Classificação do tipo de imagem.

## Tipos de imagem recomendados

- Produto

- Embalagem

- Rótulo

- Ingredientes

- Informação nutricional

- Certificação/Selo


Fotografias de rótulo, ingredientes e certificações podem ser mais relevantes para a segurança alimentar do que uma imagem comercial do produto. A primeira imagem da galeria pode ser utilizada como capa.

## 8. Informações nutricionais

Mesmo que não seja obrigatório no MVP, o domínio pode ser preparado para uma seção opcional e expansível.

- Porção

- Calorias

- Carboidratos

- Proteínas

- Gorduras

- Fibras

- Sódio

- Açúcares

- Outros dados relevantes

## 9. Origem das informações

Registrar a procedência de cada informação relevante.

- Informada pelo estabelecimento.

- Extraída do rótulo.

- Informada pelo fabricante.

- Identificada automaticamente.

- Validada pela equipe CeliLac.

Isso permitirá apresentar mensagens como “Informação declarada pelo estabelecimento” ou “Verificado com documentação analisada pelo CeliLac”.

## 10. Resultado da análise do CeliLac

Separar claramente o que o Partner declara do que o sistema conclui. O mecanismo de análise não deve sobrescrever silenciosamente a informação fornecida.

| Aspecto | Exemplo de retorno |
| --- | --- |
| Ingredientes | Compatíveis com a restrição analisada. |
| Declaração do fornecedor | Sem glúten. |
| Ambiente | Produção compartilhada com risco informado. |

## 11. Organização da interface

Para desktop, recomenda-se um layout em duas colunas, com maior espaço para os dados centrais e uma lateral de apoio.

| Coluna principal (~65%) | Coluna lateral (~35%) |
| --- | --- |
| Identificação | Galeria de imagens |


| Ingredientes | Status da publicação |
| --- | --- |
| Segurança e restrições | Certificações |
| Contaminação cruzada | Informações complementares |
| Características alimentares |   |

No mobile, os blocos devem ser empilhados. Como o volume de dados tende a crescer, a recomendação é evoluir o cadastro de um modal vertical para uma tela dedicada ou um drawer/modal de grande dimensão estruturado por etapas.

## Fluxo sugerido por etapas

- 1. Produto → 2. Ingredientes → 3. Segurança alimentar → 4. Imagens e documentos → 5. Revisão

Também é recomendável permitir salvar o cadastro como rascunho antes da publicação.

## Diretriz conceitual principal

## Evitar modelar o cadastro apenas como “Este produto contém glúten?”.

O modelo deve responder a uma pergunta mais ampla: quais características, restrições, alergênicos e riscos estão associados a este produto, segundo quais fontes e com qual nível de confiança?

A galeria de imagens deve integrar esse raciocínio, pois imagens de embalagem, rótulo, ingredientes e certificações podem apoiar tanto a análise quanto a decisão do consumidor.
