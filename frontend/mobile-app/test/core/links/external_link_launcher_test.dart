import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/links/external_link_launcher.dart';

void main() {
  group('ExternalLinks.phone', () {
    test('mantém só dígitos e + e usa o esquema tel', () {
      expect(ExternalLinks.phone('(11) 99999-8888').toString(), 'tel:11999998888');
      expect(ExternalLinks.phone('+55 11 99999-8888').toString(), 'tel:+5511999998888');
    });

    test('vazio, nulo ou curto demais não gera link', () {
      expect(ExternalLinks.phone(null), isNull);
      expect(ExternalLinks.phone('  '), isNull);
      expect(ExternalLinks.phone('123'), isNull);
    });
  });

  group('ExternalLinks.map', () {
    test('monta busca https com endereço, cidade e UF codificados', () {
      final uri = ExternalLinks.map(address: 'Av. Paulista, 1000', city: 'São Paulo', state: 'SP')!;
      expect(uri.scheme, 'https');
      expect(uri.host, 'www.google.com');
      expect(uri.path, '/maps/search/');
      expect(uri.queryParameters['api'], '1');
      expect(uri.queryParameters['query'], 'Av. Paulista, 1000, São Paulo - SP');
    });

    test('sem endereço não gera link', () {
      expect(ExternalLinks.map(address: null, city: 'São Paulo', state: 'SP'), isNull);
      expect(ExternalLinks.map(address: ' ', city: null, state: null), isNull);
    });

    test('usa só o endereço quando não há cidade', () {
      final uri = ExternalLinks.map(address: 'Rua A, 1', city: null, state: null)!;
      expect(uri.queryParameters['query'], 'Rua A, 1');
    });
  });

  group('ExternalLinkLauncher.open', () {
    test('esquemas permitidos chegam ao launcher e devolvem true', () async {
      final opened = <Uri>[];
      final launcher = ExternalLinkLauncher(launch: (uri) async {
        opened.add(uri);
        return true;
      });
      for (final raw in [
        'http://a.test',
        'https://a.test',
        'tel:11999998888',
        'mailto:a@b.test',
        'geo:0,0?q=Rua',
      ]) {
        expect(await launcher.open(Uri.parse(raw)), isTrue, reason: raw);
      }
      expect(opened, hasLength(5));
    });

    test('esquemas não permitidos são bloqueados sem chamar o launcher', () async {
      var calls = 0;
      final launcher = ExternalLinkLauncher(launch: (_) async {
        calls++;
        return true;
      });
      for (final raw in ['javascript:alert(1)', 'file:///etc/passwd', 'intent://x', 'sms:123', 'data:text/html,hi']) {
        expect(await launcher.open(Uri.parse(raw)), isFalse, reason: raw);
      }
      expect(calls, 0);
    });

    test('launcher que devolve false ou lança exceção resulta em false', () async {
      expect(await ExternalLinkLauncher(launch: (_) async => false).open(Uri.parse('tel:1199999999')), isFalse);
      expect(
        await ExternalLinkLauncher(launch: (_) async => throw Exception('sem app')).open(Uri.parse('tel:1199999999')),
        isFalse,
      );
    });
  });
}
