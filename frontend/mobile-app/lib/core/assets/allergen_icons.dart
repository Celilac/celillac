import '../../api/models/enums.dart';

/// Único ponto de ligação alérgeno → pictograma (D3 do PLAN).
/// Os SVGs atuais são provisórios; para usar os oficiais (AOECS/ACELBRA) basta
/// substituir os arquivos mantendo o nome, ou apontar o caminho aqui.
/// Alérgenos fora do mapa (ex.: `OTHER`) usam o fallback de [AllergenPictogram].
const Map<AllergenType, String> allergenIconAssets = {
  AllergenType.gluten: 'assets/icons/allergens/gluten.svg',
  AllergenType.lactose: 'assets/icons/allergens/lactose.svg',
  AllergenType.nuts: 'assets/icons/allergens/nuts.svg',
  AllergenType.soy: 'assets/icons/allergens/soy.svg',
  AllergenType.eggs: 'assets/icons/allergens/eggs.svg',
  AllergenType.shellfish: 'assets/icons/allergens/shellfish.svg',
  AllergenType.fish: 'assets/icons/allergens/fish.svg',
  AllergenType.sesame: 'assets/icons/allergens/sesame.svg',
};
