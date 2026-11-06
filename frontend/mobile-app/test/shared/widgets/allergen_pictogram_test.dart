import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/models/enums.dart';
import 'package:mobile_app/core/assets/allergen_icons.dart';
import 'package:mobile_app/features/onboarding/allergen_catalog.dart';
import 'package:mobile_app/shared/widgets/allergen_pictogram.dart';

Future<void> _pump(WidgetTester tester, AllergenType allergen) {
  return tester.pumpWidget(
    MaterialApp(
      home: Scaffold(body: AllergenPictogram(allergen: allergen)),
    ),
  );
}

void main() {
  group('mapa alérgeno → asset', () {
    test('todo alérgeno do onboarding tem pictograma e o arquivo existe', () {
      for (final allergen in onboardingAllergens) {
        final asset = allergenIconAssets[allergen];
        expect(
          asset,
          isNotNull,
          reason: '${allergen.wireValue} sem pictograma',
        );
        expect(File(asset!).existsSync(), isTrue, reason: '$asset não existe');
      }
    });

    test('OTHER não tem pictograma (usa fallback)', () {
      expect(allergenIconAssets.containsKey(AllergenType.other), isFalse);
    });

    test('todos os assets ficam em uma pasta registrada no pubspec', () {
      final pubspec = File('pubspec.yaml').readAsStringSync();
      expect(pubspec, contains('assets/icons/allergens/'));
      for (final asset in allergenIconAssets.values) {
        expect(asset.startsWith('assets/icons/allergens/'), isTrue);
      }
    });
  });

  group('AllergenPictogram', () {
    testWidgets('renderiza o SVG do alérgeno mapeado', (tester) async {
      await _pump(tester, AllergenType.gluten);
      expect(find.byType(SvgPicture), findsOneWidget);
      expect(
        find.byKey(const Key('allergen-pictogram-fallback')),
        findsNothing,
      );
    });

    testWidgets('alérgeno sem ícone usa o fallback genérico', (tester) async {
      await _pump(tester, AllergenType.other);
      expect(find.byType(SvgPicture), findsNothing);
      expect(
        find.byKey(const Key('allergen-pictogram-fallback')),
        findsOneWidget,
      );
    });

    testWidgets('expõe o nome do alérgeno para leitores de tela', (
      tester,
    ) async {
      await _pump(tester, AllergenType.lactose);
      expect(find.bySemanticsLabel('Lactose'), findsOneWidget);
    });
  });
}
