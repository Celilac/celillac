import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/api/api_client.dart';
import 'package:mobile_app/features/scanner/scan_lookup.dart';

import '../account/account_test_harness.dart';
import '../catalog/discovery_test_harness.dart';

const _code = '7891234567895';
final _product = {...productSummary, 'ean': _code};
const _blocked = {
  'isCompatible': false,
  'riskLevel': 'BLOCKED',
  'reasoning': 'Traços de glúten.',
  'conflicts': [],
};

ApiClient _api(Future<dynamic> Function(String path) route) =>
    RecordingHttp((r) async => await route(r.url.path)).client(token: 'tok');

void main() {
  test('produto com EAN exato devolve o veredito do backend', () async {
    final api = _api((p) async => p == '/catalog/products'
        ? jsonResponse(catalogPage([_product]), 200)
        : jsonResponse(_blocked, 200));
    final r = await ScanLookup(api).lookup(_code, 'u1');
    expect(r, isA<ScanFound>());
    expect((r as ScanFound).report.reasoning, 'Traços de glúten.');
  });

  test('ignora resultado cujo EAN não é o lido (busca é textual)', () async {
    final api = _api((p) async => jsonResponse(
        catalogPage([{...productSummary, 'ean': '0000000000000'}]), 200));
    expect(await ScanLookup(api).lookup(_code, 'u1'), isA<ScanNotFound>());
  });

  test('catálogo vazio = não encontrado, sem relatório', () async {
    final api = _api((p) async => jsonResponse(catalogPage([]), 200));
    expect(await ScanLookup(api).lookup(_code, 'u1'), isA<ScanNotFound>());
  });

  test('falha no catálogo = ScanFailed com mensagem amigável', () async {
    final api = _api((p) async => jsonResponse({'error': 'x'}, 503));
    final r = await ScanLookup(api).lookup(_code, 'u1');
    expect(r, isA<ScanFailed>());
  });

  test('falha no veredito = ScanVerdictUnavailable (nunca um relatório)', () async {
    final api = _api((p) async => p == '/catalog/products'
        ? jsonResponse(catalogPage([_product]), 200)
        : jsonResponse({'error': 'x'}, 503));
    expect(await ScanLookup(api).lookup(_code, 'u1'), isA<ScanVerdictUnavailable>());
  });
}
